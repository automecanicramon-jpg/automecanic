DROP POLICY IF EXISTS "mechanic_select_assigned_appointments"
  ON public.cita;
CREATE POLICY "mechanic_select_assigned_appointments"
  ON public.cita
  FOR SELECT
  TO authenticated
  USING (
    public.usuario_es_administrador_actual()
    OR id_mecanico::text = (SELECT public.id_mecanico_actual())
    OR (
      id_mecanico IS NULL
      AND (
        EXISTS (
          SELECT 1
          FROM public.vehiculo AS v
          WHERE v.id_vehiculo = cita.id_vehiculo
            AND v.id_mecanico::text = (SELECT public.id_mecanico_actual())
        )
        OR (
          id_vehiculo IS NULL
          AND (SELECT public.mecanico_puede_ver_cliente(id_cliente::text))
        )
      )
    )
  );

DROP POLICY IF EXISTS "mechanic_select_assigned_transmission_observations"
  ON public.registro_transmision_cliente;
CREATE POLICY "mechanic_select_assigned_transmission_observations"
  ON public.registro_transmision_cliente
  FOR SELECT
  TO authenticated
  USING (
    public.usuario_es_administrador_actual()
    OR (
      id_vehiculo IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM public.vehiculo AS v
        WHERE v.id_vehiculo = registro_transmision_cliente.id_vehiculo
          AND v.id_mecanico::text = (SELECT public.id_mecanico_actual())
      )
    )
    OR (
      id_vehiculo IS NULL
      AND (SELECT public.mecanico_puede_ver_cliente(id_cliente::text))
    )
  );

DROP POLICY IF EXISTS "user_select_own_alerts"
  ON public.alerta;
CREATE POLICY "user_select_own_alerts"
  ON public.alerta
  FOR SELECT
  TO authenticated
  USING (
    public.usuario_es_administrador_actual()
    OR (
      tipo_alerta IS DISTINCT FROM 'ACCION_MECANICO'
      AND id_usuario IN (
        SELECT u.id_usuario
        FROM public.usuario AS u
        WHERE u.auth_id = (SELECT auth.uid())
      )
    )
  );

CREATE OR REPLACE FUNCTION public.actualizar_citas_vencidas_mecanico()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
SET row_security = off
AS $$
DECLARE
  v_id_mecanico text;
  v_total integer;
BEGIN
  v_id_mecanico := public.id_mecanico_actual();

  IF v_id_mecanico IS NULL THEN
    RAISE EXCEPTION 'No se encontró el mecánico autenticado.';
  END IF;

  UPDATE public.cita AS c
  SET estado = 'VENCIDA'
  WHERE c.estado = 'PROXIMA'
    AND (c.fecha + c.hora) < CURRENT_TIMESTAMP
    AND (
      c.id_mecanico::text = v_id_mecanico
      OR (
        c.id_mecanico IS NULL
        AND (
          EXISTS (
            SELECT 1
            FROM public.vehiculo AS v
            WHERE v.id_vehiculo = c.id_vehiculo
              AND v.id_mecanico::text = v_id_mecanico
          )
          OR (
            c.id_vehiculo IS NULL
            AND public.mecanico_puede_ver_cliente(c.id_cliente::text)
          )
        )
      )
    );

  GET DIAGNOSTICS v_total = ROW_COUNT;
  RETURN v_total;
END;
$$;

CREATE OR REPLACE FUNCTION public.enrutar_alertas_mecanico_por_vehiculo()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
SET row_security = off
AS $$
DECLARE
  v_id_usuario_mecanico public.mecanico.id_usuario%TYPE;
BEGIN
  IF NEW.tipo_alerta IS NULL
    OR NEW.tipo_alerta NOT IN ('CITA_NUEVA', 'TRANSMISION_CLIENTE')
    OR NEW.id_vehiculo IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT m.id_usuario
  INTO v_id_usuario_mecanico
  FROM public.vehiculo AS v
  JOIN public.mecanico AS m
    ON m.id_mecanico = v.id_mecanico
  WHERE v.id_vehiculo = NEW.id_vehiculo;

  IF v_id_usuario_mecanico IS NOT NULL
    AND NEW.id_usuario IS DISTINCT FROM v_id_usuario_mecanico THEN
    RETURN NULL;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.actualizar_citas_vencidas_mecanico() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.actualizar_citas_vencidas_mecanico() TO authenticated;
REVOKE ALL ON FUNCTION public.enrutar_alertas_mecanico_por_vehiculo() FROM PUBLIC;

DROP TRIGGER IF EXISTS enrutar_alertas_mecanico_por_vehiculo
  ON public.alerta;
CREATE TRIGGER enrutar_alertas_mecanico_por_vehiculo
  BEFORE INSERT
  ON public.alerta
  FOR EACH ROW
  EXECUTE FUNCTION public.enrutar_alertas_mecanico_por_vehiculo();
