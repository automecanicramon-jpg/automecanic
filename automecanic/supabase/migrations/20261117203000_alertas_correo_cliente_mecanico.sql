CREATE OR REPLACE FUNCTION public.notificar_actualizacion_observacion_transmision_mecanico()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
SET row_security = off
AS $$
DECLARE
  v_id_mecanico text;
  v_id_usuario_cliente bigint;
  v_nombre_mecanico text;
  v_vehiculo text;
  v_placas text;
  v_accion text;
  v_mensaje text;
BEGIN
  IF NEW.estado IS NULL
    OR NEW.estado IS NOT DISTINCT FROM OLD.estado
    OR NEW.estado NOT IN ('REVISADO', 'ATENDIDO') THEN
    RETURN NEW;
  END IF;

  v_id_mecanico := public.id_mecanico_actual();
  IF v_id_mecanico IS NULL
    OR NOT public.mecanico_puede_ver_cliente(NEW.id_cliente::text) THEN
    RETURN NEW;
  END IF;

  SELECT
    c.id_usuario,
    COALESCE(
      NULLIF(BTRIM(CONCAT_WS(' ', mu.nombre, mu.apellido_paterno, mu.apellido_materno)), ''),
      'Tu mecánico'
    ),
    COALESCE(NULLIF(BTRIM(CONCAT_WS(' ', v.marca, v.modelo)), ''), 'tu vehículo'),
    COALESCE(NULLIF(BTRIM(v.placas), ''), 'sin placas')
  INTO
    v_id_usuario_cliente,
    v_nombre_mecanico,
    v_vehiculo,
    v_placas
  FROM public.cliente AS c
  JOIN public.mecanico AS m
    ON m.id_mecanico::text = v_id_mecanico
  JOIN public.usuario AS mu
    ON mu.id_usuario = m.id_usuario
  LEFT JOIN public.vehiculo AS v
    ON v.id_vehiculo = NEW.id_vehiculo
  WHERE c.id_cliente = NEW.id_cliente;

  IF v_id_usuario_cliente IS NULL THEN
    RETURN NEW;
  END IF;

  v_accion := CASE
    WHEN NEW.estado = 'REVISADO' THEN 'revisó'
    ELSE 'marcó como atendida'
  END;

  v_mensaje := FORMAT(
    '%s %s tu observación de transmisión #%s para %s (%s). Estado: %s. Revisa el detalle en tu panel.',
    v_nombre_mecanico,
    v_accion,
    NEW.id_registro,
    v_vehiculo,
    v_placas,
    NEW.estado
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
  VALUES (
    NEW.id_vehiculo,
    v_id_usuario_cliente,
    'OBSERVACION_TRANSMISION_MECANICO',
    'INFO',
    v_mensaje,
    'PENDIENTE',
    CURRENT_DATE,
    NULL
  );

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.notificar_actualizacion_observacion_transmision_mecanico() FROM PUBLIC;

DROP TRIGGER IF EXISTS notificar_actualizacion_observacion_transmision_mecanico
  ON public.registro_transmision_cliente;
CREATE TRIGGER notificar_actualizacion_observacion_transmision_mecanico
  AFTER UPDATE OF estado ON public.registro_transmision_cliente
  FOR EACH ROW
  WHEN (OLD.estado IS DISTINCT FROM NEW.estado)
  EXECUTE FUNCTION public.notificar_actualizacion_observacion_transmision_mecanico();

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
      'CITA_REPROGRAMACION_RESPUESTA'
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

REVOKE ALL ON FUNCTION public.enviar_correo_alerta_relacion_mecanico() FROM PUBLIC;

DROP TRIGGER IF EXISTS enviar_correo_alerta_relacion_mecanico
  ON public.alerta;
CREATE TRIGGER enviar_correo_alerta_relacion_mecanico
  AFTER INSERT ON public.alerta
  FOR EACH ROW
  EXECUTE FUNCTION public.enviar_correo_alerta_relacion_mecanico();
