-- Separately editable fuel / energy information. Existing PDFs and text stay intact.
BEGIN;
ALTER TABLE public.product_details
  ADD COLUMN energy_source text CHECK (energy_source IN ('petrol_4t','electric','diesel','aspen_2t','battery')),
  ADD COLUMN energy_note text NOT NULL DEFAULT '' CHECK (char_length(energy_note) <= 160);

UPDATE public.product_details d
SET energy_source = CASE
    WHEN d.specifications LIKE '%Kraftstoff: Aspen 2T%' THEN 'aspen_2t'
    WHEN d.specifications LIKE '%Kraftstoff: Aspen 4T%' THEN 'petrol_4t'
    WHEN d.specifications LIKE '%Kraftstoff: Diesel%' THEN 'diesel'
    WHEN d.specifications LIKE '%Kraftstoff: keiner%' THEN 'electric'
  END,
  energy_note = CASE
    WHEN d.specifications LIKE '%Kraftstoff: keiner%'
      THEN coalesce(substring(d.specifications FROM 'Stromversorgung: ([^\n]+)'), '')
    WHEN d.specifications LIKE '%Kraftstoff: Aspen 2T%'
      THEN 'Kraftstoff mit Ölbeimischung'
    WHEN d.specifications LIKE '%Kraftstoff: Aspen 4T%'
      THEN 'Ohne Ölbeimischung'
    ELSE ''
  END
FROM public.products p
WHERE p.id = d.product_id AND p.active AND d.energy_source IS NULL;
-- CityPumps has an electric drive, without the legacy fuel line.
UPDATE public.product_details d
SET energy_source = 'electric', energy_note = '230 V'
FROM public.products p
WHERE p.id = d.product_id AND p.active AND p.name = 'Tauchpumpe – CityPumps SOS Notfall' AND d.energy_source IS NULL;
COMMIT;
