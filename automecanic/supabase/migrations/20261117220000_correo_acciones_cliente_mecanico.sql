CREATE OR REPLACE FUNCTION public.registrar_accion_mecanico_y_notificar_admin(
  p_id_mecanico bigint,
  p_tipo_accion text,
  p_modulo text,
  p_descripcion text,
  p_referencia_id bigint DEFAULT NULL,
  p_id_vehiculo bigint DEFAULT NULL
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
SET row_security = off
AS $$
DECLARE
  v_id_actividad bigint;
  v_id_cliente integer;
BEGIN
  IF p_id_mecanico IS NULL OR NOT EXISTS (
    SELECT 1
    FROM public.mecanico AS m
    WHERE m.id_mecanico = p_id_mecanico
  ) THEN
    RAISE EXCEPTION 'No se encontró el mecánico de la acción.';
  END IF;

  IF p_tipo_accion IS NULL
    OR p_tipo_accion NOT IN ('CREAR', 'ACTUALIZAR', 'ELIMINAR')
    OR NULLIF(BTRIM(p_modulo), '') IS NULL
    OR NULLIF(BTRIM(p_descripcion), '') IS NULL
  THEN
    RAISE EXCEPTION 'La acción del mecánico está incompleta.';
  END IF;

  IF p_modulo = 'Clientes' AND p_referencia_id IS NOT NULL THEN
    SELECT c.id_cliente
    INTO v_id_cliente
    FROM public.cliente AS c
    WHERE c.id_cliente = p_referencia_id;
  ELSIF p_id_vehiculo IS NOT NULL THEN
    SELECT v.id_cliente
    INTO v_id_cliente
    FROM public.vehiculo AS v
    WHERE v.id_vehiculo = p_id_vehiculo;
  END IF;

  INSERT INTO public.actividad_mecanico (
    id_mecanico,
    tipo_accion,
    modulo,
    descripcion,
    referencia_id,
    id_vehiculo,
    id_cliente
  )
  VALUES (
    p_id_mecanico,
    p_tipo_accion,
    BTRIM(p_modulo),
    BTRIM(p_descripcion),
    p_referencia_id,
    p_id_vehiculo,
    v_id_cliente
  )
  RETURNING id_actividad INTO v_id_actividad;

  INSERT INTO public.alerta (
    id_vehiculo,
    id_usuario,
    tipo_alerta,
    nivel,
    mensaje,
    estado,
    fecha_programada,
    fecha_lectura
  )
  SELECT
    p_id_vehiculo,
    u.id_usuario,
    'ACCION_MECANICO',
    'INFO',
    BTRIM(p_descripcion),
    'PENDIENTE',
    CURRENT_DATE,
    NULL
  FROM public.usuario AS u
  WHERE u.id_rol = 1
    AND u.estatus = 'Activo';

  RETURN v_id_actividad;
END;
$$;

REVOKE ALL ON FUNCTION public.registrar_accion_mecanico_y_notificar_admin(
  bigint, text, text, text, bigint, bigint
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.registrar_accion_mecanico_y_notificar_admin(
  bigint, text, text, text, bigint, bigint
) TO service_role;

CREATE OR REPLACE FUNCTION public.notificar_cancelacion_cita_cliente_mecanico()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
SET row_security = off
AS $$
DECLARE
  v_id_cliente_autenticado integer;
  v_mensaje text;
BEGIN
  IF OLD.estado IS DISTINCT FROM 'PROXIMA'
    OR NEW.estado IS DISTINCT FROM 'CANCELADA'
    OR (
      OLD.estado_reprogramacion = 'PENDIENTE'
      AND NEW.estado_reprogramacion = 'RECHAZADA'
    ) THEN
    RETURN NEW;
  END IF;

  SELECT c.id_cliente
  INTO v_id_cliente_autenticado
  FROM public.cliente AS c
  JOIN public.usuario AS u
    ON u.id_usuario = c.id_usuario
  WHERE c.id_cliente = NEW.id_cliente
    AND u.auth_id = (SELECT auth.uid())
    AND u.id_rol = 3
    AND u.estatus = 'Activo';

  IF v_id_cliente_autenticado IS NULL THEN
    RETURN NEW;
  END IF;

  v_mensaje := FORMAT(
    'El cliente canceló su cita #%s para el %s a las %s.',
    NEW.id_cita,
    TO_CHAR(NEW.fecha, 'DD/MM/YYYY'),
    TO_CHAR(NEW.hora, 'HH24:MI')
  );

  INSERT INTO public.alerta (
    id_vehiculo,
    id_usuario,
    tipo_alerta,
    nivel,
    mensaje,
    estado,
    fecha_programada,
    fecha_lectura
  )
  SELECT
    NEW.id_vehiculo,
    destinatarios.id_usuario,
    'CITA_CANCELADA_CLIENTE',
    'INFO',
    v_mensaje,
    'PENDIENTE',
    CURRENT_DATE,
    NULL
  FROM (
    SELECT m.id_usuario
    FROM public.mecanico AS m
    WHERE NEW.id_mecanico IS NOT NULL
      AND m.id_mecanico = NEW.id_mecanico

    UNION

    SELECT m.id_usuario
    FROM public.mecanico AS m
    JOIN public.vehiculo AS v
      ON v.id_mecanico = m.id_mecanico
    WHERE NEW.id_mecanico IS NULL
      AND v.id_vehiculo = NEW.id_vehiculo

    UNION

    SELECT m.id_usuario
    FROM public.mecanico_cliente AS mc
    JOIN public.mecanico AS m
      ON m.id_mecanico = mc.id_mecanico
    WHERE NEW.id_mecanico IS NULL
      AND mc.id_cliente = NEW.id_cliente
  ) AS destinatarios
  JOIN public.usuario AS u
    ON u.id_usuario = destinatarios.id_usuario
  WHERE u.id_rol = 2
    AND u.estatus = 'Activo';

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.notificar_cancelacion_cita_cliente_mecanico() FROM PUBLIC;

DROP TRIGGER IF EXISTS notificar_cancelacion_cita_cliente_mecanico
  ON public.cita;
CREATE TRIGGER notificar_cancelacion_cita_cliente_mecanico
  AFTER UPDATE OF estado ON public.cita
  FOR EACH ROW
  WHEN (
    OLD.estado IS DISTINCT FROM NEW.estado
    AND NEW.estado = 'CANCELADA'
  )
  EXECUTE FUNCTION public.notificar_cancelacion_cita_cliente_mecanico();

CREATE OR REPLACE FUNCTION public.enviar_correo_alerta_relacion_mecanico()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
SET row_security = off
AS $$
DECLARE
  v_service_role_key text;
  v_expected_role integer;
BEGIN
  v_expected_role := CASE
    WHEN NEW.tipo_alerta IN (
      'CITA_NUEVA',
      'TRANSMISION_CLIENTE',
      'CITA_REPROGRAMACION_RESPUESTA',
      'CITA_CANCELADA_CLIENTE'
    ) THEN 2
    WHEN NEW.tipo_alerta IN (
      'ACCION_MECANICO_CLIENTE',
      'CITA_CONFIRMADA_MECANICO',
      'CITA_REPROGRAMACION_PROPUESTA',
      'CITA_RECHAZADA_MECANICO',
      'CITA_CANCELADA',
      'CITA_VISTA_MECANICO',
      'TRANSMISION_VISTA_MECANICO',
      'OBSERVACION_TRANSMISION_MECANICO'
    ) THEN 3
    ELSE NULL
  END;

  IF v_expected_role IS NULL OR NOT EXISTS (
    SELECT 1
    FROM public.usuario AS u
    WHERE u.id_usuario = NEW.id_usuario
      AND u.id_rol = v_expected_role
      AND u.estatus = 'Activo'
  ) THEN
    RETURN NEW;
  END IF;

  SELECT decrypted_secret
  INTO v_service_role_key
  FROM vault.decrypted_secrets
  WHERE name = 'automecanic_service_role_key'
  LIMIT 1;

  IF NULLIF(v_service_role_key, '') IS NULL THEN
    RAISE WARNING 'No se encoló el correo de la alerta cliente-mecánico: falta el secreto Vault automecanic_service_role_key.';
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url := 'https://noqknvwnejvauxzsbdsy.supabase.co/functions/v1/notificar-alerta-relacion-mecanico',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_service_role_key,
      'apikey', v_service_role_key
    ),
    body := jsonb_build_object(
      'id_alerta', NEW.id_alerta
    )
  );

  RETURN NEW;
END;
$$;
