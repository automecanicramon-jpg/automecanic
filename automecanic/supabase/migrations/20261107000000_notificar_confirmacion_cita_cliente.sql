CREATE OR REPLACE FUNCTION public.notificar_confirmacion_cita_cliente()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
SET row_security = off
AS $$
DECLARE
  v_id_usuario_cliente bigint;
  v_nombre_mecanico text;
  v_nombre_vehiculo text;
  v_mensaje text;
BEGIN
  IF OLD.estado IS NOT DISTINCT FROM NEW.estado
    OR NEW.estado <> 'EN_ATENCION' THEN
    RETURN NEW;
  END IF;

  SELECT c.id_usuario
  INTO v_id_usuario_cliente
  FROM public.cliente AS c
  WHERE c.id_cliente = NEW.id_cliente;

  IF v_id_usuario_cliente IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(
    NULLIF(BTRIM(CONCAT_WS(' ', u.nombre, u.apellido_paterno, u.apellido_materno)), ''),
    'Tu mecánico'
  )
  INTO v_nombre_mecanico
  FROM public.mecanico AS m
  JOIN public.usuario AS u ON u.id_usuario = m.id_usuario
  WHERE m.id_mecanico = NEW.id_mecanico;

  SELECT COALESCE(
    NULLIF(BTRIM(CONCAT_WS(' ', v.marca, v.modelo)), ''),
    'tu vehículo'
  )
  INTO v_nombre_vehiculo
  FROM public.vehiculo AS v
  WHERE v.id_vehiculo = NEW.id_vehiculo;

  v_mensaje := FORMAT(
    '%s ya revisó tu solicitud de cita para el %s a las %s y confirmó que comenzará la atención de %s. Motivo: %s.',
    COALESCE(v_nombre_mecanico, 'Tu mecánico'),
    TO_CHAR(NEW.fecha, 'DD/MM/YYYY'),
    TO_CHAR(NEW.hora, 'HH24:MI'),
    COALESCE(v_nombre_vehiculo, 'tu vehículo'),
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
  VALUES (
    NEW.id_vehiculo,
    v_id_usuario_cliente,
    'CITA_CONFIRMADA_MECANICO',
    'INFO',
    v_mensaje,
    'PENDIENTE',
    CURRENT_DATE,
    NULL
  );

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.notificar_confirmacion_cita_cliente() FROM PUBLIC;

DROP TRIGGER IF EXISTS notificar_confirmacion_cita_cliente
  ON public.cita;
CREATE TRIGGER notificar_confirmacion_cita_cliente
  AFTER UPDATE OF estado ON public.cita
  FOR EACH ROW
  WHEN (
    OLD.estado IS DISTINCT FROM NEW.estado
    AND NEW.estado = 'EN_ATENCION'
  )
  EXECUTE FUNCTION public.notificar_confirmacion_cita_cliente();

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
    ALTER PUBLICATION supabase_realtime
      ADD TABLE public.alerta;
  END IF;
END;
$$;
