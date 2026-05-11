-- Add tracking column to prevent spamming users with multiple warning notifications for the same expiring doping.
ALTER TABLE doping_purchases ADD COLUMN IF NOT EXISTS expiry_warning_sent boolean DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_doping_purchases_warning_sent ON doping_purchases(expiry_warning_sent) WHERE status = 'active';
