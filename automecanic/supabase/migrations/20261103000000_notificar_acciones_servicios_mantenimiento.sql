CREATE OR REPLACE FUNCTION public.notificar_accion_servicio_mecanico()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
SET row_security = off
AS $$
DECLARE
  v_fila jsonb;
  v_id_mecanico text;
  v_id_vehiculo bigint;
  v_id_referencia bigint;
  v_marca text;
  v_modelo text;
  v_placas text;
  v_nombre_mecanico text;
  v_accion text;
  v_accion_descripcion text;
  v_descripcion text;
BEGIN
  v_id_mecanico := public.id_mecanico_actual();

  IF v_id_mecanico IS NULL THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    END IF;

    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    v_fila := to_jsonb(OLD);
  ELSE
    v_fila := to_jsonb(NEW);
  END IF;

  v_id_vehiculo := NULLIF(v_fila ->> 'id_vehiculo', '')::bigint;
  v_id_referencia := CASE
    WHEN TG_TABLE_NAME = 'servicio'
      THEN NULLIF(v_fila ->> 'id_servicio', '')::bigint
    ELSE NULLIF(v_fila ->> 'id_configuracion', '')::bigint
  END;

  IF TG_TABLE_NAME = 'servicio' THEN
    IF COALESCE(v_fila ->> 'id_mecanico', '') <> v_id_mecanico THEN
      IF TG_OP = 'DELETE' THEN
        RETURN OLD;
      END IF;

      RETURN NEW;
    END IF;

    v_accion_descripcion := 'un servicio';
  ELSE
    IF NOT EXISTS (
      SELECT 1
      FROM public.vehiculo AS v
      WHERE v.id_vehiculo = v_id_vehiculo
        AND v.id_mecanico::text = v_id_mecanico
    ) THEN
      IF TG_OP = 'DELETE' THEN
        RETURN OLD;
      END IF;

      RETURN NEW;
    END IF;

    v_accion_descripcion := 'la configuración de mantenimiento preventivo';
  END IF;

  IF TG_OP = 'INSERT' THEN
    v_accion := 'CREAR';
    v_accion_descripcion := 'registró ' || v_accion_descripcion;
  ELSIF TG_OP = 'UPDATE' THEN
    v_accion := 'ACTUALIZAR';
    v_accion_descripcion := 'actualizó ' || v_accion_descripcion;
  ELSE
    v_accion := 'ELIMINAR';
    v_accion_descripcion := 'eliminó ' || v_accion_descripcion;
  END IF;

  SELECT
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
      'Mecánico'
    ),
    v.marca,
    v.modelo,
    v.placas
  INTO
    v_nombre_mecanico,
    v_marca,
    v_modelo,
    v_placas
  FROM public.mecanico AS m
  JOIN public.usuario AS u
    ON u.id_usuario = m.id_usuario
  JOIN public.vehiculo AS v
    ON v.id_vehiculo = v_id_vehiculo
  WHERE m.id_mecanico::text = v_id_mecanico;

  v_descripcion := FORMAT(
    'El mecánico %s %s para el vehículo %s %s, placas %s.',
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
    v_id_mecanico::bigint,
    v_accion,
    CASE
      WHEN TG_TABLE_NAME = 'servicio' THEN 'Servicios'
      ELSE 'Mantenimiento preventivo'
    END,
    v_descripcion,
    v_id_referencia
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

REVOKE ALL ON FUNCTION public.notificar_accion_servicio_mecanico() FROM PUBLIC;

DROP TRIGGER IF EXISTS notificar_accion_servicio_mecanico
  ON public.servicio;
CREATE TRIGGER notificar_accion_servicio_mecanico
  AFTER INSERT OR UPDATE OR DELETE ON public.servicio
  FOR EACH ROW
  EXECUTE FUNCTION public.notificar_accion_servicio_mecanico();

DROP TRIGGER IF EXISTS notificar_accion_mantenimiento_mecanico
  ON public.configuracion_mantenimiento;
CREATE TRIGGER notificar_accion_mantenimiento_mecanico
  AFTER INSERT OR UPDATE OR DELETE ON public.configuracion_mantenimiento
  FOR EACH ROW
  EXECUTE FUNCTION public.notificar_accion_servicio_mecanico();

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
