-- 0081: Gallery / Kurumsal Satıcı Portalı
-- gallery profile enhancements + stock dashboard

-- ── profiles: gallery-specific columns (if not exists) ────────────────────────────
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS business_slug text UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS business_cover_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS business_galery_photos text[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS business_hours jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS business_employees integer;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_listings_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_sold_count integer NOT NULL DEFAULT 0;

-- ── Index ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_profiles_business_slug
    ON public.profiles(business_slug) WHERE business_slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_professional
    ON public.profiles(user_type) WHERE user_type = 'professional';

COMMENT ON COLUMN public.profiles.business_slug IS 'Galeri URL slug (ör: /galeri/oto-burada)';
COMMENT ON COLUMN public.profiles.business_cover_url IS 'Galeri kapak fotoğrafı';
COMMENT ON COLUMN public.profiles.business_hours IS 'Çalışma saatleri JSON';