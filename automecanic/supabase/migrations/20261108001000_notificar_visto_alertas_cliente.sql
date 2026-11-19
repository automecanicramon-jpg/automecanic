CREATE OR REPLACE FUNCTION public.notificar_visto_transmision_cliente()
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
  v_placas text;
  v_tipo_alerta_cliente text;
  v_descripcion text;
  v_mensaje text;
BEGIN
  IF NEW.tipo_alerta IS NULL
    OR NEW.tipo_alerta NOT IN ('CITA_NUEVA', 'TRANSMISION_CLIENTE')
    OR OLD.estado IS NOT DISTINCT FROM NEW.estado
    OR NEW.estado <> 'LEIDA'
    OR NEW.id_vehiculo IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT
    c.id_usuario,
    COALESCE(
      NULLIF(BTRIM(CONCAT_WS(' ', mu.nombre, mu.apellido_paterno, mu.apellido_materno)), ''),
      'Tu mecánico'
    ),
    COALESCE(
      NULLIF(BTRIM(CONCAT_WS(' ', v.marca, v.modelo)), ''),
      'tu vehículo'
    ),
    COALESCE(NULLIF(BTRIM(v.placas), ''), 'sin placas')
  INTO
    v_id_usuario_cliente,
    v_nombre_mecanico,
    v_nombre_vehiculo,
    v_placas
  FROM public.mecanico AS m
  JOIN public.usuario AS mu
    ON mu.id_usuario = m.id_usuario
  JOIN public.vehiculo AS v
    ON v.id_mecanico = m.id_mecanico
   AND v.id_vehiculo = NEW.id_vehiculo
  JOIN public.cliente AS c
    ON c.id_cliente = v.id_cliente
  WHERE m.id_usuario = NEW.id_usuario;

  IF v_id_usuario_cliente IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.tipo_alerta = 'CITA_NUEVA' THEN
    v_tipo_alerta_cliente := 'CITA_VISTA_MECANICO';
    v_descripcion := 'vio tu solicitud de cita';
  ELSE
    v_tipo_alerta_cliente := 'TRANSMISION_VISTA_MECANICO';
    v_descripcion := 'vio tu reporte de transmisión';
  END IF;

  v_mensaje := FORMAT(
    '%s %s para %s (%s). Detalles: %s',
    v_nombre_mecanico,
    v_descripcion,
    v_nombre_vehiculo,
    v_placas,
    COALESCE(NULLIF(BTRIM(NEW.mensaje), ''), 'sin detalles adicionales')
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
    v_id_usuario_cliente,
    v_tipo_alerta_cliente,
    'INFO',
    v_mensaje,
    'PENDIENTE',
    CURRENT_DATE,
    NULL
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.alerta AS a
    WHERE a.id_vehiculo = NEW.id_vehiculo
      AND a.id_usuario = v_id_usuario_cliente
      AND a.tipo_alerta = v_tipo_alerta_cliente
      AND a.mensaje = v_mensaje
  );

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.notificar_visto_transmision_cliente() FROM PUBLIC;

DROP TRIGGER IF EXISTS notificar_visto_transmision_cliente
  ON public.alerta;
CREATE TRIGGER notificar_visto_transmision_cliente
  AFTER UPDATE OF estado ON public.alerta
  FOR EACH ROW
  WHEN (
    OLD.estado IS DISTINCT FROM NEW.estado
    AND NEW.estado = 'LEIDA'
    AND NEW.tipo_alerta IN ('CITA_NUEVA', 'TRANSMISION_CLIENTE')
  )
  EXECUTE FUNCTION public.notificar_visto_transmision_cliente();
