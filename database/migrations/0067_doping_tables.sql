-- database/migrations/0067_doping_tables.sql
-- Phase 1: Doping Infrastructure

CREATE TABLE IF NOT EXISTS doping_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE, -- 'on_planda', 'acil', 'bump'
  name text NOT NULL,
  price integer NOT NULL, -- kuruş değil, TL
  duration_days integer NOT NULL,
  type text NOT NULL, -- 'featured','urgent','highlighted','gallery','bump'
  features jsonb NOT NULL DEFAULT '[]',
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS doping_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id),
  listing_id uuid NOT NULL REFERENCES listings(id),
  package_id uuid NOT NULL REFERENCES doping_packages(id),
  payment_id uuid REFERENCES payments(id), -- mevcut payments tablosu!
  status text NOT NULL DEFAULT 'pending', -- pending, active, expired
  starts_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Listings tablosuna doping kolonları
-- Not: 'featured' kolonu zaten mevcut olabilir, 'is_featured' olarak ekleniyor.
ALTER TABLE listings ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS is_urgent boolean DEFAULT false;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS frame_color text;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS gallery_priority int DEFAULT 0;

-- RLS Policies
ALTER TABLE doping_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE doping_purchases ENABLE ROW LEVEL SECURITY;

-- Doping packages are public for read
CREATE POLICY "Doping packages are public for read" ON doping_packages
  FOR SELECT USING (true);

-- Doping purchases are visible to the owner
CREATE POLICY "Doping purchases are visible to the owner" ON doping_purchases
  FOR SELECT USING (auth.uid() = user_id);

-- Doping purchases are visible to admins
CREATE POLICY "Doping purchases are visible to admins" ON doping_purchases
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_doping_purchases_user_id ON doping_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_doping_purchases_listing_id ON doping_purchases(listing_id);
CREATE INDEX IF NOT EXISTS idx_doping_purchases_status ON doping_purchases(status);
