CREATE OR REPLACE FUNCTION public.eliminar_personal_admin(
  p_id_mecanico text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id_usuario public.usuario.id_usuario%TYPE;
  v_servicios bigint;
  v_vehiculos bigint;
  v_citas bigint;
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

  SELECT m.id_usuario
  INTO v_id_usuario
  FROM public.mecanico AS m
  WHERE m.id_mecanico::text = p_id_mecanico
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No se encontró el mecánico.'
      USING ERRCODE = 'P0002';
  END IF;

  SELECT COUNT(*)
  INTO v_servicios
  FROM public.servicio
  WHERE id_mecanico::text = p_id_mecanico;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'vehiculo'
      AND column_name = 'id_mecanico'
  ) THEN
    EXECUTE
      'SELECT COUNT(*) FROM public.vehiculo WHERE id_mecanico::text = $1'
      INTO v_vehiculos
      USING p_id_mecanico;
  ELSE
    v_vehiculos := 0;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'cita'
      AND column_name = 'id_mecanico'
  ) THEN
    EXECUTE
      'SELECT COUNT(*) FROM public.cita WHERE id_mecanico::text = $1'
      INTO v_citas
      USING p_id_mecanico;
  ELSE
    v_citas := 0;
  END IF;

  IF v_servicios + v_vehiculos + v_citas > 0 THEN
    RAISE EXCEPTION
      'No se puede eliminar este mecánico porque tiene información relacionada. Servicios: %, vehículos: %, citas: %. Puedes cambiar su estado a Inactivo.',
      v_servicios,
      v_vehiculos,
      v_citas
      USING ERRCODE = '23503';
  END IF;

  DELETE FROM public.mecanico
  WHERE id_mecanico::text = p_id_mecanico;

  IF v_id_usuario IS NOT NULL THEN
    DELETE FROM public.usuario
    WHERE id_usuario = v_id_usuario;
  END IF;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.eliminar_personal_admin(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.eliminar_personal_admin(text) TO authenticated;
