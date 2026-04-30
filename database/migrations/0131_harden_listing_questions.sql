-- 1. DROP redundant/broken policies
DROP POLICY IF EXISTS "Anyone can view approved questions" ON public.listing_questions;
DROP POLICY IF EXISTS "Anyone can view answered questions" ON public.listing_questions;
DROP POLICY IF EXISTS "Users can view own questions" ON public.listing_questions;
DROP POLICY IF EXISTS "Listing owners can view all questions" ON public.listing_questions;
DROP POLICY IF EXISTS "Users can ask questions" ON public.listing_questions;
DROP POLICY IF EXISTS "Authenticated users can ask questions" ON public.listing_questions;
DROP POLICY IF EXISTS "Listing owners can answer questions" ON public.listing_questions;
DROP POLICY IF EXISTS "Sellers can answer their own listing's questions" ON public.listing_questions;
DROP POLICY IF EXISTS "Admins have full access to questions" ON public.listing_questions;

-- 2. CREATE robust policies
-- 2.1 SELECT: Everyone can view approved public questions
CREATE POLICY "listing_questions_select_public" 
ON public.listing_questions FOR SELECT 
USING (status = 'approved' AND is_public = true);

-- 2.2 SELECT: Question asker can view their own questions (even if pending)
CREATE POLICY "listing_questions_select_asker" 
ON public.listing_questions FOR SELECT 
USING ((SELECT auth.uid()) = user_id);

-- 2.3 SELECT: Listing owner can view all questions on their listing
CREATE POLICY "listing_questions_select_owner" 
ON public.listing_questions FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM public.listings 
    WHERE listings.id = listing_questions.listing_id AND listings.seller_id = (SELECT auth.uid())
));

-- 2.4 INSERT: Authenticated users can ask questions (enforcing their own user_id)
CREATE POLICY "listing_questions_insert_asker" 
ON public.listing_questions FOR INSERT 
WITH CHECK (
    (SELECT auth.uid()) = user_id AND 
    EXISTS (
        SELECT 1 FROM public.listings 
        WHERE listings.id = listing_questions.listing_id 
        AND listings.seller_id != (SELECT auth.uid()) -- Can't ask yourself
        AND listings.status = 'approved' -- Only on active listings
    )
);

-- 2.5 UPDATE: Listing owner can answer questions (Restricted to answer and status)
-- Note: Postgres RLS for UPDATE can check columns via WITH CHECK or triggers.
-- Here we allow UPDATE if they own the listing.
CREATE POLICY "listing_questions_update_owner" 
ON public.listing_questions FOR UPDATE 
USING (EXISTS (
    SELECT 1 FROM public.listings 
    WHERE listings.id = listing_questions.listing_id AND listings.seller_id = (SELECT auth.uid())
));

-- 2.6 ALL: Admins have full access
CREATE POLICY "listing_questions_admin_all" 
ON public.listing_questions FOR ALL 
USING (public.is_admin());

-- 3. ENSURE INDEXES
CREATE INDEX IF NOT EXISTS idx_listing_questions_listing_status ON public.listing_questions(listing_id, status);
CREATE INDEX IF NOT EXISTS idx_listing_questions_asker ON public.listing_questions(user_id);
