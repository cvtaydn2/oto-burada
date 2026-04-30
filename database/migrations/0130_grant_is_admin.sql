-- Grant EXECUTE permission on is_admin() to anon and authenticated roles
-- This is required for RLS policies that use this function
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;
