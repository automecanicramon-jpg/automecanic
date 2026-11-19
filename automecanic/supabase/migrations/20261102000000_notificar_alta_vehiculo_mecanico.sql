CREATE OR REPLACE FUNCTION public.notificar_alta_vehiculo_mecanico()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
SET row_security = off
AS $$
DECLARE
  v_id_mecanico_actual text;
  v_nombre_mecanico text;
  v_descripcion text;
BEGIN
  v_id_mecanico_actual := public.id_mecanico_actual();

  IF v_id_mecanico_actual IS NULL
    OR NEW.id_mecanico IS NULL
    OR NEW.id_mecanico::text <> v_id_mecanico_actual
  THEN
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
    'Mecánico'
  )
  INTO v_nombre_mecanico
  FROM public.mecanico AS m
  JOIN public.usuario AS u
    ON u.id_usuario = m.id_usuario
  WHERE m.id_mecanico::text = v_id_mecanico_actual;

  v_descripcion := FORMAT(
    'El mecánico %s registró el vehículo %s %s, placas %s.',
    v_nombre_mecanico,
    COALESCE(NULLIF(BTRIM(NEW.marca), ''), 'sin marca'),
    COALESCE(NULLIF(BTRIM(NEW.modelo), ''), 'sin modelo'),
    COALESCE(NULLIF(BTRIM(NEW.placas), ''), 'sin placas')
  );

  INSERT INTO public.actividad_mecanico (
    id_mecanico,
    tipo_accion,
    modulo,
    descripcion,
    referencia_id
  )
  VALUES (
    v_id_mecanico_actual::bigint,
    'CREAR',
    'Vehículos',
    v_descripcion,
    NEW.id_vehiculo
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
    u.id_usuario,
    'ACCION_MECANICO',
    'INFO',
    v_descripcion,
    'PENDIENTE',
    CURRENT_DATE,
    NULL
  FROM public.usuario AS u
  WHERE u.id_rol = 1
    AND u.estatus = 'Activo';

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.notificar_alta_vehiculo_mecanico() FROM PUBLIC;

DROP TRIGGER IF EXISTS notificar_alta_vehiculo_mecanico
  ON public.vehiculo;
CREATE TRIGGER notificar_alta_vehiculo_mecanico
  AFTER INSERT ON public.vehiculo
  FOR EACH ROW
  EXECUTE FUNCTION public.notificar_alta_vehiculo_mecanico();

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
      AND tablename = 'alerta'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.alerta;
  END IF;
END;
$$;
