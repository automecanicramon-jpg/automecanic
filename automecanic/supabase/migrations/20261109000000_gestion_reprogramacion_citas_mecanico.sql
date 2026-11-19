ALTER TABLE public.cita
  ADD COLUMN IF NOT EXISTS fecha_propuesta date,
  ADD COLUMN IF NOT EXISTS hora_propuesta time,
  ADD COLUMN IF NOT EXISTS estado_reprogramacion text;

CREATE OR REPLACE FUNCTION public.proponer_reprogramacion_cita(
  p_id_cita bigint,
  p_fecha date,
  p_hora time
)
RETURNS boolean
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
  v_mensaje text;
  v_cita public.cita%ROWTYPE;
BEGIN
  v_id_mecanico := public.id_mecanico_actual();
  IF v_id_mecanico IS NULL THEN
    RAISE EXCEPTION 'No se encontró el mecánico autenticado.';
  END IF;

  IF p_fecha IS NULL OR p_hora IS NULL
    OR (p_fecha + p_hora) <= CURRENT_TIMESTAMP THEN
    RAISE EXCEPTION 'La fecha y hora propuestas deben ser futuras.';
  END IF;

  SELECT *
  INTO v_cita
  FROM public.cita
  WHERE id_cita = p_id_cita
    AND id_mecanico::text = v_id_mecanico
  FOR UPDATE;

  IF NOT FOUND OR v_cita.estado <> 'PROXIMA' THEN
    RAISE EXCEPTION 'La cita no existe, no está asignada a este mecánico o ya no está disponible.';
  END IF;

  IF v_cita.estado_reprogramacion = 'PENDIENTE' THEN
    RAISE EXCEPTION 'Esta cita ya tiene una propuesta de cambio pendiente.';
  END IF;

  IF v_cita.fecha = p_fecha AND v_cita.hora = p_hora THEN
    RAISE EXCEPTION 'La fecha y hora propuestas deben ser diferentes a las actuales.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.cita AS c
    WHERE c.id_mecanico::text = v_id_mecanico
      AND c.id_cita <> p_id_cita
      AND c.fecha = p_fecha
      AND c.hora = p_hora
      AND c.estado IN ('PROXIMA', 'EN_ATENCION')
  ) THEN
    RAISE EXCEPTION 'Ya tienes otra cita activa en esa fecha y hora.';
  END IF;

  SELECT c.id_usuario,
    COALESCE(NULLIF(BTRIM(CONCAT_WS(' ', u.nombre, u.apellido_paterno, u.apellido_materno)), ''), 'Tu mecánico'),
    COALESCE(NULLIF(BTRIM(CONCAT_WS(' ', v.marca, v.modelo)), ''), 'tu vehículo'),
    COALESCE(NULLIF(BTRIM(v.placas), ''), 'sin placas')
  INTO v_id_usuario_cliente, v_nombre_mecanico, v_vehiculo, v_placas
  FROM public.cliente AS c
  JOIN public.mecanico AS m ON m.id_mecanico::text = v_id_mecanico
  JOIN public.usuario AS u ON u.id_usuario = m.id_usuario
  LEFT JOIN public.vehiculo AS v ON v.id_vehiculo = v_cita.id_vehiculo
  WHERE c.id_cliente = v_cita.id_cliente;

  IF v_id_usuario_cliente IS NULL THEN
    RAISE EXCEPTION 'No se encontró el cliente asociado a la cita.';
  END IF;

  UPDATE public.cita
  SET fecha_propuesta = p_fecha,
      hora_propuesta = p_hora,
      estado_reprogramacion = 'PENDIENTE'
  WHERE id_cita = p_id_cita;

  v_mensaje := FORMAT(
    '%s propone cambiar tu cita de %s a las %s a %s a las %s para %s (%s). Revisa la propuesta en Mis citas.',
    v_nombre_mecanico,
    TO_CHAR(v_cita.fecha, 'DD/MM/YYYY'),
    TO_CHAR(v_cita.hora, 'HH24:MI'),
    TO_CHAR(p_fecha, 'DD/MM/YYYY'),
    TO_CHAR(p_hora, 'HH24:MI'),
    v_vehiculo,
    v_placas
  );

  INSERT INTO public.alerta (
    id_vehiculo, id_usuario, tipo_alerta, nivel, mensaje, estado,
    fecha_programada, fecha_lectura
  )
  VALUES (
    v_cita.id_vehiculo, v_id_usuario_cliente, 'CITA_REPROGRAMACION_PROPUESTA',
    'ADVERTENCIA', v_mensaje, 'PENDIENTE', CURRENT_DATE, NULL
  );

  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.rechazar_cita_mecanico(p_id_cita bigint)
RETURNS boolean
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
  v_mensaje text;
  v_cita public.cita%ROWTYPE;
BEGIN
  v_id_mecanico := public.id_mecanico_actual();
  IF v_id_mecanico IS NULL THEN
    RAISE EXCEPTION 'No se encontró el mecánico autenticado.';
  END IF;

  SELECT *
  INTO v_cita
  FROM public.cita
  WHERE id_cita = p_id_cita
    AND id_mecanico::text = v_id_mecanico
  FOR UPDATE;

  IF NOT FOUND OR v_cita.estado <> 'PROXIMA' THEN
    RAISE EXCEPTION 'La cita no existe, no está asignada a este mecánico o ya no está disponible.';
  END IF;

  SELECT c.id_usuario,
    COALESCE(NULLIF(BTRIM(CONCAT_WS(' ', u.nombre, u.apellido_paterno, u.apellido_materno)), ''), 'Tu mecánico'),
    COALESCE(NULLIF(BTRIM(CONCAT_WS(' ', v.marca, v.modelo)), ''), 'tu vehículo')
  INTO v_id_usuario_cliente, v_nombre_mecanico, v_vehiculo
  FROM public.cliente AS c
  JOIN public.mecanico AS m ON m.id_mecanico::text = v_id_mecanico
  JOIN public.usuario AS u ON u.id_usuario = m.id_usuario
  LEFT JOIN public.vehiculo AS v ON v.id_vehiculo = v_cita.id_vehiculo
  WHERE c.id_cliente = v_cita.id_cliente;

  IF v_id_usuario_cliente IS NULL THEN
    RAISE EXCEPTION 'No se encontró el cliente asociado a la cita.';
  END IF;

  UPDATE public.cita
  SET estado = 'CANCELADA',
      estado_reprogramacion = 'RECHAZADA'
  WHERE id_cita = p_id_cita;

  v_mensaje := FORMAT(
    '%s no puede atender tu solicitud de cita para %s el %s a las %s. Comunícate con el taller para coordinar otra fecha.',
    v_nombre_mecanico,
    v_vehiculo,
    TO_CHAR(v_cita.fecha, 'DD/MM/YYYY'),
    TO_CHAR(v_cita.hora, 'HH24:MI')
  );

  INSERT INTO public.alerta (
    id_vehiculo, id_usuario, tipo_alerta, nivel, mensaje, estado,
    fecha_programada, fecha_lectura
  )
  VALUES (
    v_cita.id_vehiculo, v_id_usuario_cliente, 'CITA_RECHAZADA_MECANICO',
    'ADVERTENCIA', v_mensaje, 'PENDIENTE', CURRENT_DATE, NULL
  );

  RETURN TRUE;
END;
$$;

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
  v_id_usuario_cliente bigint;
  v_id_usuario_mecanico bigint;
  v_vehiculo text;
  v_mensaje text;
  v_cita public.cita%ROWTYPE;
BEGIN
  SELECT c.id_cliente, c.id_usuario
  INTO v_id_cliente, v_id_usuario_cliente
  FROM public.cliente AS c
  JOIN public.usuario AS u ON u.id_usuario = c.id_usuario
  WHERE u.auth_id = (SELECT auth.uid());

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
    OR v_cita.estado_reprogramacion <> 'PENDIENTE'
    OR v_cita.fecha_propuesta IS NULL
    OR v_cita.hora_propuesta IS NULL THEN
    RAISE EXCEPTION 'No hay una propuesta pendiente para esta cita.';
  END IF;

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

  SELECT COALESCE(NULLIF(BTRIM(CONCAT_WS(' ', v.marca, v.modelo)), ''), 'un vehículo')
  INTO v_vehiculo
  FROM public.vehiculo AS v
  WHERE v.id_vehiculo = v_cita.id_vehiculo;

  SELECT m.id_usuario
  INTO v_id_usuario_mecanico
  FROM public.mecanico AS m
  WHERE m.id_mecanico = v_cita.id_mecanico;

  IF v_id_usuario_mecanico IS NOT NULL THEN
    INSERT INTO public.alerta (
      id_vehiculo, id_usuario, tipo_alerta, nivel, mensaje, estado,
      fecha_programada, fecha_lectura
    )
    VALUES (
      v_cita.id_vehiculo, v_id_usuario_mecanico, 'CITA_REPROGRAMACION_RESPUESTA',
      'INFO', FORMAT('%s Vehículo: %s.', v_mensaje, v_vehiculo),
      'PENDIENTE', CURRENT_DATE, NULL
    );
  END IF;

  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.proponer_reprogramacion_cita(bigint, date, time) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.rechazar_cita_mecanico(bigint) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.resolver_reprogramacion_cita_cliente(bigint, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.proponer_reprogramacion_cita(bigint, date, time) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rechazar_cita_mecanico(bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.resolver_reprogramacion_cita_cliente(bigint, boolean) TO authenticated;
