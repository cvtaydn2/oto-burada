-- Mevcut fonksiyon tanımlarını kontrol et
SELECT 
  proname AS function_name,
  prosrc AS function_body,
  prosecdef AS security_definer
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname IN (
    'is_admin',
    'set_updated_at', 
    'update_listing_search_vector',
    'update_chat_last_message_at',
    'increment_listing_view',
    'track_listing_price_change',
    'record_listing_price_change',
    'update_listing_price_indices',
    'recalibrate_all_market_stats',
    'check_api_rate_limit'
  )
ORDER BY proname;
