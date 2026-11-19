CREATE TABLE IF NOT EXISTS public.mecanico_cliente AS
SELECT m.id_mecanico, c.id_cliente
FROM public.mecanico AS m
CROSS JOIN public.cliente AS c
WITH NO DATA;

ALTER TABLE public.mecanico_cliente
  ALTER COLUMN id_mecanico SET NOT NULL,
  ALTER COLUMN id_cliente SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.mecanico_cliente'::regclass
      AND conname = 'mecanico_cliente_pkey'
  ) THEN
    ALTER TABLE public.mecanico_cliente
      ADD CONSTRAINT mecanico_cliente_pkey
      PRIMARY KEY (id_mecanico, id_cliente);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.mecanico_cliente'::regclass
      AND conname = 'mecanico_cliente_id_mecanico_fkey'
  ) THEN
    ALTER TABLE public.mecanico_cliente
      ADD CONSTRAINT mecanico_cliente_id_mecanico_fkey
      FOREIGN KEY (id_mecanico)
      REFERENCES public.mecanico(id_mecanico)
      ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.mecanico_cliente'::regclass
      AND conname = 'mecanico_cliente_id_cliente_fkey'
  ) THEN
    ALTER TABLE public.mecanico_cliente
      ADD CONSTRAINT mecanico_cliente_id_cliente_fkey
      FOREIGN KEY (id_cliente)
      REFERENCES public.cliente(id_cliente)
      ON DELETE CASCADE;
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS mecanico_cliente_id_cliente_idx
  ON public.mecanico_cliente(id_cliente);

ALTER TABLE public.mecanico_cliente ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, DELETE
  ON TABLE public.mecanico_cliente
  TO authenticated;

DROP POLICY IF EXISTS "mechanic_select_own_client_links"
  ON public.mecanico_cliente;
CREATE POLICY "mechanic_select_own_client_links"
  ON public.mecanico_cliente
  FOR SELECT
  TO authenticated
  USING (
    public.usuario_es_administrador_actual()
    OR id_mecanico::text = (SELECT public.id_mecanico_actual())
  );

DROP POLICY IF EXISTS "mechanic_insert_own_client_links"
  ON public.mecanico_cliente;
CREATE POLICY "mechanic_insert_own_client_links"
  ON public.mecanico_cliente
  FOR INSERT
  TO authenticated
  WITH CHECK (
    id_mecanico::text = (SELECT public.id_mecanico_actual())
  );

DROP POLICY IF EXISTS "mechanic_delete_own_client_links"
  ON public.mecanico_cliente;
CREATE POLICY "mechanic_delete_own_client_links"
  ON public.mecanico_cliente
  FOR DELETE
  TO authenticated
  USING (
    public.usuario_es_administrador_actual()
    OR id_mecanico::text = (SELECT public.id_mecanico_actual())
  );

CREATE OR REPLACE FUNCTION public.mecanico_puede_ver_cliente(p_id_cliente text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
SET row_security = off
AS $$
  SELECT p_id_cliente IS NOT NULL
    AND (
      EXISTS (
        SELECT 1
        FROM public.mecanico_cliente AS mc
        WHERE mc.id_mecanico::text = public.id_mecanico_actual()
          AND mc.id_cliente::text = p_id_cliente
      )
      OR EXISTS (
        SELECT 1
        FROM public.vehiculo AS v
        WHERE v.id_mecanico::text = public.id_mecanico_actual()
          AND v.id_cliente::text = p_id_cliente
      )
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
    AND (
      EXISTS (
        SELECT 1
        FROM public.mecanico_cliente AS mc
        JOIN public.cliente AS c
          ON c.id_cliente = mc.id_cliente
        WHERE mc.id_mecanico::text = public.id_mecanico_actual()
          AND c.id_usuario::text = p_id_usuario
      )
      OR EXISTS (
        SELECT 1
        FROM public.cliente AS c
        JOIN public.vehiculo AS v
          ON v.id_cliente = c.id_cliente
        WHERE v.id_mecanico::text = public.id_mecanico_actual()
          AND c.id_usuario::text = p_id_usuario
      )
    );
$$;

CREATE OR REPLACE FUNCTION public.mecanico_puede_asignar_cliente(p_id_cliente text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
SET row_security = off
AS $$
  SELECT public.mecanico_puede_ver_cliente(p_id_cliente);
$$;

REVOKE ALL ON FUNCTION public.mecanico_puede_asignar_cliente(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mecanico_puede_asignar_cliente(text) TO authenticated;

DROP POLICY IF EXISTS "mechanic_select_assigned_clients"
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

DROP POLICY IF EXISTS "Mecánico puede registrar vehículos"
  ON public.vehiculo;
DROP POLICY IF EXISTS "mechanic_insert_assigned_vehicles"
  ON public.vehiculo;
CREATE POLICY "mechanic_insert_assigned_vehicles"
  ON public.vehiculo
  FOR INSERT
  TO authenticated
  WITH CHECK (
    id_mecanico::text = (SELECT public.id_mecanico_actual())
    AND (SELECT public.mecanico_puede_asignar_cliente(id_cliente::text))
  );

DROP POLICY IF EXISTS "mechanic_update_own_vehicles"
  ON public.vehiculo;
CREATE POLICY "mechanic_update_own_vehicles"
  ON public.vehiculo
  FOR UPDATE
  TO authenticated
  USING (
    public.usuario_es_administrador_actual()
    OR id_mecanico::text = (SELECT public.id_mecanico_actual())
  )
  WITH CHECK (
    public.usuario_es_administrador_actual()
    OR (
      id_mecanico::text = (SELECT public.id_mecanico_actual())
      AND (SELECT public.mecanico_puede_asignar_cliente(id_cliente::text))
    )
  );

DROP POLICY IF EXISTS "mechanic_delete_own_vehicles"
  ON public.vehiculo;
CREATE POLICY "mechanic_delete_own_vehicles"
  ON public.vehiculo
  FOR DELETE
  TO authenticated
  USING (
    public.usuario_es_administrador_actual()
    OR id_mecanico::text = (SELECT public.id_mecanico_actual())
  );
