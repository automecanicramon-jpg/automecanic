CREATE OR REPLACE FUNCTION public.resolver_reprogramacion_cita_cliente(
  p_id_cita bigint,
  p_aceptar boolean
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
SET row_security = off
AS $$
DECLARE
  v_id_cliente bigint;
  v_id_usuario_proponente bigint;
  v_id_usuario_destinatario bigint;
  v_vehiculo text;
  v_mensaje text;
  v_cita public.cita%ROWTYPE;
BEGIN
  IF p_aceptar IS NULL THEN
    RAISE EXCEPTION 'Indica si aceptas o rechazas la propuesta.';
  END IF;

  SELECT c.id_cliente
  INTO v_id_cliente
  FROM public.cliente AS c
  JOIN public.usuario AS u ON u.id_usuario = c.id_usuario
  WHERE u.auth_id = (SELECT auth.uid())
    AND u.id_rol = 3
    AND u.estatus = 'Activo';

  IF v_id_cliente IS NULL THEN
    RAISE EXCEPTION 'No se encontró el perfil del cliente autenticado.';
  END IF;

  SELECT *
  INTO v_cita
  FROM public.cita
  WHERE id_cita = p_id_cita
    AND id_cliente = v_id_cliente
  FOR UPDATE;

  IF NOT FOUND OR v_cita.estado <> 'PROXIMA'
    OR v_cita.estado_reprogramacion IS DISTINCT FROM 'PENDIENTE'
    OR v_cita.fecha_propuesta IS NULL
    OR v_cita.hora_propuesta IS NULL THEN
    RAISE EXCEPTION 'No hay una propuesta pendiente para esta cita.';
  END IF;

  v_id_usuario_proponente := v_cita.reprogramacion_propuesta_por;

  IF p_aceptar THEN
    UPDATE public.cita
    SET fecha = fecha_propuesta,
        hora = hora_propuesta,
        estado_reprogramacion = 'ACEPTADA'
    WHERE id_cita = p_id_cita;

    v_mensaje := FORMAT(
      'El cliente aceptó la nueva fecha de la cita: %s a las %s.',
      TO_CHAR(v_cita.fecha_propuesta, 'DD/MM/YYYY'),
      TO_CHAR(v_cita.hora_propuesta, 'HH24:MI')
    );
  ELSE
    UPDATE public.cita
    SET estado = 'CANCELADA',
        estado_reprogramacion = 'RECHAZADA'
    WHERE id_cita = p_id_cita;

    v_mensaje := FORMAT(
      'El cliente rechazó la propuesta de cambio de fecha para la cita del %s a las %s; la cita fue cancelada.',
      TO_CHAR(v_cita.fecha, 'DD/MM/YYYY'),
      TO_CHAR(v_cita.hora, 'HH24:MI')
    );
  END IF;

  SELECT COALESCE(
    NULLIF(BTRIM(CONCAT_WS(' ', v.marca, v.modelo)), ''),
    'un vehículo'
  )
  INTO v_vehiculo
  FROM public.vehiculo AS v
  WHERE v.id_vehiculo = v_cita.id_vehiculo;

  SELECT u.id_usuario
  INTO v_id_usuario_destinatario
  FROM public.usuario AS u
  WHERE u.id_usuario = v_id_usuario_proponente
    AND u.id_rol IN (1, 2)
    AND u.estatus = 'Activo';

  IF v_id_usuario_destinatario IS NULL AND v_cita.id_mecanico IS NOT NULL THEN
    SELECT m.id_usuario
    INTO v_id_usuario_destinatario
    FROM public.mecanico AS m
    JOIN public.usuario AS u
      ON u.id_usuario = m.id_usuario
    WHERE m.id_mecanico = v_cita.id_mecanico
      AND u.id_rol = 2
      AND u.estatus = 'Activo';
  END IF;

  IF v_id_usuario_destinatario IS NOT NULL THEN
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
      v_cita.id_vehiculo,
      v_id_usuario_destinatario,
      'CITA_REPROGRAMACION_RESPUESTA',
      'INFO',
      FORMAT('%s Vehículo: %s.', v_mensaje, v_vehiculo),
      'PENDIENTE',
      CURRENT_DATE,
      NULL
    );
  END IF;

  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.resolver_reprogramacion_cita_cliente(bigint, boolean)
  FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolver_reprogramacion_cita_cliente(bigint, boolean)
  TO authenticated;

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
  IF NEW.tipo_alerta = 'CITA_REPROGRAMACION_RESPUESTA' THEN
    IF NOT EXISTS (
      SELECT 1
      FROM public.usuario AS u
      WHERE u.id_usuario = NEW.id_usuario
        AND u.id_rol IN (1, 2)
        AND u.estatus = 'Activo'
    ) THEN
      RETURN NEW;
    END IF;
  ELSE
    v_expected_role := CASE
      WHEN NEW.tipo_alerta IN (
        'CITA_NUEVA',
        'TRANSMISION_CLIENTE',
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

REVOKE ALL ON FUNCTION public.enviar_correo_alerta_relacion_mecanico()
  FROM PUBLIC;
