-- Add user management action types to moderation_action enum for audit logging
-- These actions are used in admin user management operations (ban, unban, promote, demote, delete)

ALTER TYPE public.moderation_action ADD VALUE IF NOT EXISTS 'ban';
ALTER TYPE public.moderation_action ADD VALUE IF NOT EXISTS 'unban';
ALTER TYPE public.moderation_action ADD VALUE IF NOT EXISTS 'promote';
ALTER TYPE public.moderation_action ADD VALUE IF NOT EXISTS 'demote';
ALTER TYPE public.moderation_action ADD VALUE IF NOT EXISTS 'delete_user';

