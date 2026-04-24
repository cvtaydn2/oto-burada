-- Example migration demonstrating the new UP/DOWN pattern
-- This migration adds a user activity tracking table with proper rollback support

-- UP
-- Create user activity tracking table
CREATE TABLE IF NOT EXISTS public.user_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_type text NOT NULL CHECK (activity_type IN ('login', 'logout', 'listing_view', 'listing_create', 'message_sent')),
  metadata jsonb DEFAULT '{}',
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;

-- Users can only see their own activities
CREATE POLICY "users_can_read_own_activities" ON public.user_activities
  FOR SELECT USING (auth.uid() = user_id);

-- Only the system can insert activities (via service role)
CREATE POLICY "service_role_can_insert_activities" ON public.user_activities
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON public.user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_type ON public.user_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON public.user_activities(created_at);
CREATE INDEX IF NOT EXISTS idx_user_activities_user_type ON public.user_activities(user_id, activity_type);

-- Add function to log user activity
CREATE OR REPLACE FUNCTION public.log_user_activity(
  p_user_id uuid,
  p_activity_type text,
  p_metadata jsonb DEFAULT '{}',
  p_ip_address inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  activity_id uuid;
BEGIN
  -- Validate activity type
  IF p_activity_type NOT IN ('login', 'logout', 'listing_view', 'listing_create', 'message_sent') THEN
    RAISE EXCEPTION 'Invalid activity type: %', p_activity_type;
  END IF;

  -- Insert activity record
  INSERT INTO public.user_activities (
    user_id, 
    activity_type, 
    metadata, 
    ip_address, 
    user_agent
  ) VALUES (
    p_user_id, 
    p_activity_type, 
    p_metadata, 
    p_ip_address, 
    p_user_agent
  ) RETURNING id INTO activity_id;

  RETURN activity_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.log_user_activity(uuid, text, jsonb, inet, text) TO authenticated;

-- Add cleanup function for old activities (keep last 90 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_user_activities()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.user_activities 
  WHERE created_at < (now() - interval '90 days');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RAISE NOTICE 'Cleaned up % old user activity records', deleted_count;
  RETURN deleted_count;
END;
$$;

-- Grant execute permission to service role for cleanup
GRANT EXECUTE ON FUNCTION public.cleanup_old_user_activities() TO service_role;

-- DOWN
-- Remove cleanup function
DROP FUNCTION IF EXISTS public.cleanup_old_user_activities();

-- Remove activity logging function
DROP FUNCTION IF EXISTS public.log_user_activity(uuid, text, jsonb, inet, text);

-- Remove indexes
DROP INDEX IF EXISTS public.idx_user_activities_user_type;
DROP INDEX IF EXISTS public.idx_user_activities_created_at;
DROP INDEX IF EXISTS public.idx_user_activities_type;
DROP INDEX IF EXISTS public.idx_user_activities_user_id;

-- Remove RLS policies
DROP POLICY IF EXISTS "service_role_can_insert_activities" ON public.user_activities;
DROP POLICY IF EXISTS "users_can_read_own_activities" ON public.user_activities;

-- Remove table
DROP TABLE IF EXISTS public.user_activities;