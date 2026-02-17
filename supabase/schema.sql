-- ============================================================
-- Food Inventory App — Database Schema
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Enable UUID extension (already enabled by default in Supabase)
create extension if not exists "pgcrypto";

-- ============================================================
-- TABLES
-- ============================================================

-- households
create table if not exists public.households (
  id          uuid primary key default gen_random_uuid(),
  name        text not null default 'My Household',
  invite_code text unique not null default upper(substring(gen_random_uuid()::text, 1, 8)),
  created_at  timestamptz not null default now()
);

-- profiles (one per auth user)
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  household_id  uuid not null references public.households(id) on delete cascade,
  display_name  text not null,
  created_at    timestamptz not null default now()
);

-- locations (e.g. Fridge, Pantry, Freezer)
create table if not exists public.locations (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references public.households(id) on delete cascade,
  name          text not null,
  created_at    timestamptz not null default now()
);

-- categories (e.g. Dairy, Meat, Produce)
create table if not exists public.categories (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references public.households(id) on delete cascade,
  name          text not null,
  created_at    timestamptz not null default now()
);

-- items
create table if not exists public.items (
  id            uuid primary key default gen_random_uuid(),
  household_id  uuid not null references public.households(id) on delete cascade,
  location_id   uuid references public.locations(id) on delete set null,
  category_id   uuid references public.categories(id) on delete set null,
  name          text not null,
  quantity      numeric not null default 1,
  unit          text,
  expiry_date   date,
  status        text not null default 'available' check (status in ('available', 'low', 'expired', 'consumed')),
  image_url     text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Auto-update updated_at on items
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists items_set_updated_at on public.items;
create trigger items_set_updated_at
  before update on public.items
  for each row execute function public.set_updated_at();

-- ============================================================
-- AUTO-CREATE PROFILE + HOUSEHOLD ON SIGN-UP
-- Triggered after a new user is inserted into auth.users
-- ============================================================

create or replace function public.handle_new_user()
returns trigger as $$
declare
  new_household_id uuid;
begin
  -- Create a new household for this user
  insert into public.households (name)
  values (coalesce(new.raw_user_meta_data->>'display_name', 'My') || '''s Household')
  returning id into new_household_id;

  -- Create a profile linking user to household
  insert into public.profiles (id, household_id, display_name)
  values (
    new.id,
    new_household_id,
    coalesce(new.raw_user_meta_data->>'display_name', new.email)
  );

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.households  enable row level security;
alter table public.profiles    enable row level security;
alter table public.locations   enable row level security;
alter table public.categories  enable row level security;
alter table public.items       enable row level security;

-- Helper function: get the current user's household_id
create or replace function public.my_household_id()
returns uuid as $$
  select household_id from public.profiles where id = auth.uid();
$$ language sql stable security definer;

-- households: members can read/update their own household
create policy "household_select" on public.households
  for select using (id = public.my_household_id());

create policy "household_update" on public.households
  for update using (id = public.my_household_id());

-- profiles: users can read profiles in their household; update only their own
create policy "profiles_select" on public.profiles
  for select using (household_id = public.my_household_id());

create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid());

-- locations
create policy "locations_all" on public.locations
  for all using (household_id = public.my_household_id());

-- categories
create policy "categories_all" on public.categories
  for all using (household_id = public.my_household_id());

-- items
create policy "items_all" on public.items
  for all using (household_id = public.my_household_id());
