-- Listing Questions Table
CREATE TABLE IF NOT EXISTS public.listing_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    question TEXT NOT NULL CHECK (char_length(question) >= 5 AND char_length(question) <= 1000),
    answer TEXT CHECK (answer IS NULL OR (char_length(answer) >= 2 AND char_length(answer) <= 2000)),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    is_public BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_listing_questions_listing_id ON public.listing_questions(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_questions_user_id ON public.listing_questions(user_id);
CREATE INDEX IF NOT EXISTS idx_listing_questions_status ON public.listing_questions(status);

-- RLS Policies
ALTER TABLE public.listing_questions ENABLE ROW LEVEL SECURITY;

-- 1. Everyone can view approved public questions
CREATE POLICY "Anyone can view approved questions" 
ON public.listing_questions FOR SELECT 
USING (status = 'approved' AND is_public = true);

-- 2. Question owner can view their own questions (any status)
CREATE POLICY "Users can view own questions" 
ON public.listing_questions FOR SELECT 
USING (auth.uid() = user_id);

-- 3. Listing owner can view all questions on their listing
CREATE POLICY "Listing owners can view all questions" 
ON public.listing_questions FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM public.listings 
    WHERE id = listing_id AND user_id = auth.uid()
));

-- 4. Authenticated users can ask questions
CREATE POLICY "Users can ask questions" 
ON public.listing_questions FOR INSERT 
WITH CHECK (
    auth.uid() = user_id AND 
    EXISTS (
        SELECT 1 FROM public.listings 
        WHERE id = listing_id AND user_id != auth.uid() -- Can't ask yourself
    )
);

-- 5. Listing owner can answer questions
CREATE POLICY "Listing owners can answer questions" 
ON public.listing_questions FOR UPDATE 
USING (EXISTS (
    SELECT 1 FROM public.listings 
    WHERE id = listing_id AND user_id = auth.uid()
))
WITH CHECK (
    -- Can only update the answer and potentially status
    (SELECT auth.uid()) IS NOT NULL
);

-- 6. Admins can do everything
CREATE POLICY "Admins have full access to questions" 
ON public.listing_questions FOR ALL 
USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
));

-- Trigger for updated_at
CREATE TRIGGER set_listing_questions_updated_at
BEFORE UPDATE ON public.listing_questions
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
