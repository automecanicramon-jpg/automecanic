-- Historical mechanic IDs must remain on past records after the active
-- mechanic profile is removed. The archived identity table keeps attribution.
ALTER TABLE public.servicio
  DROP CONSTRAINT IF EXISTS servicio_id_mecanico_fkey;

ALTER TABLE public.cita
  DROP CONSTRAINT IF EXISTS cita_id_mecanico_fkey;

ALTER TABLE public.actividad_mecanico
  DROP CONSTRAINT IF EXISTS actividad_mecanico_id_mecanico_fkey;
