-- Add admin grant action types to moderation_action enum for audit logging
-- These actions are used in admin user management operations (credit_grant, doping_grant)

ALTER TYPE public.moderation_action ADD VALUE IF NOT EXISTS 'credit_grant';
ALTER TYPE public.moderation_action ADD VALUE IF NOT EXISTS 'doping_grant';