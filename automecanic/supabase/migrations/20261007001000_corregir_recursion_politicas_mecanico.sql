CREATE OR REPLACE FUNCTION public.usuario_es_administrador_actual()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.usuario AS u
    WHERE u.auth_id = (SELECT auth.uid())
      AND u.id_rol = 1
  );
$$;

CREATE OR REPLACE FUNCTION public.id_mecanico_actual()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
SET row_security = off
AS $$
  SELECT m.id_mecanico::text
  FROM public.usuario AS u
  JOIN public.mecanico AS m
    ON m.id_usuario = u.id_usuario
  WHERE u.auth_id = (SELECT auth.uid())
    AND u.id_rol = 2
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.mecanico_puede_ver_cliente(p_id_cliente text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
SET row_security = off
AS $$
  SELECT p_id_cliente IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.vehiculo AS v
      WHERE v.id_mecanico::text = public.id_mecanico_actual()
        AND v.id_cliente::text = p_id_cliente
    );
$$;

CREATE OR REPLACE FUNCTION public.mecanico_puede_ver_perfil_cliente(p_id_usuario text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
SET row_security = off
AS $$
  SELECT p_id_usuario IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.cliente AS c
      JOIN public.vehiculo AS v
        ON v.id_cliente = c.id_cliente
      WHERE v.id_mecanico::text = public.id_mecanico_actual()
        AND c.id_usuario::text = p_id_usuario
    );
$$;

REVOKE ALL ON FUNCTION public.usuario_es_administrador_actual() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.id_mecanico_actual() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.mecanico_puede_ver_cliente(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.mecanico_puede_ver_perfil_cliente(text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.usuario_es_administrador_actual() TO authenticated;
GRANT EXECUTE ON FUNCTION public.id_mecanico_actual() TO authenticated;
GRANT EXECUTE ON FUNCTION public.mecanico_puede_ver_cliente(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mecanico_puede_ver_perfil_cliente(text) TO authenticated;

DROP POLICY IF EXISTS "mechanic_select_assigned_vehicles"
  ON public.vehiculo;
DROP POLICY IF EXISTS "Mecánico puede consultar sus vehículos"
  ON public.vehiculo;

CREATE POLICY "mechanic_select_assigned_vehicles"
  ON public.vehiculo
  FOR SELECT
  TO authenticated
  USING (
    public.usuario_es_administrador_actual()
    OR id_mecanico::text = (SELECT public.id_mecanico_actual())
  );

DROP POLICY IF EXISTS "mechanic_select_assigned_clients"
  ON public.cliente;
DROP POLICY IF EXISTS "Mecánico puede leer clientes"
  ON public.cliente;

CREATE POLICY "mechanic_select_assigned_clients"
  ON public.cliente
  FOR SELECT
  TO authenticated
  USING (
    public.usuario_es_administrador_actual()
    OR (SELECT public.mecanico_puede_ver_cliente(id_cliente::text))
  );

DROP POLICY IF EXISTS "mechanic_select_assigned_client_profiles"
  ON public.usuario;

CREATE POLICY "mechanic_select_assigned_client_profiles"
  ON public.usuario
  FOR SELECT
  TO authenticated
  USING (
    public.usuario_es_administrador_actual()
    OR auth_id = (SELECT auth.uid())
    OR (SELECT public.mecanico_puede_ver_perfil_cliente(id_usuario::text))
  );
