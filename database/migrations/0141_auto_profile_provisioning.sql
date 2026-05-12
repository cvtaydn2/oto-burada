
BEGIN;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email text;

COMMENT ON COLUMN public.profiles.email IS
'auth.users.email ile senkronize edilen üyelik e-postası. public_profiles görünümüne dahil edilmez.';

UPDATE public.profiles AS p
SET email = u.email
FROM auth.users AS u
WHERE u.id = p.id
  AND p.email IS DISTINCT FROM u.email;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_unique_idx
ON public.profiles (lower(email))
WHERE email IS NOT NULL AND btrim(email) <> '';

CREATE OR REPLACE FUNCTION public.protect_profile_sensitive_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  ) THEN
    IF NEW.role <> OLD.role THEN
      RAISE EXCEPTION 'Yetkisiz rol değişimi denemesi. (Role modification restricted)';
    END IF;

    IF NEW.balance_credits <> OLD.balance_credits THEN
      RAISE EXCEPTION 'Yetkisiz bakiye değişimi denemesi. (Balance modification restricted)';
    END IF;

    IF NEW.is_verified <> OLD.is_verified THEN
      RAISE EXCEPTION 'Yetkisiz doğrulama durumu değişimi denemesi. (Verification status modification restricted)';
    END IF;

    IF NEW.verification_status <> OLD.verification_status THEN
      RAISE EXCEPTION 'Yetkisiz doğrulama statüsü değişimi denemesi. (Verification workflow restricted)';
    END IF;

    IF NEW.email IS DISTINCT FROM OLD.email THEN
      RAISE EXCEPTION 'Yetkisiz e-posta değişimi denemesi. (Email modification restricted)';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $$
DECLARE
  v_full_name text;
  v_avatar_url text;
  v_created_at timestamptz;
BEGIN
  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    ''
  );

  v_avatar_url := NULLIF(NEW.raw_user_meta_data->>'avatar_url', '');
  v_created_at := COALESCE(NEW.created_at, timezone('utc', now()));

  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    avatar_url,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    v_full_name,
    v_avatar_url,
    v_created_at,
    timezone('utc', now())
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    updated_at = timezone('utc', now()),
    full_name = CASE
      WHEN COALESCE(public.profiles.full_name, '') = '' AND COALESCE(EXCLUDED.full_name, '') <> ''
        THEN EXCLUDED.full_name
      ELSE public.profiles.full_name
    END,
    avatar_url = COALESCE(public.profiles.avatar_url, EXCLUDED.avatar_url);

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user_profile() IS
'auth.users insert sonrası zorunlu public.profiles kaydı üretir; yetki kaynağı olarak profiles.role modelini destekler.';

DROP TRIGGER IF EXISTS on_auth_user_created_create_profile ON auth.users;

CREATE TRIGGER on_auth_user_created_create_profile
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user_profile();

INSERT INTO public.profiles (
  id,
  email,
  full_name,
  created_at,
  updated_at
)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', ''),
  COALESCE(u.created_at, timezone('utc', now())),
  timezone('utc', now())
FROM auth.users AS u
LEFT JOIN public.profiles AS p
  ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  );
$$;

COMMENT ON FUNCTION public.is_admin() IS
'Admin yetkisini yalnızca public.profiles.role üzerinden hesaplar. JWT/app_metadata hakikat kaynağı değildir.';

REVOKE ALL ON FUNCTION public.handle_new_user_profile() FROM PUBLIC;
GRANT ALL ON FUNCTION public.handle_new_user_profile() TO postgres;
GRANT ALL ON FUNCTION public.handle_new_user_profile() TO service_role;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT ALL ON FUNCTION public.is_admin() TO service_role;
GRANT ALL ON FUNCTION public.is_admin() TO anon;
GRANT ALL ON FUNCTION public.is_admin() TO authenticated;

COMMIT;
