CREATE INDEX IF NOT EXISTS listings_vin_trust_guard_idx
  ON public.listings (vin)
  WHERE vin IS NOT NULL
    AND status IN ('pending', 'pending_ai_review', 'approved', 'flagged');

CREATE INDEX IF NOT EXISTS listings_license_plate_trust_guard_idx
  ON public.listings (license_plate)
  WHERE license_plate IS NOT NULL
    AND status IN ('pending', 'pending_ai_review', 'approved', 'flagged');
