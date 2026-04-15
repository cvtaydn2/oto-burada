-- Eski check_api_rate_limit overload'ını kaldır
-- (p_window_ms integer — search_path ayarlanmamış eski versiyon)
DROP FUNCTION IF EXISTS public.check_api_rate_limit(text, integer, integer);

-- Doğrulama — sadece 1 satır kalmalı, config = search_path=""
SELECT oid, proname, proargtypes::text, proconfig
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname = 'check_api_rate_limit';
