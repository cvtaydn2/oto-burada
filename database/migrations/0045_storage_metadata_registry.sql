-- Migration: Storage Metadata Registry
-- Purpose: Track file ownership and metadata for Supabase Storage objects

-- 1. Create Storage Registry Table
CREATE TABLE IF NOT EXISTS public.storage_objects_registry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  bucket_id text NOT NULL,
  storage_path text NOT NULL,
  source_entity_type text, -- 'listing', 'listing_document', 'profile_avatar'
  source_entity_id uuid,
  file_name text,
  file_size bigint,
  mime_type text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (bucket_id, storage_path)
);

-- Indexes for ownership and entity tracking
CREATE INDEX IF NOT EXISTS idx_storage_registry_owner ON public.storage_objects_registry(owner_id);
CREATE INDEX IF NOT EXISTS idx_storage_registry_entity ON public.storage_objects_registry(source_entity_type, source_entity_id);

-- 2. RLS Policies
ALTER TABLE public.storage_objects_registry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "storage_registry_select_owner" ON public.storage_objects_registry
  FOR SELECT USING ((SELECT auth.uid()) = owner_id OR public.is_admin());

CREATE POLICY "storage_registry_manage_owner" ON public.storage_objects_registry
  FOR ALL USING ((SELECT auth.uid()) = owner_id OR public.is_admin());

-- 3. Comments
COMMENT ON TABLE public.storage_objects_registry IS 'Immutable registry of files uploaded through the application API, used for robust ownership verification and storage auditing.';
