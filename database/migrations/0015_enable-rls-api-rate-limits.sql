-- Migration: Enable RLS on api_rate_limits table
-- Supabase Security Advisor uyarısını gidermek için
-- Bu tabloyu sadece service_role erişebilmeli, public erişim olmamalı

-- RLS'i aktif et
ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;

-- Mevcut tüm politikaları temizle (varsa)
DROP POLICY IF EXISTS "api_rate_limits_service_only" ON public.api_rate_limits;

-- Sadece service_role erişebilir (anon ve authenticated erişemez)
-- Bu tablo rate limiting için internal kullanım — public erişim gerekmez
CREATE POLICY "api_rate_limits_service_only"
  ON public.api_rate_limits
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Doğrulama
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'api_rate_limits';
