CREATE OR REPLACE FUNCTION public.mecanico_puede_ver_vehiculo(p_id_vehiculo text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
SET row_security = off
AS $$
  SELECT p_id_vehiculo IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.vehiculo AS v
      WHERE v.id_vehiculo::text = p_id_vehiculo
        AND v.id_mecanico::text = public.id_mecanico_actual()
    );
$$;

CREATE OR REPLACE FUNCTION public.cliente_puede_ver_vehiculo(p_id_vehiculo text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
SET row_security = off
AS $$
  SELECT p_id_vehiculo IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.vehiculo AS v
      JOIN public.cliente AS c
        ON c.id_cliente = v.id_cliente
      JOIN public.usuario AS u
        ON u.id_usuario = c.id_usuario
      WHERE v.id_vehiculo::text = p_id_vehiculo
        AND u.auth_id = (SELECT auth.uid())
    );
$$;

CREATE OR REPLACE FUNCTION public.servicio_puede_ver(p_id_servicio text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
SET row_security = off
AS $$
  SELECT p_id_servicio IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.servicio AS s
      WHERE s.id_servicio::text = p_id_servicio
        AND (
          public.usuario_es_administrador_actual()
          OR (
            s.id_mecanico::text = public.id_mecanico_actual()
            AND public.mecanico_puede_ver_vehiculo(s.id_vehiculo::text)
          )
          OR public.cliente_puede_ver_vehiculo(s.id_vehiculo::text)
        )
    );
$$;

CREATE OR REPLACE FUNCTION public.mecanico_puede_modificar_servicio(p_id_servicio text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
SET row_security = off
AS $$
  SELECT p_id_servicio IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.servicio AS s
      WHERE s.id_servicio::text = p_id_servicio
        AND s.id_mecanico::text = public.id_mecanico_actual()
        AND public.mecanico_puede_ver_vehiculo(s.id_vehiculo::text)
    );
$$;

REVOKE ALL ON FUNCTION public.mecanico_puede_ver_vehiculo(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cliente_puede_ver_vehiculo(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.servicio_puede_ver(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.mecanico_puede_modificar_servicio(text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.mecanico_puede_ver_vehiculo(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cliente_puede_ver_vehiculo(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.servicio_puede_ver(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mecanico_puede_modificar_servicio(text) TO authenticated;

ALTER TABLE public.servicio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicio_motor ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicio_transmision ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detalle_llanta ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracion_mantenimiento ENABLE ROW LEVEL SECURITY;

GRANT SELECT
  ON TABLE public.tipo_aceite,
    public.marca_aceite,
    public.tipo_llanta
  TO authenticated;

DROP POLICY IF EXISTS "authenticated_read_service_catalogs"
  ON public.tipo_aceite;
CREATE POLICY "authenticated_read_service_catalogs"
  ON public.tipo_aceite
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "authenticated_read_service_catalogs"
  ON public.marca_aceite;
CREATE POLICY "authenticated_read_service_catalogs"
  ON public.marca_aceite
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "authenticated_read_service_catalogs"
  ON public.tipo_llanta;
CREATE POLICY "authenticated_read_service_catalogs"
  ON public.tipo_llanta
  FOR SELECT
  TO authenticated
  USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE
  ON TABLE public.servicio,
    public.servicio_motor,
    public.servicio_transmision,
    public.detalle_llanta,
    public.configuracion_mantenimiento
  TO authenticated;

DROP POLICY IF EXISTS "service_records_select_scoped" ON public.servicio;
CREATE POLICY "service_records_select_scoped"
  ON public.servicio
  FOR SELECT
  TO authenticated
  USING (
    public.usuario_es_administrador_actual()
    OR (
      id_mecanico::text = (SELECT public.id_mecanico_actual())
      AND (SELECT public.mecanico_puede_ver_vehiculo(id_vehiculo::text))
    )
    OR (SELECT public.cliente_puede_ver_vehiculo(id_vehiculo::text))
  );

DROP POLICY IF EXISTS "service_records_insert_scoped" ON public.servicio;
CREATE POLICY "service_records_insert_scoped"
  ON public.servicio
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.usuario_es_administrador_actual()
    OR (
      id_mecanico::text = (SELECT public.id_mecanico_actual())
      AND (SELECT public.mecanico_puede_ver_vehiculo(id_vehiculo::text))
    )
  );

DROP POLICY IF EXISTS "service_records_update_scoped" ON public.servicio;
CREATE POLICY "service_records_update_scoped"
  ON public.servicio
  FOR UPDATE
  TO authenticated
  USING (
    public.usuario_es_administrador_actual()
    OR (SELECT public.mecanico_puede_modificar_servicio(id_servicio::text))
  )
  WITH CHECK (
    public.usuario_es_administrador_actual()
    OR (
      id_mecanico::text = (SELECT public.id_mecanico_actual())
      AND (SELECT public.mecanico_puede_ver_vehiculo(id_vehiculo::text))
    )
  );

DROP POLICY IF EXISTS "service_records_delete_scoped" ON public.servicio;
CREATE POLICY "service_records_delete_scoped"
  ON public.servicio
  FOR DELETE
  TO authenticated
  USING (
    public.usuario_es_administrador_actual()
    OR (SELECT public.mecanico_puede_modificar_servicio(id_servicio::text))
  );

DROP POLICY IF EXISTS "service_records_select_guard" ON public.servicio;
CREATE POLICY "service_records_select_guard"
  ON public.servicio
  AS RESTRICTIVE
  FOR SELECT
  TO authenticated
  USING (
    public.usuario_es_administrador_actual()
    OR (
      id_mecanico::text = (SELECT public.id_mecanico_actual())
      AND (SELECT public.mecanico_puede_ver_vehiculo(id_vehiculo::text))
    )
    OR (SELECT public.cliente_puede_ver_vehiculo(id_vehiculo::text))
  );

DROP POLICY IF EXISTS "service_records_insert_guard" ON public.servicio;
CREATE POLICY "service_records_insert_guard"
  ON public.servicio
  AS RESTRICTIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.usuario_es_administrador_actual()
    OR (
      id_mecanico::text = (SELECT public.id_mecanico_actual())
      AND (SELECT public.mecanico_puede_ver_vehiculo(id_vehiculo::text))
    )
  );

DROP POLICY IF EXISTS "service_records_update_guard" ON public.servicio;
CREATE POLICY "service_records_update_guard"
  ON public.servicio
  AS RESTRICTIVE
  FOR UPDATE
  TO authenticated
  USING (
    public.usuario_es_administrador_actual()
    OR (SELECT public.mecanico_puede_modificar_servicio(id_servicio::text))
  )
  WITH CHECK (
    public.usuario_es_administrador_actual()
    OR (
      id_mecanico::text = (SELECT public.id_mecanico_actual())
      AND (SELECT public.mecanico_puede_ver_vehiculo(id_vehiculo::text))
    )
  );

DROP POLICY IF EXISTS "service_records_delete_guard" ON public.servicio;
CREATE POLICY "service_records_delete_guard"
  ON public.servicio
  AS RESTRICTIVE
  FOR DELETE
  TO authenticated
  USING (
    public.usuario_es_administrador_actual()
    OR (SELECT public.mecanico_puede_modificar_servicio(id_servicio::text))
  );

DROP POLICY IF EXISTS "service_details_select_scoped" ON public.servicio_motor;
DROP POLICY IF EXISTS "service_details_insert_scoped" ON public.servicio_motor;
DROP POLICY IF EXISTS "service_details_update_scoped" ON public.servicio_motor;
DROP POLICY IF EXISTS "service_details_delete_scoped" ON public.servicio_motor;
DROP POLICY IF EXISTS "service_details_select_guard" ON public.servicio_motor;
DROP POLICY IF EXISTS "service_details_insert_guard" ON public.servicio_motor;
DROP POLICY IF EXISTS "service_details_update_guard" ON public.servicio_motor;
DROP POLICY IF EXISTS "service_details_delete_guard" ON public.servicio_motor;

DROP POLICY IF EXISTS "service_details_select_scoped" ON public.servicio_transmision;
DROP POLICY IF EXISTS "service_details_insert_scoped" ON public.servicio_transmision;
DROP POLICY IF EXISTS "service_details_update_scoped" ON public.servicio_transmision;
DROP POLICY IF EXISTS "service_details_delete_scoped" ON public.servicio_transmision;
DROP POLICY IF EXISTS "service_details_select_guard" ON public.servicio_transmision;
DROP POLICY IF EXISTS "service_details_insert_guard" ON public.servicio_transmision;
DROP POLICY IF EXISTS "service_details_update_guard" ON public.servicio_transmision;
DROP POLICY IF EXISTS "service_details_delete_guard" ON public.servicio_transmision;

DROP POLICY IF EXISTS "service_details_select_scoped" ON public.detalle_llanta;
DROP POLICY IF EXISTS "service_details_insert_scoped" ON public.detalle_llanta;
DROP POLICY IF EXISTS "service_details_update_scoped" ON public.detalle_llanta;
DROP POLICY IF EXISTS "service_details_delete_scoped" ON public.detalle_llanta;
DROP POLICY IF EXISTS "service_details_select_guard" ON public.detalle_llanta;
DROP POLICY IF EXISTS "service_details_insert_guard" ON public.detalle_llanta;
DROP POLICY IF EXISTS "service_details_update_guard" ON public.detalle_llanta;
DROP POLICY IF EXISTS "service_details_delete_guard" ON public.detalle_llanta;

DO $$
DECLARE
  tabla text;
BEGIN
  FOREACH tabla IN ARRAY ARRAY[
    'servicio_motor',
    'servicio_transmision',
    'detalle_llanta'
  ]
  LOOP
    EXECUTE format(
      'CREATE POLICY "service_details_select_scoped" ON public.%I FOR SELECT TO authenticated USING (public.usuario_es_administrador_actual() OR (SELECT public.servicio_puede_ver(id_servicio::text)))',
      tabla
    );
    EXECUTE format(
      'CREATE POLICY "service_details_insert_scoped" ON public.%I FOR INSERT TO authenticated WITH CHECK (public.usuario_es_administrador_actual() OR (SELECT public.mecanico_puede_modificar_servicio(id_servicio::text)))',
      tabla
    );
    EXECUTE format(
      'CREATE POLICY "service_details_update_scoped" ON public.%I FOR UPDATE TO authenticated USING (public.usuario_es_administrador_actual() OR (SELECT public.mecanico_puede_modificar_servicio(id_servicio::text))) WITH CHECK (public.usuario_es_administrador_actual() OR (SELECT public.mecanico_puede_modificar_servicio(id_servicio::text)))',
      tabla
    );
    EXECUTE format(
      'CREATE POLICY "service_details_delete_scoped" ON public.%I FOR DELETE TO authenticated USING (public.usuario_es_administrador_actual() OR (SELECT public.mecanico_puede_modificar_servicio(id_servicio::text)))',
      tabla
    );
    EXECUTE format(
      'CREATE POLICY "service_details_select_guard" ON public.%I AS RESTRICTIVE FOR SELECT TO authenticated USING (public.usuario_es_administrador_actual() OR (SELECT public.servicio_puede_ver(id_servicio::text)))',
      tabla
    );
    EXECUTE format(
      'CREATE POLICY "service_details_insert_guard" ON public.%I AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (public.usuario_es_administrador_actual() OR (SELECT public.mecanico_puede_modificar_servicio(id_servicio::text)))',
      tabla
    );
    EXECUTE format(
      'CREATE POLICY "service_details_update_guard" ON public.%I AS RESTRICTIVE FOR UPDATE TO authenticated USING (public.usuario_es_administrador_actual() OR (SELECT public.mecanico_puede_modificar_servicio(id_servicio::text))) WITH CHECK (public.usuario_es_administrador_actual() OR (SELECT public.mecanico_puede_modificar_servicio(id_servicio::text)))',
      tabla
    );
    EXECUTE format(
      'CREATE POLICY "service_details_delete_guard" ON public.%I AS RESTRICTIVE FOR DELETE TO authenticated USING (public.usuario_es_administrador_actual() OR (SELECT public.mecanico_puede_modificar_servicio(id_servicio::text)))',
      tabla
    );
  END LOOP;
END;
$$;

DROP POLICY IF EXISTS "maintenance_config_select_scoped"
  ON public.configuracion_mantenimiento;
CREATE POLICY "maintenance_config_select_scoped"
  ON public.configuracion_mantenimiento
  FOR SELECT
  TO authenticated
  USING (
    public.usuario_es_administrador_actual()
    OR (SELECT public.mecanico_puede_ver_vehiculo(id_vehiculo::text))
    OR (SELECT public.cliente_puede_ver_vehiculo(id_vehiculo::text))
  );

DROP POLICY IF EXISTS "maintenance_config_insert_scoped"
  ON public.configuracion_mantenimiento;
CREATE POLICY "maintenance_config_insert_scoped"
  ON public.configuracion_mantenimiento
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.usuario_es_administrador_actual()
    OR (SELECT public.mecanico_puede_ver_vehiculo(id_vehiculo::text))
  );

DROP POLICY IF EXISTS "maintenance_config_update_scoped"
  ON public.configuracion_mantenimiento;
CREATE POLICY "maintenance_config_update_scoped"
  ON public.configuracion_mantenimiento
  FOR UPDATE
  TO authenticated
  USING (
    public.usuario_es_administrador_actual()
    OR (SELECT public.mecanico_puede_ver_vehiculo(id_vehiculo::text))
  )
  WITH CHECK (
    public.usuario_es_administrador_actual()
    OR (SELECT public.mecanico_puede_ver_vehiculo(id_vehiculo::text))
  );

DROP POLICY IF EXISTS "maintenance_config_delete_scoped"
  ON public.configuracion_mantenimiento;
CREATE POLICY "maintenance_config_delete_scoped"
  ON public.configuracion_mantenimiento
  FOR DELETE
  TO authenticated
  USING (
    public.usuario_es_administrador_actual()
    OR (SELECT public.mecanico_puede_ver_vehiculo(id_vehiculo::text))
  );

DROP POLICY IF EXISTS "maintenance_config_select_guard"
  ON public.configuracion_mantenimiento;
CREATE POLICY "maintenance_config_select_guard"
  ON public.configuracion_mantenimiento
  AS RESTRICTIVE
  FOR SELECT
  TO authenticated
  USING (
    public.usuario_es_administrador_actual()
    OR (SELECT public.mecanico_puede_ver_vehiculo(id_vehiculo::text))
    OR (SELECT public.cliente_puede_ver_vehiculo(id_vehiculo::text))
  );

DROP POLICY IF EXISTS "maintenance_config_insert_guard"
  ON public.configuracion_mantenimiento;
CREATE POLICY "maintenance_config_insert_guard"
  ON public.configuracion_mantenimiento
  AS RESTRICTIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.usuario_es_administrador_actual()
    OR (SELECT public.mecanico_puede_ver_vehiculo(id_vehiculo::text))
  );

DROP POLICY IF EXISTS "maintenance_config_update_guard"
  ON public.configuracion_mantenimiento;
CREATE POLICY "maintenance_config_update_guard"
  ON public.configuracion_mantenimiento
  AS RESTRICTIVE
  FOR UPDATE
  TO authenticated
  USING (
    public.usuario_es_administrador_actual()
    OR (SELECT public.mecanico_puede_ver_vehiculo(id_vehiculo::text))
  )
  WITH CHECK (
    public.usuario_es_administrador_actual()
    OR (SELECT public.mecanico_puede_ver_vehiculo(id_vehiculo::text))
  );

DROP POLICY IF EXISTS "maintenance_config_delete_guard"
  ON public.configuracion_mantenimiento;
CREATE POLICY "maintenance_config_delete_guard"
  ON public.configuracion_mantenimiento
  AS RESTRICTIVE
  FOR DELETE
  TO authenticated
  USING (
    public.usuario_es_administrador_actual()
    OR (SELECT public.mecanico_puede_ver_vehiculo(id_vehiculo::text))
  );
