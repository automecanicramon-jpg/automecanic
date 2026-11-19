ALTER TABLE public.alerta
  ADD COLUMN IF NOT EXISTS fecha_registro timestamptz;

ALTER TABLE public.alerta
  ALTER COLUMN fecha_registro SET DEFAULT clock_timestamp();

ALTER TABLE public.actividad_mecanico
  ADD COLUMN IF NOT EXISTS id_vehiculo bigint,
  ADD COLUMN IF NOT EXISTS id_cliente integer;

ALTER TABLE public.actividad_mecanico
  ALTER COLUMN fecha_registro SET DEFAULT clock_timestamp();

CREATE OR REPLACE FUNCTION public.notificar_cliente_accion_mecanico()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
SET row_security = off
AS $$
DECLARE
  v_id_cliente integer;
  v_id_usuario integer;
  v_id_vehiculo_alerta integer;
BEGIN
  v_id_cliente := NEW.id_cliente;

  IF v_id_cliente IS NULL AND NEW.id_vehiculo IS NOT NULL THEN
    SELECT v.id_cliente
    INTO v_id_cliente
    FROM public.vehiculo AS v
    WHERE v.id_vehiculo = NEW.id_vehiculo;
  END IF;

  IF v_id_cliente IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT c.id_usuario
  INTO v_id_usuario
  FROM public.cliente AS c
  JOIN public.usuario AS u
    ON u.id_usuario = c.id_usuario
  WHERE c.id_cliente = v_id_cliente
    AND u.estatus = 'Activo';

  IF v_id_usuario IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.id_vehiculo IS NOT NULL AND EXISTS (
    SELECT 1
    FROM public.vehiculo AS v
    WHERE v.id_vehiculo = NEW.id_vehiculo
  ) THEN
    v_id_vehiculo_alerta := NEW.id_vehiculo::integer;
  END IF;

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
    v_id_vehiculo_alerta,
    v_id_usuario,
    'ACCION_MECANICO_CLIENTE',
    'INFO',
    COALESCE(
      NULLIF(BTRIM(NEW.descripcion), ''),
      FORMAT('El mecánico registró una acción en el módulo %s de tu vehículo.', NEW.modulo)
    ),
    'PENDIENTE',
    CURRENT_DATE,
    NULL
  );

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.notificar_cliente_accion_mecanico() FROM PUBLIC;

DROP TRIGGER IF EXISTS notificar_cliente_accion_mecanico
  ON public.actividad_mecanico;
CREATE TRIGGER notificar_cliente_accion_mecanico
  AFTER INSERT ON public.actividad_mecanico
  FOR EACH ROW
  EXECUTE FUNCTION public.notificar_cliente_accion_mecanico();

CREATE OR REPLACE FUNCTION public.registrar_accion_mecanico_y_notificar_admin(
  p_id_mecanico bigint,
  p_tipo_accion text,
  p_modulo text,
  p_descripcion text,
  p_referencia_id bigint DEFAULT NULL,
  p_id_vehiculo bigint DEFAULT NULL
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
SET row_security = off
AS $$
DECLARE
  v_id_actividad bigint;
  v_id_cliente integer;
BEGIN
  IF p_id_mecanico IS NULL OR NOT EXISTS (
    SELECT 1
    FROM public.mecanico AS m
    WHERE m.id_mecanico = p_id_mecanico
  ) THEN
    RAISE EXCEPTION 'No se encontró el mecánico de la acción.';
  END IF;

  IF p_tipo_accion IS NULL
    OR p_tipo_accion NOT IN ('CREAR', 'ACTUALIZAR', 'ELIMINAR')
    OR NULLIF(BTRIM(p_modulo), '') IS NULL
    OR NULLIF(BTRIM(p_descripcion), '') IS NULL
  THEN
    RAISE EXCEPTION 'La acción del mecánico está incompleta.';
  END IF;

  IF p_id_vehiculo IS NOT NULL THEN
    SELECT v.id_cliente
    INTO v_id_cliente
    FROM public.vehiculo AS v
    WHERE v.id_vehiculo = p_id_vehiculo;
  END IF;

  INSERT INTO public.actividad_mecanico (
    id_mecanico,
    tipo_accion,
    modulo,
    descripcion,
    referencia_id,
    id_vehiculo,
    id_cliente
  )
  VALUES (
    p_id_mecanico,
    p_tipo_accion,
    BTRIM(p_modulo),
    BTRIM(p_descripcion),
    p_referencia_id,
    p_id_vehiculo,
    v_id_cliente
  )
  RETURNING id_actividad INTO v_id_actividad;

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
    p_id_vehiculo,
    u.id_usuario,
    'ACCION_MECANICO',
    'INFO',
    BTRIM(p_descripcion),
    'PENDIENTE',
    CURRENT_DATE,
    NULL
  FROM public.usuario AS u
  WHERE u.id_rol = 1
    AND u.estatus = 'Activo';

  RETURN v_id_actividad;
END;
$$;

REVOKE ALL ON FUNCTION public.registrar_accion_mecanico_y_notificar_admin(
  bigint, text, text, text, bigint, bigint
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.registrar_accion_mecanico_y_notificar_admin(
  bigint, text, text, text, bigint, bigint
) TO service_role;

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
  v_id_cliente integer;
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
    v.placas,
    v.id_cliente
  INTO
    v_nombre_mecanico,
    v_marca,
    v_modelo,
    v_placas,
    v_id_cliente
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
    referencia_id,
    id_vehiculo,
    id_cliente
  )
  VALUES (
    v_id_mecanico::bigint,
    v_accion,
    CASE
      WHEN TG_TABLE_NAME = 'servicio' THEN 'Servicios'
      ELSE 'Mantenimiento preventivo'
    END,
    v_descripcion,
    v_id_referencia,
    v_id_vehiculo,
    v_id_cliente
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
  v_id_cliente integer;
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
    v_id_cliente := NEW.id_cliente;
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
    v_id_cliente := NEW.id_cliente;
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
    v_id_cliente := OLD.id_cliente;
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
    referencia_id,
    id_vehiculo,
    id_cliente
  )
  VALUES (
    v_id_mecanico,
    v_accion,
    'Vehículos',
    v_descripcion,
    v_id_vehiculo,
    v_id_vehiculo,
    v_id_cliente
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
