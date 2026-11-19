CREATE TABLE IF NOT EXISTS public.mecanico_eliminado_historial (
  id_mecanico bigint PRIMARY KEY,
  nombre text NOT NULL,
  apellido_paterno text,
  apellido_materno text,
  especialidad text,
  auth_id uuid,
  fecha_eliminacion timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.mecanico_eliminado_historial
  ADD COLUMN IF NOT EXISTS auth_id uuid;

ALTER TABLE public.mecanico_eliminado_historial ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.mecanico_eliminado_historial
  FROM PUBLIC, anon, authenticated;
GRANT SELECT (
  id_mecanico,
  nombre,
  apellido_paterno,
  apellido_materno,
  especialidad,
  fecha_eliminacion
) ON TABLE public.mecanico_eliminado_historial TO authenticated;
GRANT ALL ON TABLE public.mecanico_eliminado_historial TO service_role;

DROP POLICY IF EXISTS "admin_select_mecanico_eliminado_historial"
  ON public.mecanico_eliminado_historial;
CREATE POLICY "admin_select_mecanico_eliminado_historial"
  ON public.mecanico_eliminado_historial
  FOR SELECT
  TO authenticated
  USING (public.usuario_es_administrador_actual());

CREATE OR REPLACE FUNCTION public.eliminar_personal_admin(
  p_id_mecanico text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id_mecanico public.mecanico.id_mecanico%TYPE;
  v_id_usuario public.usuario.id_usuario%TYPE;
  v_nombre text;
  v_apellido_paterno text;
  v_apellido_materno text;
  v_especialidad text;
  v_auth_id uuid;
  v_vehiculos bigint;
  v_clientes bigint;
  v_citas_activas bigint;
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1
    FROM public.usuario AS u
    WHERE u.auth_id = auth.uid()
      AND u.id_rol = 1
  ) THEN
    RAISE EXCEPTION 'Solo un administrador puede eliminar personal.'
      USING ERRCODE = '42501';
  END IF;

  SELECT m.id_mecanico, m.id_usuario, m.especialidad
  INTO v_id_mecanico, v_id_usuario, v_especialidad
  FROM public.mecanico AS m
  WHERE m.id_mecanico::text = p_id_mecanico
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No se encontró el mecánico.'
      USING ERRCODE = 'P0002';
  END IF;

  SELECT
    u.nombre,
    u.apellido_paterno,
    u.apellido_materno,
    u.auth_id
  INTO
    v_nombre,
    v_apellido_paterno,
    v_apellido_materno,
    v_auth_id
  FROM public.usuario AS u
  WHERE u.id_usuario = v_id_usuario
  FOR UPDATE;

  IF to_regclass('public.vehiculo') IS NULL
     OR NOT EXISTS (
       SELECT 1
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'vehiculo'
         AND column_name = 'id_mecanico'
     ) THEN
    RAISE EXCEPTION 'No fue posible verificar los vehículos asignados; no se eliminó el mecánico.'
      USING ERRCODE = 'P0001';
  END IF;

  EXECUTE
    'SELECT COUNT(*) FROM public.vehiculo WHERE id_mecanico::text = $1'
    INTO v_vehiculos
    USING p_id_mecanico;

  IF to_regclass('public.mecanico_cliente') IS NULL THEN
    RAISE EXCEPTION 'No fue posible verificar los clientes asignados; no se eliminó el mecánico.'
      USING ERRCODE = 'P0001';
  END IF;

  SELECT COUNT(*)
  INTO v_clientes
  FROM public.mecanico_cliente
  WHERE id_mecanico::text = p_id_mecanico;

  IF to_regclass('public.cita') IS NULL
     OR NOT EXISTS (
       SELECT 1
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'cita'
         AND column_name = 'id_mecanico'
     )
     OR NOT EXISTS (
       SELECT 1
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'cita'
         AND column_name = 'estado'
     ) THEN
    RAISE EXCEPTION 'No fue posible verificar las citas activas; no se eliminó el mecánico.'
      USING ERRCODE = 'P0001';
  END IF;

  EXECUTE
    'SELECT COUNT(*) FROM public.cita
     WHERE id_mecanico::text = $1
       AND UPPER(COALESCE(estado::text, '''')) IN (''PROXIMA'', ''EN_ATENCION'')'
    INTO v_citas_activas
    USING p_id_mecanico;

  IF v_vehiculos + v_clientes + v_citas_activas > 0 THEN
    RAISE EXCEPTION
      'No se puede eliminar este mecánico porque aún tiene dependencias. Vehículos: %, clientes asignados: %, citas activas: %. Reasigna o resuelve estas dependencias e inténtalo de nuevo.',
      v_vehiculos,
      v_clientes,
      v_citas_activas
      USING ERRCODE = 'P0001';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_constraint AS c
    WHERE c.contype = 'f'
      AND c.confrelid = 'public.mecanico'::regclass
      AND c.conrelid <> 'public.mecanico_cliente'::regclass
      AND c.confdeltype = 'c'
  ) THEN
    RAISE EXCEPTION 'La eliminación podría borrar registros históricos relacionados. No se eliminó el mecánico.'
      USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.mecanico_eliminado_historial (
    id_mecanico,
    nombre,
    apellido_paterno,
    apellido_materno,
    especialidad,
    auth_id
  )
  VALUES (
    v_id_mecanico,
    COALESCE(NULLIF(BTRIM(v_nombre), ''), 'Mecánico'),
    NULLIF(BTRIM(v_apellido_paterno), ''),
    NULLIF(BTRIM(v_apellido_materno), ''),
    v_especialidad,
    v_auth_id
  )
  ON CONFLICT (id_mecanico) DO NOTHING;

  BEGIN
    DELETE FROM public.mecanico
    WHERE id_mecanico = v_id_mecanico;

    IF v_id_usuario IS NOT NULL THEN
      DELETE FROM public.usuario
      WHERE id_usuario = v_id_usuario;
    END IF;
  EXCEPTION
    WHEN foreign_key_violation THEN
      RAISE EXCEPTION 'No se pudo eliminar al mecánico sin afectar información relacionada. No se eliminó el historial.'
        USING ERRCODE = 'P0001';
  END;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.eliminar_personal_admin(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.eliminar_personal_admin(text) TO authenticated;
