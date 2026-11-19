CREATE OR REPLACE FUNCTION public.notificar_alta_vehiculo_mecanico()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
SET row_security = off
AS $$
DECLARE
  v_id_mecanico_actual text;
  v_id_vehiculo bigint;
  v_id_mecanico bigint;
  v_marca text;
  v_modelo text;
  v_placas text;
  v_nombre_mecanico text;
  v_accion text;
  v_accion_descripcion text;
  v_descripcion text;
BEGIN
  v_id_mecanico_actual := public.id_mecanico_actual();

  IF v_id_mecanico_actual IS NULL THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    END IF;

    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.id_mecanico IS NULL
      OR NEW.id_mecanico::text <> v_id_mecanico_actual
    THEN
      RETURN NEW;
    END IF;

    v_id_vehiculo := NEW.id_vehiculo;
    v_id_mecanico := NEW.id_mecanico;
    v_marca := NEW.marca;
    v_modelo := NEW.modelo;
    v_placas := NEW.placas;
    v_accion := 'CREAR';
    v_accion_descripcion := 'registró';
  ELSIF TG_OP = 'UPDATE' THEN
    IF COALESCE(OLD.id_mecanico::text, '') <> v_id_mecanico_actual
      AND COALESCE(NEW.id_mecanico::text, '') <> v_id_mecanico_actual
    THEN
      RETURN NEW;
    END IF;

    v_id_vehiculo := NEW.id_vehiculo;
    v_id_mecanico := v_id_mecanico_actual::bigint;
    v_marca := NEW.marca;
    v_modelo := NEW.modelo;
    v_placas := NEW.placas;
    v_accion := 'ACTUALIZAR';
    v_accion_descripcion := 'actualizó';
  ELSE
    IF OLD.id_mecanico IS NULL
      OR OLD.id_mecanico::text <> v_id_mecanico_actual
    THEN
      RETURN OLD;
    END IF;

    v_id_vehiculo := OLD.id_vehiculo;
    v_id_mecanico := OLD.id_mecanico;
    v_marca := OLD.marca;
    v_modelo := OLD.modelo;
    v_placas := OLD.placas;
    v_accion := 'ELIMINAR';
    v_accion_descripcion := 'eliminó';
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
  WHERE m.id_mecanico = v_id_mecanico;

  v_descripcion := FORMAT(
    'El mecánico %s %s el vehículo %s %s, placas %s.',
    v_nombre_mecanico,
    v_accion_descripcion,
    COALESCE(NULLIF(BTRIM(v_marca), ''), 'sin marca'),
    COALESCE(NULLIF(BTRIM(v_modelo), ''), 'sin modelo'),
    COALESCE(NULLIF(BTRIM(v_placas), ''), 'sin placas')
  );

  INSERT INTO public.actividad_mecanico (
    id_mecanico,
    tipo_accion,
    modulo,
    descripcion,
    referencia_id
  )
  VALUES (
    v_id_mecanico,
    v_accion,
    'Vehículos',
    v_descripcion,
    v_id_vehiculo
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
    NULL,
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

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$;

UPDATE public.alerta
SET id_vehiculo = NULL
WHERE tipo_alerta = 'ACCION_MECANICO'
  AND mensaje LIKE 'El mecánico % registró el vehículo %';

REVOKE ALL ON FUNCTION public.notificar_alta_vehiculo_mecanico() FROM PUBLIC;

DROP TRIGGER IF EXISTS notificar_alta_vehiculo_mecanico
  ON public.vehiculo;
CREATE TRIGGER notificar_alta_vehiculo_mecanico
  AFTER INSERT OR UPDATE OR DELETE ON public.vehiculo
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
