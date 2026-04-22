-- 0065: Add brand image URLs
-- Brands table for performant brand logos/images

ALTER TABLE public.brands 
ADD COLUMN IF NOT EXISTS image_url text,
ADD COLUMN IF NOT EXISTS website text;

-- Seed brand images with valid Unsplash URLs
-- These are car brand logos/photos from Unsplash
UPDATE public.brands SET 
  image_url = CASE name
    WHEN 'Volkswagen' THEN 'https://images.unsplash.com/photo-1617788131607-c4fa1a5f7172?auto=format&fit=crop&w=200&q=80'
    WHEN 'Renault' THEN 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=200&q=80'
    WHEN 'BMW' THEN 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=200&q=80'
    WHEN 'Mercedes-Benz' THEN 'https://images.unsplash.com/photo-1619425399517-d7fce0f13302?auto=format&fit=crop&w=200&q=80'
    WHEN 'Audi' THEN 'https://images.unsplash.com/photo-1603386329225-868f9b1ee6c9?auto=format&fit=crop&w=200&q=80'
    WHEN 'Seat' THEN 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=200&q=80'
    WHEN 'Toyota' THEN 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=200&q=80'
    WHEN 'Honda' THEN 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?auto=format&fit=crop&w=200&q=80'
    WHEN 'Fiat' THEN 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=200&q=80'
    WHEN 'Opel' THEN 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=200&q=80'
    WHEN 'Ford' THEN 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=200&q=80'
    ELSE NULL
  END
WHERE image_url IS NULL;

-- Enable RLS
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

-- RLS policy for public read
DROP POLICY IF EXISTS "public_brands_read" ON public.brands;
CREATE POLICY "public_brands_read" ON public.brands FOR SELECT USING (true);