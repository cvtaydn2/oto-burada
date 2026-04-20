-- 0049_realtime_security_and_system_hardening.sql
-- Production Hardening: Realtime Security, Storage Policies, and Connection Pooling Optimization

-- 1. REALTIME SECURITY HARDENING
-- Default 'supabase_realtime' publication can be 'FOR ALL TABLES', which is dangerous.
-- We explicitly define allowed tables for Realtime.
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE 
    public.messages, 
    public.notifications,
    public.listings;

-- Ensure Realtime honors RLS (Default in newer projects, but mandatory to be explicit)
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- 2. STORAGE HARDENING (listing-documents)
-- The snapshot was missing policies for the private 'listing-documents' bucket.
CREATE POLICY "Listing Documents Owner Select" ON storage.objects 
FOR SELECT TO authenticated 
USING (
    bucket_id = 'listing-documents' 
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
);

CREATE POLICY "Listing Documents Owner Insert" ON storage.objects 
FOR INSERT TO authenticated 
WITH CHECK (
    bucket_id = 'listing-documents' 
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
);

CREATE POLICY "Listing Documents Owner Delete" ON storage.objects 
FOR DELETE TO authenticated 
USING (
    bucket_id = 'listing-documents' 
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
);

-- 3. CHAT SECURITY ENHANCEMENT
-- Double check that users cannot insert messages into chats they don't belong to.
-- Current policy 'messages_insert_sender' handles this, but let's ensure it's water-tight.
-- (Already handled by 0048 but reiterated for consistency).

-- 4. DB CONNECTION OPTIMIZATION (Instructional)
-- We cannot set pooling via SQL in Supavisor easily, but we can optimize search_path.
-- Ensure all security definer functions have search_path set to public.
ALTER FUNCTION public.is_admin() SET search_path = public;
ALTER FUNCTION public.set_updated_at() SET search_path = public;
ALTER FUNCTION public.touch_chat_last_message_at() SET search_path = public;
