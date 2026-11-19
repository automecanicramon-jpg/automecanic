DROP POLICY IF EXISTS "mechanic_select_own_activity"
  ON public.actividad_mecanico;
CREATE POLICY "mechanic_select_own_activity"
  ON public.actividad_mecanico
  FOR SELECT
  TO authenticated
  USING (id_mecanico::text = (SELECT public.id_mecanico_actual()));

DROP POLICY IF EXISTS "mechanic_select_assigned_appointments"
  ON public.cita;
CREATE POLICY "mechanic_select_assigned_appointments"
  ON public.cita
  FOR SELECT
  TO authenticated
  USING (
    public.usuario_es_administrador_actual()
    OR id_mecanico::text = (SELECT public.id_mecanico_actual())
    OR (SELECT public.mecanico_puede_ver_cliente(id_cliente::text))
  );

DROP POLICY IF EXISTS "user_select_own_alerts"
  ON public.alerta;
CREATE POLICY "user_select_own_alerts"
  ON public.alerta
  FOR SELECT
  TO authenticated
  USING (
    id_usuario IN (
      SELECT u.id_usuario
      FROM public.usuario AS u
      WHERE u.auth_id = (SELECT auth.uid())
    )
    OR (SELECT public.usuario_es_administrador_actual())
  );

DROP POLICY IF EXISTS "user_update_own_alerts"
  ON public.alerta;
CREATE POLICY "user_update_own_alerts"
  ON public.alerta
  FOR UPDATE
  TO authenticated
  USING (
    id_usuario IN (
      SELECT u.id_usuario
      FROM public.usuario AS u
      WHERE u.auth_id = (SELECT auth.uid())
    )
    OR (SELECT public.usuario_es_administrador_actual())
  )
  WITH CHECK (
    id_usuario IN (
      SELECT u.id_usuario
      FROM public.usuario AS u
      WHERE u.auth_id = (SELECT auth.uid())
    )
    OR (SELECT public.usuario_es_administrador_actual())
  );

DROP POLICY IF EXISTS "mechanic_select_assigned_transmission_observations"
  ON public.registro_transmision_cliente;
CREATE POLICY "mechanic_select_assigned_transmission_observations"
  ON public.registro_transmision_cliente
  FOR SELECT
  TO authenticated
  USING (
    (SELECT public.mecanico_puede_ver_cliente(id_cliente::text))
  );

CREATE OR REPLACE FUNCTION public.actualizar_citas_vencidas_mecanico()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
SET row_security = off
AS $$
DECLARE
  v_id_mecanico text;
  v_total integer;
BEGIN
  v_id_mecanico := public.id_mecanico_actual();

  IF v_id_mecanico IS NULL THEN
    RAISE EXCEPTION 'No se encontró el mecánico autenticado.';
  END IF;

  UPDATE public.cita AS c
  SET estado = 'VENCIDA'
  WHERE c.estado = 'PROXIMA'
    AND (c.fecha + c.hora) < CURRENT_TIMESTAMP
    AND (
      c.id_mecanico::text = v_id_mecanico
      OR public.mecanico_puede_ver_cliente(c.id_cliente::text)
    );

  GET DIAGNOSTICS v_total = ROW_COUNT;
  RETURN v_total;
END;
$$;

REVOKE ALL ON FUNCTION public.actualizar_citas_vencidas_mecanico() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.actualizar_citas_vencidas_mecanico() TO authenticated;

CREATE OR REPLACE FUNCTION public.cambiar_estado_cita_mecanico(
  p_id_cita bigint,
  p_estado text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
SET row_security = off
AS $$
DECLARE
  v_id_mecanico text;
  v_estado_actual text;
  v_estado_destino text;
BEGIN
  v_id_mecanico := public.id_mecanico_actual();
  v_estado_destino := UPPER(BTRIM(COALESCE(p_estado, '')));

  IF v_id_mecanico IS NULL THEN
    RAISE EXCEPTION 'No se encontró el mecánico autenticado.';
  END IF;

  IF v_estado_destino NOT IN ('EN_ATENCION', 'ATENDIDA') THEN
    RAISE EXCEPTION 'La transición solicitada no está permitida.';
  END IF;

  SELECT c.estado
  INTO v_estado_actual
  FROM public.cita AS c
  WHERE c.id_cita = p_id_cita
    AND c.id_mecanico::text = v_id_mecanico
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'La cita no existe o no está asignada a este mecánico.';
  END IF;

  IF NOT (
    (v_estado_actual = 'PROXIMA' AND v_estado_destino = 'EN_ATENCION')
    OR (v_estado_actual = 'EN_ATENCION' AND v_estado_destino = 'ATENDIDA')
  ) THEN
    RAISE EXCEPTION 'No se puede cambiar una cita de % a %.', v_estado_actual, v_estado_destino;
  END IF;

  UPDATE public.cita
  SET estado = v_estado_destino
  WHERE id_cita = p_id_cita;

  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.cambiar_estado_cita_mecanico(bigint, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cambiar_estado_cita_mecanico(bigint, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.notificar_nueva_cita_mecanico()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
SET row_security = off
AS $$
DECLARE
  v_nombre_cliente text;
  v_nombre_vehiculo text;
  v_mensaje text;
BEGIN
  IF COALESCE(NEW.estado, '') <> 'PROXIMA' THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(
    NULLIF(
      BTRIM(
        CONCAT_WS(
          ' ',
          u.nombre,
          u.apellido_paterno,
          u.apellido_materno
        )
      ),
      ''
    ),
    'Un cliente'
  )
  INTO v_nombre_cliente
  FROM public.cliente AS c
  JOIN public.usuario AS u
    ON u.id_usuario = c.id_usuario
  WHERE c.id_cliente = NEW.id_cliente;

  SELECT CONCAT_WS(
    ' ',
    NULLIF(BTRIM(v.marca), ''),
    NULLIF(BTRIM(v.modelo), '')
  )
  INTO v_nombre_vehiculo
  FROM public.vehiculo AS v
  WHERE v.id_vehiculo = NEW.id_vehiculo;

  v_mensaje := FORMAT(
    '%s solicitó una cita para el %s a las %s, para %s (%s). Motivo: %s.',
    v_nombre_cliente,
    TO_CHAR(NEW.fecha, 'DD/MM/YYYY'),
    TO_CHAR(NEW.hora, 'HH24:MI'),
    COALESCE(NULLIF(v_nombre_vehiculo, ''), 'un vehículo'),
    COALESCE(
      (SELECT NULLIF(BTRIM(v.placas), '') FROM public.vehiculo AS v WHERE v.id_vehiculo = NEW.id_vehiculo),
      'sin placas'
    ),
    COALESCE(NULLIF(BTRIM(NEW.motivo), ''), 'sin motivo especificado')
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
    'CITA_NUEVA',
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
  WHERE destinatarios.id_usuario IS NOT NULL;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.notificar_nueva_cita_mecanico() FROM PUBLIC;

DROP TRIGGER IF EXISTS notificar_nueva_cita_mecanico
  ON public.cita;
CREATE TRIGGER notificar_nueva_cita_mecanico
  AFTER INSERT ON public.cita
  FOR EACH ROW
  EXECUTE FUNCTION public.notificar_nueva_cita_mecanico();

WITH destinatarios_cita AS (
  SELECT
    c.id_cita,
    c.id_cliente,
    c.id_vehiculo,
    c.fecha,
    c.hora,
    c.motivo,
    m.id_usuario
  FROM public.cita AS c
  JOIN public.mecanico AS m
    ON m.id_mecanico = c.id_mecanico
  WHERE c.estado IN ('PROXIMA', 'EN_ATENCION')
    AND c.fecha_registro >= CURRENT_TIMESTAMP - INTERVAL '7 days'

  UNION

  SELECT
    c.id_cita,
    c.id_cliente,
    c.id_vehiculo,
    c.fecha,
    c.hora,
    c.motivo,
    m.id_usuario
  FROM public.cita AS c
  JOIN public.vehiculo AS v
    ON v.id_vehiculo = c.id_vehiculo
  JOIN public.mecanico AS m
    ON m.id_mecanico = v.id_mecanico
  WHERE c.id_mecanico IS NULL
    AND c.estado IN ('PROXIMA', 'EN_ATENCION')
    AND c.fecha_registro >= CURRENT_TIMESTAMP - INTERVAL '7 days'

  UNION

  SELECT
    c.id_cita,
    c.id_cliente,
    c.id_vehiculo,
    c.fecha,
    c.hora,
    c.motivo,
    m.id_usuario
  FROM public.cita AS c
  JOIN public.mecanico_cliente AS mc
    ON mc.id_cliente = c.id_cliente
  JOIN public.mecanico AS m
    ON m.id_mecanico = mc.id_mecanico
  WHERE c.id_mecanico IS NULL
    AND c.estado IN ('PROXIMA', 'EN_ATENCION')
    AND c.fecha_registro >= CURRENT_TIMESTAMP - INTERVAL '7 days'
),
alertas_cita AS (
  SELECT
    dc.*,
    FORMAT(
      '%s solicitó una cita para el %s a las %s, para %s (%s). Motivo: %s.',
      COALESCE(
        NULLIF(
          BTRIM(
            CONCAT_WS(
              ' ',
              u.nombre,
              u.apellido_paterno,
              u.apellido_materno
            )
          ),
          ''
        ),
        'Un cliente'
      ),
      TO_CHAR(dc.fecha, 'DD/MM/YYYY'),
      TO_CHAR(dc.hora, 'HH24:MI'),
      COALESCE(
        NULLIF(
          BTRIM(CONCAT_WS(' ', v.marca, v.modelo)),
          ''
        ),
        'un vehículo'
      ),
      COALESCE(NULLIF(BTRIM(v.placas), ''), 'sin placas'),
      COALESCE(NULLIF(BTRIM(dc.motivo), ''), 'sin motivo especificado')
    ) AS mensaje
  FROM destinatarios_cita AS dc
  JOIN public.cliente AS c
    ON c.id_cliente = dc.id_cliente
  JOIN public.usuario AS u
    ON u.id_usuario = c.id_usuario
  LEFT JOIN public.vehiculo AS v
    ON v.id_vehiculo = dc.id_vehiculo
)
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
  ac.id_vehiculo,
  ac.id_usuario,
  'CITA_NUEVA',
  'INFO',
  ac.mensaje,
  'PENDIENTE',
  CURRENT_DATE,
  NULL
FROM alertas_cita AS ac
WHERE NOT EXISTS (
  SELECT 1
  FROM public.alerta AS a
  WHERE a.id_usuario = ac.id_usuario
    AND a.id_vehiculo IS NOT DISTINCT FROM ac.id_vehiculo
    AND a.tipo_alerta = 'CITA_NUEVA'
    AND a.mensaje = ac.mensaje
);
