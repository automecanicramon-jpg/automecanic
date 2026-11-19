CREATE SCHEMA IF NOT EXISTS vault;
CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

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

  INSERT INTO public.actividad_mecanico (
    id_mecanico,
    tipo_accion,
    modulo,
    descripcion,
    referencia_id
  )
  VALUES (
    p_id_mecanico,
    p_tipo_accion,
    BTRIM(p_modulo),
    BTRIM(p_descripcion),
    p_referencia_id
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

CREATE OR REPLACE FUNCTION public.notificar_accion_cita_mecanico()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
SET row_security = off
AS $$
DECLARE
  v_id_mecanico_actual text;
  v_cita public.cita%ROWTYPE;
  v_tipo_accion text;
  v_accion text;
  v_nombre_mecanico text;
  v_nombre_cliente text;
  v_vehiculo text;
  v_placas text;
  v_descripcion text;
BEGIN
  v_id_mecanico_actual := public.id_mecanico_actual();

  IF v_id_mecanico_actual IS NULL THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    END IF;

    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    v_cita := OLD;
  ELSE
    v_cita := NEW;
  END IF;

  IF v_cita.id_mecanico IS NULL
    OR v_cita.id_mecanico::text <> v_id_mecanico_actual
  THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    END IF;

    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.estado = 'PROXIMA' AND NEW.estado = 'VENCIDA' THEN
      RETURN NEW;
    END IF;

    IF OLD.estado IS NOT DISTINCT FROM NEW.estado
      AND OLD.fecha IS NOT DISTINCT FROM NEW.fecha
      AND OLD.hora IS NOT DISTINCT FROM NEW.hora
      AND OLD.fecha_propuesta IS NOT DISTINCT FROM NEW.fecha_propuesta
      AND OLD.hora_propuesta IS NOT DISTINCT FROM NEW.hora_propuesta
      AND OLD.estado_reprogramacion IS NOT DISTINCT FROM NEW.estado_reprogramacion
    THEN
      RETURN NEW;
    END IF;
  END IF;

  IF TG_OP = 'INSERT' THEN
    v_tipo_accion := 'CREAR';
    v_accion := 'registró una cita';
  ELSIF TG_OP = 'DELETE' THEN
    v_tipo_accion := 'ELIMINAR';
    v_accion := 'eliminó una cita';
  ELSE
    v_tipo_accion := 'ACTUALIZAR';
    IF OLD.estado IS DISTINCT FROM NEW.estado THEN
      v_accion := FORMAT(
        'cambió el estado de una cita de %s a %s',
        COALESCE(OLD.estado, 'sin estado'),
        COALESCE(NEW.estado, 'sin estado')
      );
    ELSIF OLD.estado_reprogramacion IS DISTINCT FROM NEW.estado_reprogramacion
      AND NEW.estado_reprogramacion = 'PENDIENTE'
    THEN
      v_accion := 'propuso reprogramar una cita';
    ELSE
      v_accion := 'actualizó la fecha u hora de una cita';
    END IF;
  END IF;

  SELECT
    COALESCE(
      NULLIF(BTRIM(CONCAT_WS(' ', mu.nombre, mu.apellido_paterno, mu.apellido_materno)), ''),
      'Mecánico'
    ),
    COALESCE(
      NULLIF(BTRIM(CONCAT_WS(' ', cu.nombre, cu.apellido_paterno, cu.apellido_materno)), ''),
      'cliente'
    ),
    COALESCE(NULLIF(BTRIM(CONCAT_WS(' ', v.marca, v.modelo)), ''), 'un vehículo'),
    COALESCE(NULLIF(BTRIM(v.placas), ''), 'sin placas')
  INTO v_nombre_mecanico, v_nombre_cliente, v_vehiculo, v_placas
  FROM public.mecanico AS m
  JOIN public.usuario AS mu
    ON mu.id_usuario = m.id_usuario
  LEFT JOIN public.cliente AS c
    ON c.id_cliente = v_cita.id_cliente
  LEFT JOIN public.usuario AS cu
    ON cu.id_usuario = c.id_usuario
  LEFT JOIN public.vehiculo AS v
    ON v.id_vehiculo = v_cita.id_vehiculo
  WHERE m.id_mecanico::text = v_id_mecanico_actual;

  v_descripcion := FORMAT(
    'El mecánico %s %s para el cliente %s, cita #%s de %s (%s), estado: %s.',
    v_nombre_mecanico,
    v_accion,
    v_nombre_cliente,
    v_cita.id_cita,
    v_vehiculo,
    v_placas,
    COALESCE(v_cita.estado, 'sin estado')
  );

  PERFORM public.registrar_accion_mecanico_y_notificar_admin(
    v_id_mecanico_actual::bigint,
    v_tipo_accion,
    'Citas',
    v_descripcion,
    v_cita.id_cita,
    v_cita.id_vehiculo
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.notificar_accion_cita_mecanico() FROM PUBLIC;

DROP TRIGGER IF EXISTS notificar_accion_cita_mecanico
  ON public.cita;
CREATE TRIGGER notificar_accion_cita_mecanico
  AFTER INSERT OR UPDATE OF estado, fecha, hora, fecha_propuesta, hora_propuesta, estado_reprogramacion
    OR DELETE ON public.cita
  FOR EACH ROW
  EXECUTE FUNCTION public.notificar_accion_cita_mecanico();

CREATE OR REPLACE FUNCTION public.enviar_correo_accion_mecanico_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
SET row_security = off
AS $$
DECLARE
  v_service_role_key text;
BEGIN
  IF NEW.tipo_alerta <> 'ACCION_MECANICO' OR NOT EXISTS (
    SELECT 1
    FROM public.usuario AS u
    WHERE u.id_usuario = NEW.id_usuario
      AND u.id_rol = 1
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
    RAISE WARNING 'No se encoló el correo de la acción del mecánico: falta el secreto Vault automecanic_service_role_key.';
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url := 'https://noqknvwnejvauxzsbdsy.supabase.co/functions/v1/notificar-accion-mecanico',
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

REVOKE ALL ON FUNCTION public.enviar_correo_accion_mecanico_admin() FROM PUBLIC;

DROP TRIGGER IF EXISTS enviar_correo_accion_mecanico_admin
  ON public.alerta;
CREATE TRIGGER enviar_correo_accion_mecanico_admin
  AFTER INSERT ON public.alerta
  FOR EACH ROW
  EXECUTE FUNCTION public.enviar_correo_accion_mecanico_admin();
