-- Fix public access to profiles to allow marketplace listings to be visible to unauthenticated users.
-- The current RLS policy restricts profile selection to self, admins, or chat participants.
-- Since the marketplace uses an inner join with profiles to filter out banned users,
-- unauthenticated users cannot see any listings because they cannot select the joined profile.

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' AND policyname = 'profiles_select_public'
    ) THEN
        CREATE POLICY "profiles_select_public" ON public.profiles 
        FOR SELECT 
        USING (NOT is_banned OR public.is_admin());
    END IF;
END $$;
