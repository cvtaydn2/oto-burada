-- 0079: Seller Reviews & Güven Döngüsü
-- seller_reviews table + profiles denormalization + trigger

-- ── profiles: add review stats (if not exists) ──────────────────────────────────────────
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS review_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS review_avg numeric(3,2);

-- ── seller_reviews table ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.seller_reviews (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id   uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    reviewer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    listing_id  uuid REFERENCES listings(id) ON DELETE SET NULL,
    rating      smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment    text CHECK (char_length(comment) <= 500),
    is_verified boolean NOT NULL DEFAULT false,
    is_visible boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT unique_reviewer_seller_listing UNIQUE (seller_id, reviewer_id, listing_id)
);

CREATE TRIGGER trg_sync_review_stats
    AFTER INSERT OR UPDATE OR DELETE ON seller_reviews
    FOR EACH ROW EXECUTE FUNCTION sync_seller_review_stats();

COMMENT ON TABLE public.seller_reviews IS 'Satıcı yorumları — güvenilir satıcı döngüsü.';

-- ── Index'ler ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_reviews_seller
    ON public.seller_reviews(seller_id) WHERE is_visible = true;

CREATE INDEX IF NOT EXISTS idx_reviews_reviewer
    ON public.seller_reviews(reviewer_id);

CREATE INDEX IF NOT EXISTS idx_reviews_listing
    ON public.seller_reviews(listing_id);

-- ── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE public.seller_reviews ENABLE ROW LEVEL SECURITY;

-- ── Policies ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "seller_reviews_select" ON public.seller_reviews;
CREATE POLICY "seller_reviews_select" ON public.seller_reviews
    FOR SELECT USING (is_visible = true);

DROP POLICY IF EXISTS "seller_reviews_insert" ON public.seller_reviews;
CREATE POLICY "seller_reviews_insert" ON public.seller_reviews
    FOR INSERT WITH CHECK (
        reviewer_id = (SELECT auth.uid())
        AND seller_id <> (SELECT auth.uid())
    );

DROP POLICY IF EXISTS "seller_reviews_admin" ON public.seller_reviews;
CREATE POLICY "seller_reviews_admin" ON public.seller_reviews
    FOR UPDATE USING (public.is_admin());

CREATE OR REPLACE FUNCTION sync_seller_review_stats()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        UPDATE profiles SET
            review_count = (SELECT count(*) FROM seller_reviews WHERE seller_id = OLD.seller_id AND is_visible = true),
            review_avg = (SELECT avg(rating) FROM seller_reviews WHERE seller_id = OLD.seller_id AND is_visible = true)
        WHERE id = OLD.seller_id;
        RETURN OLD;
    END IF;

    UPDATE profiles SET
        review_count = (SELECT count(*) FROM seller_reviews WHERE seller_id = NEW.seller_id AND is_visible = true),
        review_avg = (SELECT avg(rating) FROM seller_reviews WHERE seller_id = NEW.seller_id AND is_visible = true)
    WHERE id = NEW.seller_id;
    RETURN NEW;
END; $$;