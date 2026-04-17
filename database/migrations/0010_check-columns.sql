-- Kritik tabloların kolon listesi — DB vs Kod karşılaştırması için
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
    'listings', 'profiles', 'payments', 'admin_actions',
    'eids_audit_logs', 'listing_views', 'market_stats',
    'pricing_plans', 'roles', 'seller_reviews', 'tickets',
    'chats', 'messages', 'notifications', 'favorites',
    'reports', 'saved_searches', 'platform_settings'
  )
ORDER BY table_name, ordinal_position;
