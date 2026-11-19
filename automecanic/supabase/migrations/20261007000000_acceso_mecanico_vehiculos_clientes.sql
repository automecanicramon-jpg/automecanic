CREATE OR REPLACE FUNCTION public.usuario_es_administrador_actual()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
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
SET search_path = pg_catalog, public
AS $$
  SELECT m.id_mecanico::text
  FROM public.usuario AS u
  JOIN public.mecanico AS m
    ON m.id_usuario = u.id_usuario
  WHERE u.auth_id = (SELECT auth.uid())
    AND u.id_rol = 2
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.usuario_es_administrador_actual() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.id_mecanico_actual() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.usuario_es_administrador_actual() TO authenticated;
GRANT EXECUTE ON FUNCTION public.id_mecanico_actual() TO authenticated;

DROP POLICY IF EXISTS "mechanic_select_assigned_vehicles"
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

CREATE POLICY "mechanic_select_assigned_clients"
  ON public.cliente
  FOR SELECT
  TO authenticated
  USING (
    public.usuario_es_administrador_actual()
    OR id_cliente IN (
      SELECT v.id_cliente
      FROM public.vehiculo AS v
      WHERE v.id_mecanico::text = (SELECT public.id_mecanico_actual())
        AND v.id_cliente IS NOT NULL
    )
  );

DROP POLICY IF EXISTS "mechanic_select_assigned_client_profiles"
  ON public.usuario;

CREATE POLICY "mechanic_select_assigned_client_profiles"
  ON public.usuario
  FOR SELECT
  TO authenticated
  USING (
    public.usuario_es_administrador_actual()
    OR id_usuario IN (
      SELECT c.id_usuario
      FROM public.cliente AS c
      JOIN public.vehiculo AS v
        ON v.id_cliente = c.id_cliente
      WHERE v.id_mecanico::text = (SELECT public.id_mecanico_actual())
        AND c.id_usuario IS NOT NULL
    )
  );
