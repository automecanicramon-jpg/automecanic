DO $$
DECLARE
  v_data_type text;
BEGIN
  SELECT data_type
  INTO v_data_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'actividad_mecanico'
    AND column_name = 'fecha_registro';

  IF v_data_type = 'timestamp without time zone' THEN
    ALTER TABLE public.actividad_mecanico
      ALTER COLUMN fecha_registro TYPE timestamptz
      USING fecha_registro AT TIME ZONE 'UTC';
  ELSIF v_data_type IS DISTINCT FROM 'timestamp with time zone' THEN
    RAISE EXCEPTION 'Tipo inesperado para actividad_mecanico.fecha_registro: %', v_data_type;
  END IF;
END;
$$;

ALTER TABLE public.actividad_mecanico
  ALTER COLUMN fecha_registro SET DEFAULT clock_timestamp();
