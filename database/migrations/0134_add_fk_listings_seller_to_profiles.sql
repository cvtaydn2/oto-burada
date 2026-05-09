-- Add foreign key from listings.seller_id to profiles.id
-- Ensures referential integrity for seller references and enables PostgREST relationships.

ALTER TABLE public.listings
  ADD CONSTRAINT listings_seller_id_fkey
  FOREIGN KEY (seller_id)
  REFERENCES public.profiles(id)
  ON DELETE CASCADE;
