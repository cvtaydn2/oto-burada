-- Oto Burada - Full Schema Snapshot
-- This file represents the complete, clean state of the database.
-- Generated: 2026-04-18

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- 2. ENUMS
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_type') THEN
        CREATE TYPE public.user_type AS ENUM ('individual', 'professional', 'staff');
    ELSE
        -- Ensure 'staff' exists if type was created earlier without it
        BEGIN
            ALTER TYPE public.user_type ADD VALUE 'staff';
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE public.user_role AS ENUM ('user', 'admin');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'listing_status') THEN
        CREATE TYPE public.listing_status AS ENUM ('draft', 'pending', 'approved', 'rejected', 'archived', 'flagged', 'pending_ai_review');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'fuel_type') THEN
        CREATE TYPE public.fuel_type AS ENUM ('benzin', 'dizel', 'lpg', 'hibrit', 'elektrik');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transmission_type') THEN
        CREATE TYPE public.transmission_type AS ENUM ('manuel', 'otomatik', 'yari_otomatik');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_status') THEN
        CREATE TYPE public.report_status AS ENUM ('open', 'reviewing', 'resolved', 'dismissed');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_reason') THEN
        CREATE TYPE public.report_reason AS ENUM ('fake_listing', 'wrong_info', 'spam', 'price_manipulation', 'invalid_verification', 'other');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
        CREATE TYPE public.notification_type AS ENUM ('favorite', 'moderation', 'report', 'system');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'moderation_target_type') THEN
        CREATE TYPE public.moderation_target_type AS ENUM ('listing', 'report', 'user');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'moderation_action') THEN
        CREATE TYPE public.moderation_action AS ENUM ('approve', 'reject', 'review', 'resolve', 'dismiss', 'archive', 'edit');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ticket_status') THEN
        CREATE TYPE public.ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ticket_priority') THEN
        CREATE TYPE public.ticket_priority AS ENUM ('low', 'medium', 'high', 'urgent');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ticket_category') THEN
        CREATE TYPE public.ticket_category AS ENUM ('listing', 'account', 'payment', 'technical', 'feedback', 'other');
    END IF;
END $$;

-- 3. FUNCTIONS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$;

-- 4. TABLES

-- Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE RESTRICT,
  full_name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  avatar_url text,
  role public.user_role NOT NULL DEFAULT 'user',
  user_type public.user_type NOT NULL DEFAULT 'individual',
  balance_credits integer NOT NULL DEFAULT 0,
  is_verified boolean NOT NULL DEFAULT false,
  business_name text,
  business_address text,
  business_logo_url text,
  business_description text,
  tax_id text,
  tax_office text,
  website_url text,
  verified_business boolean NOT NULL DEFAULT false,
  business_slug text,
  is_banned boolean NOT NULL DEFAULT false,
  ban_reason text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- Brands & Models
CREATE TABLE IF NOT EXISTS public.brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands (id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  UNIQUE (brand_id, name)
);

CREATE TABLE IF NOT EXISTS public.car_trims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id uuid NOT NULL REFERENCES public.models(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(model_id, name)
);

-- Locations
CREATE TABLE IF NOT EXISTS public.cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  plate_code integer NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS public.districts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id uuid NOT NULL REFERENCES public.cities (id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  is_active boolean NOT NULL DEFAULT true
);

-- Listings
CREATE TABLE IF NOT EXISTS public.listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  brand text NOT NULL,
  model text NOT NULL,
  year integer NOT NULL CHECK (year BETWEEN 1950 AND 2100),
  mileage integer NOT NULL CHECK (mileage >= 0),
  fuel_type public.fuel_type NOT NULL,
  transmission public.transmission_type NOT NULL,
  price bigint NOT NULL CHECK (price > 0),
  city text NOT NULL,
  district text NOT NULL,
  description text NOT NULL,
  whatsapp_phone text NOT NULL,
  vin text,
  license_plate text,
  car_trim text,
  tramer_amount numeric DEFAULT 0,
  damage_status_json jsonb,
  fraud_score integer NOT NULL DEFAULT 0 CHECK (fraud_score BETWEEN 0 AND 100),
  fraud_reason text,
  status public.listing_status NOT NULL DEFAULT 'pending',
  market_price_index decimal(12,2),
  featured boolean NOT NULL DEFAULT false,
  expert_inspection jsonb,
  view_count integer NOT NULL DEFAULT 0,
  published_at timestamptz,
  bumped_at timestamptz,
  featured_until timestamptz,
  urgent_until timestamptz,
  highlighted_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- Images
CREATE TABLE IF NOT EXISTS public.listing_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings (id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  public_url text NOT NULL,
  placeholder_blur text,
  sort_order integer NOT NULL DEFAULT 0,
  is_cover boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (listing_id, sort_order)
);

-- Social & Search
CREATE TABLE IF NOT EXISTS public.favorites (
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  listing_id uuid NOT NULL REFERENCES public.listings (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  PRIMARY KEY (user_id, listing_id)
);

CREATE TABLE IF NOT EXISTS public.saved_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  title text NOT NULL,
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  notifications_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- Comms
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  type public.notification_type NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  href text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- Moderation
CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings (id) ON DELETE RESTRICT,
  reporter_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  reason public.report_reason NOT NULL,
  description text,
  status public.report_status NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.admin_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE SET NULL,
  target_type public.moderation_target_type NOT NULL,
  target_id uuid NOT NULL,
  action public.moderation_action NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- Support
CREATE TABLE IF NOT EXISTS public.tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  subject text NOT NULL,
  description text NOT NULL,
  category public.ticket_category NOT NULL DEFAULT 'other',
  priority public.ticket_priority NOT NULL DEFAULT 'medium',
  status public.ticket_status NOT NULL DEFAULT 'open',
  listing_id uuid REFERENCES public.listings(id) ON DELETE SET NULL,
  admin_response text,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- Messaging
CREATE TABLE IF NOT EXISTS public.chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_message_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT chats_distinct_participants CHECK (buyer_id <> seller_id),
  CONSTRAINT chats_unique_listing_pair UNIQUE (listing_id, buyer_id, seller_id)
);

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(trim(content)) > 0),
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- Reviews
CREATE TABLE IF NOT EXISTS public.seller_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  listing_id uuid REFERENCES public.listings(id) ON DELETE SET NULL,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT seller_reviews_unique_per_listing UNIQUE (reviewer_id, listing_id)
);

-- Payments & Pricing
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  amount decimal(12,2) NOT NULL,
  currency text NOT NULL DEFAULT 'TRY',
  plan_id uuid REFERENCES public.pricing_plans (id) ON DELETE SET NULL,
  plan_name text,
  provider text NOT NULL,
  status text NOT NULL,
  description text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

COMMENT ON COLUMN public.payments.plan_id IS 'Satın alınan paket ID (ödeme sistemi aktif olduğunda doldurulur)';
COMMENT ON COLUMN public.payments.plan_name IS 'Satın alınan paket adı (snapshot)';

CREATE TABLE IF NOT EXISTS public.pricing_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price decimal(12,2) NOT NULL,
  credits integer NOT NULL,
  features jsonb,
  is_active boolean NOT NULL DEFAULT true
);

-- Audits & Stats
CREATE TABLE IF NOT EXISTS public.market_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand text NOT NULL,
  model text NOT NULL,
  year integer NOT NULL,
  avg_price decimal(12,2) NOT NULL,
  listing_count integer NOT NULL,
  calculated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.phone_reveal_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  viewer_ip text,
  revealed_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.listing_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings (id) ON DELETE CASCADE,
  viewer_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  viewer_ip text,
  viewed_on date NOT NULL DEFAULT current_date,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  key text NOT NULL,
  count integer NOT NULL DEFAULT 1,
  reset_at timestamptz NOT NULL,
  PRIMARY KEY (key)
);

-- 5. SEARCH VECTOR
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_ts_config WHERE cfgname = 'turkish_unaccent') THEN
        CREATE TEXT SEARCH CONFIGURATION turkish_unaccent (COPY = turkish);
        ALTER TEXT SEARCH CONFIGURATION turkish_unaccent
          ALTER MAPPING FOR hword, hword_part, word
          WITH unaccent, turkish_stem;
    END IF;
END $$;

ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('turkish_unaccent',
      coalesce(title, '') || ' ' ||
      coalesce(brand, '') || ' ' ||
      coalesce(model, '') || ' ' ||
      coalesce(city, '')  || ' ' ||
      coalesce(district, '') || ' ' ||
      coalesce(description, '')
    )
  ) STORED;

-- 6. INDEXES
CREATE INDEX IF NOT EXISTS profiles_business_slug_idx ON public.profiles (business_slug) WHERE business_slug IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS listings_vin_active_idx ON public.listings (vin) WHERE status IN ('approved', 'pending');
CREATE INDEX IF NOT EXISTS listings_status_idx ON public.listings (status, updated_at DESC);
CREATE INDEX IF NOT EXISTS listings_seller_idx ON public.listings (seller_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS saved_searches_user_idx ON public.saved_searches (user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS notifications_user_idx ON public.notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS reports_status_idx ON public.reports (status, updated_at DESC);
CREATE INDEX IF NOT EXISTS listing_images_listing_idx ON public.listing_images (listing_id, sort_order);
CREATE UNIQUE INDEX IF NOT EXISTS reports_active_per_user_listing_idx ON public.reports (listing_id, reporter_id) WHERE status IN ('open', 'reviewing');
CREATE INDEX IF NOT EXISTS listings_search_vector_idx ON public.listings USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS listings_brand_idx ON public.listings (brand);
CREATE INDEX IF NOT EXISTS listings_city_idx ON public.listings (city);
CREATE INDEX IF NOT EXISTS listings_price_idx ON public.listings (price);
CREATE INDEX IF NOT EXISTS listings_year_idx ON public.listings (year);
CREATE INDEX IF NOT EXISTS listings_mileage_idx ON public.listings (mileage);
CREATE INDEX IF NOT EXISTS listings_published_at_idx ON public.listings (published_at) WHERE published_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS listings_bumped_at_idx ON public.listings (bumped_at DESC NULLS LAST) WHERE bumped_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS listings_featured_until_idx ON public.listings (featured_until) WHERE featured_until IS NOT NULL;
CREATE INDEX IF NOT EXISTS listings_urgent_until_idx ON public.listings (urgent_until) WHERE urgent_until IS NOT NULL;
CREATE INDEX IF NOT EXISTS listings_highlighted_until_idx ON public.listings (highlighted_until) WHERE highlighted_until IS NOT NULL;
CREATE INDEX IF NOT EXISTS listings_fraud_score_idx ON public.listings (fraud_score) WHERE fraud_score > 0;
CREATE UNIQUE INDEX IF NOT EXISTS listing_views_user_daily_dedup_idx ON public.listing_views (listing_id, viewer_id, viewed_on) WHERE viewer_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS listing_views_anonymous_daily_dedup_idx ON public.listing_views (listing_id, viewer_ip, viewed_on) WHERE viewer_id IS NULL AND viewer_ip IS NOT NULL;
CREATE INDEX IF NOT EXISTS listing_views_listing_idx ON public.listing_views (listing_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_status_price ON public.listings (status, price);
CREATE INDEX IF NOT EXISTS idx_listings_status_year ON public.listings (status, year);
CREATE INDEX IF NOT EXISTS idx_listings_status_mileage ON public.listings (status, mileage);
CREATE INDEX IF NOT EXISTS idx_listings_status_created_at ON public.listings (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_models_brand_id ON public.models (brand_id);
CREATE INDEX IF NOT EXISTS idx_districts_city_id ON public.districts (city_id);
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON public.tickets (user_id);
CREATE INDEX IF NOT EXISTS idx_chats_buyer_last_message_at ON public.chats (buyer_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_chats_seller_last_message_at ON public.chats (seller_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_chat_created_at ON public.messages (chat_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_phone_reveal_logs_ip ON public.phone_reveal_logs (viewer_ip, revealed_at DESC) WHERE viewer_ip IS NOT NULL;

-- 7. TRIGGERS
CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER listings_set_updated_at BEFORE UPDATE ON public.listings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER reports_set_updated_at BEFORE UPDATE ON public.reports FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER saved_searches_set_updated_at BEFORE UPDATE ON public.saved_searches FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER notifications_set_updated_at BEFORE UPDATE ON public.notifications FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_tickets_updated_at BEFORE UPDATE ON public.tickets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.touch_chat_last_message_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.chats
  SET last_message_at = NEW.created_at
  WHERE id = NEW.chat_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER messages_touch_chat_last_message_at AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.touch_chat_last_message_at();

-- 8. RLS POLICIES

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.car_trims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phone_reveal_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "profiles_select_self_or_admin_or_chat" ON public.profiles FOR SELECT USING (
  (SELECT auth.uid()) = id OR public.is_admin() OR EXISTS (
    SELECT 1 FROM public.chats 
    WHERE ((SELECT auth.uid()) = chats.buyer_id OR (SELECT auth.uid()) = chats.seller_id)
      AND (public.profiles.id = chats.buyer_id OR public.profiles.id = chats.seller_id)
  )
);
CREATE POLICY "profiles_insert_self_or_admin" ON public.profiles FOR INSERT WITH CHECK ((SELECT auth.uid()) = id OR public.is_admin());
CREATE POLICY "profiles_update_self_or_admin" ON public.profiles FOR UPDATE USING ((SELECT auth.uid()) = id OR public.is_admin());

-- Listings
CREATE POLICY "listings_select_visible" ON public.listings FOR SELECT USING (status = 'approved' OR (SELECT auth.uid()) = seller_id OR public.is_admin());
CREATE POLICY "listings_insert_owner_or_admin" ON public.listings FOR INSERT WITH CHECK ((SELECT auth.uid()) = seller_id OR public.is_admin());
CREATE POLICY "listings_update_owner_or_admin" ON public.listings FOR UPDATE USING ((SELECT auth.uid()) = seller_id OR public.is_admin());
CREATE POLICY "listings_delete_owner_archived_or_admin" ON public.listings FOR DELETE USING (((SELECT auth.uid()) = seller_id AND status = 'archived') OR public.is_admin());

-- Images
CREATE POLICY "listing_images_select_visible" ON public.listing_images FOR SELECT USING (EXISTS (
  SELECT 1 FROM public.listings WHERE listings.id = listing_images.listing_id 
  AND (listings.status = 'approved' OR listings.seller_id = (SELECT auth.uid()) OR public.is_admin())
));
CREATE POLICY "listing_images_manage_owner" ON public.listing_images FOR ALL USING (EXISTS (
  SELECT 1 FROM public.listings WHERE listings.id = listing_images.listing_id 
  AND (listings.seller_id = (SELECT auth.uid()) OR public.is_admin())
));

-- Favorites & Saved Searches
CREATE POLICY "favorites_manage_own" ON public.favorites FOR ALL USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "saved_searches_manage_own" ON public.saved_searches FOR ALL USING ((SELECT auth.uid()) = user_id);

-- Notifications
CREATE POLICY "notifications_manage_own" ON public.notifications FOR ALL USING ((SELECT auth.uid()) = user_id);

-- Reports
CREATE POLICY "reports_select_self_or_admin" ON public.reports FOR SELECT USING ((SELECT auth.uid()) = reporter_id OR public.is_admin());
CREATE POLICY "reports_insert_self" ON public.reports FOR INSERT WITH CHECK ((SELECT auth.uid()) = reporter_id);
CREATE POLICY "reports_update_admin" ON public.reports FOR UPDATE USING (public.is_admin());

-- Support Tickets
CREATE POLICY "tickets_select_own_or_admin" ON public.tickets FOR SELECT USING ((SELECT auth.uid()) = user_id OR public.is_admin());
CREATE POLICY "tickets_insert_own_or_public" ON public.tickets FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id OR user_id IS NULL);
CREATE POLICY "tickets_update_own_open_or_admin" ON public.tickets FOR UPDATE USING (((SELECT auth.uid()) = user_id AND status = 'open') OR public.is_admin());

-- Messaging
CREATE POLICY "chats_select_participants" ON public.chats FOR SELECT USING ((SELECT auth.uid()) IN (buyer_id, seller_id) OR public.is_admin());
CREATE POLICY "chats_insert_buyer_only" ON public.chats FOR INSERT WITH CHECK ((SELECT auth.uid()) = buyer_id AND EXISTS (
  SELECT 1 FROM public.listings WHERE listings.id = chats.listing_id AND listings.status = 'approved' AND listings.seller_id = chats.seller_id
));
CREATE POLICY "messages_select_participants" ON public.messages FOR SELECT USING (EXISTS (
  SELECT 1 FROM public.chats WHERE chats.id = messages.chat_id AND (SELECT auth.uid()) IN (chats.buyer_id, chats.seller_id)
));
CREATE POLICY "messages_insert_sender" ON public.messages FOR INSERT WITH CHECK (sender_id = (SELECT auth.uid()) AND EXISTS (
  SELECT 1 FROM public.chats WHERE chats.id = messages.chat_id AND (SELECT auth.uid()) IN (chats.buyer_id, chats.seller_id)
));

-- Reviews
CREATE POLICY "seller_reviews_select_public" ON public.seller_reviews FOR SELECT USING (true);
CREATE POLICY "seller_reviews_insert_self" ON public.seller_reviews FOR INSERT WITH CHECK ((SELECT auth.uid()) = reviewer_id);
CREATE POLICY "seller_reviews_delete_self_or_admin" ON public.seller_reviews FOR DELETE USING ((SELECT auth.uid()) = reviewer_id OR public.is_admin());

-- Reveal Logs
CREATE POLICY "phone_reveal_logs_select_owner_or_admin" ON public.phone_reveal_logs FOR SELECT USING (public.is_admin() OR EXISTS (
  SELECT 1 FROM public.listings WHERE listings.id = phone_reveal_logs.listing_id AND listings.seller_id = (SELECT auth.uid())
));
CREATE POLICY "phone_reveal_logs_insert_approved" ON public.phone_reveal_logs FOR INSERT WITH CHECK (EXISTS (
  SELECT 1 FROM public.listings WHERE listings.id = phone_reveal_logs.listing_id AND listings.status = 'approved'
));

-- Public Data
CREATE POLICY "brands_select_public" ON public.brands FOR SELECT USING (true);
CREATE POLICY "models_select_public" ON public.models FOR SELECT USING (true);
CREATE POLICY "car_trims_select_public" ON public.car_trims FOR SELECT USING (is_active = true);
CREATE POLICY "cities_select_public" ON public.cities FOR SELECT USING (true);
CREATE POLICY "districts_select_public" ON public.districts FOR SELECT USING (true);
CREATE POLICY "pricing_plans_select_public" ON public.pricing_plans FOR SELECT USING (true);
CREATE POLICY "market_stats_select_public" ON public.market_stats FOR SELECT USING (true);

-- Admin Only
CREATE POLICY "admin_actions_all" ON public.admin_actions FOR ALL USING (public.is_admin());
CREATE POLICY "api_rate_limits_admin" ON public.api_rate_limits FOR ALL USING (public.is_admin());

-- 9. CRON JOBS
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'expire-old-listings') THEN
    PERFORM cron.schedule(
      'expire-old-listings',
      '0 2 * * *',
      $job$
        UPDATE public.listings
        SET status = 'archived',
            updated_at = timezone('utc', now())
        WHERE status = 'approved'
          AND published_at < now() - interval '30 days';
      $job$
    );
  END IF;
END $$;

-- 10. STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public) VALUES ('listing-images', 'listing-images', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('listing-documents', 'listing-documents', false) ON CONFLICT (id) DO NOTHING;

-- Storage Policies (listing-images)
CREATE POLICY "Public Read" ON storage.objects FOR SELECT USING (bucket_id = 'listing-images');
CREATE POLICY "Auth Insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'listing-images' AND auth.role() = 'authenticated' AND (storage.foldername(name))[1] = 'listings' AND (storage.foldername(name))[2] = (SELECT auth.uid())::text);
CREATE POLICY "Auth Update" ON storage.objects FOR UPDATE USING (bucket_id = 'listing-images' AND auth.role() = 'authenticated' AND (storage.foldername(name))[1] = 'listings' AND (storage.foldername(name))[2] = (SELECT auth.uid())::text);
CREATE POLICY "Auth Delete" ON storage.objects FOR DELETE USING (bucket_id = 'listing-images' AND auth.role() = 'authenticated' AND (storage.foldername(name))[1] = 'listings' AND (storage.foldername(name))[2] = (SELECT auth.uid())::text);
