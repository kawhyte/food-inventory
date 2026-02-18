-- ============================================================
-- Push Subscriptions — run in Supabase SQL Editor
-- ============================================================

create table if not exists public.push_subscriptions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  household_id  uuid not null references public.households(id) on delete cascade,
  endpoint      text not null unique,   -- unique: enables idempotent upsert by device
  subscription  jsonb not null,         -- full PushSubscriptionJSON blob
  created_at    timestamptz not null default now()
);

create index if not exists push_subscriptions_household_idx
  on public.push_subscriptions (household_id);

alter table public.push_subscriptions enable row level security;

create policy "push_subscriptions_own" on public.push_subscriptions
  for all using (user_id = auth.uid());
