CREATE OR REPLACE FUNCTION public.notificar_nueva_observacion_transmision()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
SET row_security = off
AS $$
DECLARE
  v_nombre_cliente text;
  v_nombre_vehiculo text;
  v_sintomas text;
  v_mensaje text;
BEGIN
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

  SELECT STRING_AGG(sintoma, ', ')
  INTO v_sintomas
  FROM JSONB_ARRAY_ELEMENTS_TEXT(
    COALESCE(TO_JSONB(NEW.sintomas), '[]'::jsonb)
  ) AS sintomas(sintoma);

  v_mensaje := FORMAT(
    '%s registró una observación de transmisión para %s (%s) el %s. Síntomas: %s. Descripción: %s. Atención externa: %s.',
    v_nombre_cliente,
    COALESCE(NULLIF(v_nombre_vehiculo, ''), 'un vehículo'),
    COALESCE(
      (SELECT NULLIF(BTRIM(v.placas), '') FROM public.vehiculo AS v WHERE v.id_vehiculo = NEW.id_vehiculo),
      'sin placas'
    ),
    TO_CHAR(NEW.fecha_observacion, 'DD/MM/YYYY'),
    COALESCE(v_sintomas, 'sin síntomas especificados'),
    COALESCE(NULLIF(BTRIM(NEW.descripcion), ''), 'sin descripción'),
    CASE
      WHEN NEW.atencion_externa
        THEN COALESCE(NULLIF(BTRIM(NEW.detalle_atencion_externa), ''), 'sí, sin detalle')
      ELSE 'no'
    END
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
    'TRANSMISION_CLIENTE',
    'INFO',
    v_mensaje,
    'PENDIENTE',
    CURRENT_DATE,
    NULL
  FROM (
    SELECT m.id_usuario
    FROM public.vehiculo AS v
    JOIN public.mecanico AS m
      ON m.id_mecanico = v.id_mecanico
    WHERE v.id_vehiculo = NEW.id_vehiculo

    UNION

    SELECT m.id_usuario
    FROM public.mecanico_cliente AS mc
    JOIN public.mecanico AS m
      ON m.id_mecanico = mc.id_mecanico
    WHERE mc.id_cliente = NEW.id_cliente
  ) AS destinatarios
  WHERE destinatarios.id_usuario IS NOT NULL;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.notificar_nueva_observacion_transmision() FROM PUBLIC;

DROP TRIGGER IF EXISTS notificar_nueva_observacion_transmision
  ON public.registro_transmision_cliente;
CREATE TRIGGER notificar_nueva_observacion_transmision
  AFTER INSERT ON public.registro_transmision_cliente
  FOR EACH ROW
  EXECUTE FUNCTION public.notificar_nueva_observacion_transmision();

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_publication
    WHERE pubname = 'supabase_realtime'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'registro_transmision_cliente'
  ) THEN
    ALTER PUBLICATION supabase_realtime
      ADD TABLE public.registro_transmision_cliente;
  END IF;
END;
$$;

WITH registros_recientes AS (
  SELECT *
  FROM public.registro_transmision_cliente
  WHERE fecha_registro >= CURRENT_TIMESTAMP - INTERVAL '7 days'
),
destinatarios AS (
  SELECT
    r.id_registro,
    r.id_cliente,
    r.id_vehiculo,
    r.fecha_observacion,
    r.sintomas,
    r.descripcion,
    r.atencion_externa,
    r.detalle_atencion_externa,
    m.id_usuario
  FROM registros_recientes AS r
  JOIN public.vehiculo AS v
    ON v.id_vehiculo = r.id_vehiculo
  JOIN public.mecanico AS m
    ON m.id_mecanico = v.id_mecanico

  UNION

  SELECT
    r.id_registro,
    r.id_cliente,
    r.id_vehiculo,
    r.fecha_observacion,
    r.sintomas,
    r.descripcion,
    r.atencion_externa,
    r.detalle_atencion_externa,
    m.id_usuario
  FROM registros_recientes AS r
  JOIN public.mecanico_cliente AS mc
    ON mc.id_cliente = r.id_cliente
  JOIN public.mecanico AS m
    ON m.id_mecanico = mc.id_mecanico
),
sintomas_registro AS (
  SELECT
    r.id_registro,
    STRING_AGG(s.sintoma, ', ') AS sintomas
  FROM registros_recientes AS r
  CROSS JOIN LATERAL JSONB_ARRAY_ELEMENTS_TEXT(
    COALESCE(TO_JSONB(r.sintomas), '[]'::jsonb)
  ) AS s(sintoma)
  GROUP BY r.id_registro
),
alertas_transmision AS (
  SELECT
    d.id_vehiculo,
    d.id_usuario,
    FORMAT(
      '%s registró una observación de transmisión para %s (%s) el %s. Síntomas: %s. Descripción: %s. Atención externa: %s.',
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
      COALESCE(
        NULLIF(
          BTRIM(CONCAT_WS(' ', v.marca, v.modelo)),
          ''
        ),
        'un vehículo'
      ),
      COALESCE(NULLIF(BTRIM(v.placas), ''), 'sin placas'),
      TO_CHAR(d.fecha_observacion, 'DD/MM/YYYY'),
      COALESCE(sr.sintomas, 'sin síntomas especificados'),
      COALESCE(NULLIF(BTRIM(d.descripcion), ''), 'sin descripción'),
      CASE
        WHEN d.atencion_externa
          THEN COALESCE(NULLIF(BTRIM(d.detalle_atencion_externa), ''), 'sí, sin detalle')
        ELSE 'no'
      END
    ) AS mensaje
  FROM destinatarios AS d
  JOIN public.usuario AS u
    ON u.id_usuario = d.id_usuario
  LEFT JOIN public.vehiculo AS v
    ON v.id_vehiculo = d.id_vehiculo
  LEFT JOIN sintomas_registro AS sr
    ON sr.id_registro = d.id_registro
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
  at.id_vehiculo,
  at.id_usuario,
  'TRANSMISION_CLIENTE',
  'INFO',
  at.mensaje,
  'PENDIENTE',
  CURRENT_DATE,
  NULL
FROM alertas_transmision AS at
WHERE NOT EXISTS (
  SELECT 1
  FROM public.alerta AS a
  WHERE a.id_usuario = at.id_usuario
    AND a.id_vehiculo IS NOT DISTINCT FROM at.id_vehiculo
    AND a.tipo_alerta = 'TRANSMISION_CLIENTE'
    AND a.mensaje = at.mensaje
);
