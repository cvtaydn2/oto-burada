begin;

-- 1. Create listing_contact_leads table
create table if not exists public.listing_contact_leads (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  seller_id uuid not null references public.profiles(id) on delete cascade,
  buyer_id uuid null references public.profiles(id) on delete set null,
  contact_name text not null check (char_length(contact_name) between 2 and 80),
  contact_phone text not null check (char_length(contact_phone) between 7 and 20),
  contact_message text null check (
    contact_message is null
    or char_length(contact_message) <= 1000
  ),
  source text not null default 'whatsapp_cta' check (source in ('whatsapp_cta')),
  created_at timestamptz not null default now()
);

create index if not exists idx_listing_contact_leads_listing_id
  on public.listing_contact_leads(listing_id);

create index if not exists idx_listing_contact_leads_seller_id
  on public.listing_contact_leads(seller_id);

create index if not exists idx_listing_contact_leads_buyer_id
  on public.listing_contact_leads(buyer_id);

-- 2. ALTER existing fulfillment_jobs table
-- Remove NOT NULL from payment_id to allow non-payment jobs
alter table public.fulfillment_jobs alter column payment_id drop not null;

-- Add idempotency_key
alter table public.fulfillment_jobs add column if not exists idempotency_key text;

-- Populate existing idempotency keys so we can make it unique
update public.fulfillment_jobs set idempotency_key = gen_random_uuid()::text where idempotency_key is null;

-- Add unique constraint (if not already existing)
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'fulfillment_jobs_idempotency_key_key'
  ) then
    alter table public.fulfillment_jobs add constraint fulfillment_jobs_idempotency_key_key unique(idempotency_key);
  end if;
end $$;

-- Update job_type check constraint to include 'listing_contact_created'
alter table public.fulfillment_jobs drop constraint if exists fulfillment_jobs_job_type_check;
alter table public.fulfillment_jobs add constraint fulfillment_jobs_job_type_check 
check (job_type = any (array['credit_add'::text, 'doping_apply'::text, 'notification_send'::text, 'listing_contact_created'::text]));

-- 3. Enable RLS
alter table public.listing_contact_leads enable row level security;

-- 4. RLS Policies
drop policy if exists "listing_contact_leads_select_own_buyer" on public.listing_contact_leads;
create policy "listing_contact_leads_select_own_buyer"
on public.listing_contact_leads
for select
to authenticated
using (buyer_id = (select auth.uid()));

drop policy if exists "listing_contact_leads_select_own_seller" on public.listing_contact_leads;
create policy "listing_contact_leads_select_own_seller"
on public.listing_contact_leads
for select
to authenticated
using (seller_id = (select auth.uid()));

drop policy if exists "listing_contact_leads_insert_own_or_anon" on public.listing_contact_leads;
create policy "listing_contact_leads_insert_own_or_anon"
on public.listing_contact_leads
for insert
to anon, authenticated
with check (
  buyer_id is null
  or buyer_id = (select auth.uid())
);

-- 5. Stored Procedure create_listing_contact_lead (FIXED)
create or replace function public.create_listing_contact_lead(
  p_listing_id uuid,
  p_contact_name text,
  p_contact_phone text,
  p_contact_message text,
  p_source text default 'whatsapp_cta'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid;
  v_listing_id uuid;
  v_seller_id uuid;
  v_contact_id uuid;
  v_contact_name text;
  v_contact_phone text;
  v_contact_message text;
begin
  v_actor_id := (select auth.uid());
  v_contact_name := left(trim(coalesce(p_contact_name, '')), 80);
  v_contact_phone := left(trim(coalesce(p_contact_phone, '')), 20);
  v_contact_message := case
    when p_contact_message is null or btrim(p_contact_message) = '' then null
    else left(trim(p_contact_message), 1000)
  end;

  if p_source is distinct from 'whatsapp_cta' then
    raise exception 'INVALID_SOURCE';
  end if;

  if char_length(v_contact_name) < 2 then
    raise exception 'INVALID_CONTACT_NAME';
  end if;

  if char_length(v_contact_phone) < 7 then
    raise exception 'INVALID_CONTACT_PHONE';
  end if;

  select l.id, l.seller_id
    into v_listing_id, v_seller_id
  from public.listings l
  inner join public.profiles seller
    on seller.id = l.seller_id
   and coalesce(seller.is_banned, false) = false
  where l.id = p_listing_id
    and l.status = 'published'
  limit 1;

  if v_listing_id is null then
    raise exception 'LISTING_NOT_FOUND';
  end if;

  if v_actor_id is not null and v_actor_id = v_seller_id then
    raise exception 'SELF_CONTACT_NOT_ALLOWED';
  end if;

  insert into public.listing_contact_leads (
    listing_id,
    seller_id,
    buyer_id,
    contact_name,
    contact_phone,
    contact_message,
    source
  )
  values (
    v_listing_id,
    v_seller_id,
    v_actor_id,
    v_contact_name,
    v_contact_phone,
    v_contact_message,
    p_source
  )
  returning id into v_contact_id;

  insert into public.fulfillment_jobs (
    job_type,
    metadata, 
    idempotency_key
  )
  values (
    'listing_contact_created',
    jsonb_build_object(
      'contact_lead_id', v_contact_id,
      'listing_id', v_listing_id,
      'seller_id', v_seller_id,
      'buyer_id', v_actor_id,
      'source', p_source
    ),
    'listing_contact_created:' || v_contact_id::text
  )
  on conflict (idempotency_key) do nothing;

  return v_contact_id;
end;
$$;

revoke all on function public.create_listing_contact_lead(uuid, text, text, text, text) from public;
grant execute on function public.create_listing_contact_lead(uuid, text, text, text, text) to anon, authenticated;

commit;
