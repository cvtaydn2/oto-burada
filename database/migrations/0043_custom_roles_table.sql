-- Migration: 0043_custom_roles_table
-- Purpose: Add a custom_roles table to support user-defined roles beyond the
--          hardcoded system roles (admin, moderator, support, user).
--
-- This migration enables the Admin Roles UI to create, edit, and delete
-- custom roles. System roles remain immutable and are defined in code.
--
-- After applying this migration, re-enable the Create/Edit/Delete buttons
-- in src/components/admin/admin-roles-client.tsx.

-- ── Custom Roles Table ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.custom_roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  permissions TEXT[] NOT NULL DEFAULT '{}',
  is_system   BOOLEAN NOT NULL DEFAULT false,
  created_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT custom_roles_name_unique UNIQUE (name),
  CONSTRAINT custom_roles_name_length CHECK (char_length(name) BETWEEN 2 AND 64),
  CONSTRAINT custom_roles_permissions_not_empty CHECK (array_length(permissions, 1) > 0)
);

-- ── Indexes ───────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_custom_roles_name ON public.custom_roles (name);
CREATE INDEX IF NOT EXISTS idx_custom_roles_is_system ON public.custom_roles (is_system);

-- ── Updated At Trigger ────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_custom_roles_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_custom_roles_updated_at ON public.custom_roles;
CREATE TRIGGER set_custom_roles_updated_at
  BEFORE UPDATE ON public.custom_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_custom_roles_updated_at();

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE public.custom_roles ENABLE ROW LEVEL SECURITY;

-- Only admins can read custom roles
CREATE POLICY "custom_roles_admin_read"
  ON public.custom_roles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
        AND role = 'admin'
    )
  );

-- Only admins can insert custom roles
CREATE POLICY "custom_roles_admin_insert"
  ON public.custom_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
        AND role = 'admin'
    )
  );

-- Only admins can update non-system roles
CREATE POLICY "custom_roles_admin_update"
  ON public.custom_roles
  FOR UPDATE
  TO authenticated
  USING (
    is_system = false
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
        AND role = 'admin'
    )
  );

-- Only admins can delete non-system roles
CREATE POLICY "custom_roles_admin_delete"
  ON public.custom_roles
  FOR DELETE
  TO authenticated
  USING (
    is_system = false
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
        AND role = 'admin'
    )
  );

-- Service role bypasses RLS
GRANT ALL ON public.custom_roles TO service_role;

-- ── Seed System Roles ─────────────────────────────────────────────────────────
-- Insert the 4 system roles as reference data (read-only, is_system=true).
-- These mirror the hardcoded roles in src/services/admin/roles.ts.

INSERT INTO public.custom_roles (id, name, description, permissions, is_system)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Süper Admin',   'Tüm sistem yetkilerine sahip',                    ARRAY['all'],                                                                    true),
  ('00000000-0000-0000-0000-000000000002', 'Moderatör',     'İlan ve rapor yönetimi',                          ARRAY['listings.approve', 'listings.reject', 'reports.manage'],                  true),
  ('00000000-0000-0000-0000-000000000003', 'Destek Ekibi',  'Kullanıcı desteği ve ticket yönetimi',            ARRAY['tickets.manage', 'users.view'],                                           true),
  ('00000000-0000-0000-0000-000000000004', 'Kullanıcı',     'Standart kullanıcı rolü',                         ARRAY['listings.create', 'profile.update'],                                      true)
ON CONFLICT (name) DO NOTHING;

COMMENT ON TABLE public.custom_roles IS
  'User-defined and system roles for admin panel access control. '
  'System roles (is_system=true) are immutable and cannot be deleted or updated.';
