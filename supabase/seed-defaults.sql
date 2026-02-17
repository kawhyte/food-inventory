-- ============================================================
-- Food Inventory App — Seed Defaults Patch
-- Run this in the Supabase SQL Editor AFTER schema.sql
-- Updates handle_new_user to also seed default locations and categories.
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

  -- Seed default locations
  insert into public.locations (household_id, name) values
    (new_household_id, 'Fridge'),
    (new_household_id, 'Freezer'),
    (new_household_id, 'Pantry'),
    (new_household_id, 'Counter');

  -- Seed default categories
  insert into public.categories (household_id, name) values
    (new_household_id, 'Dairy'),
    (new_household_id, 'Meat'),
    (new_household_id, 'Produce'),
    (new_household_id, 'Grains'),
    (new_household_id, 'Beverages'),
    (new_household_id, 'Snacks'),
    (new_household_id, 'Condiments'),
    (new_household_id, 'Frozen');

  return new;
end;
$$ language plpgsql security definer;

-- Re-create the trigger (body-only change, but re-create defensively)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ============================================================
-- MANUAL SEED for existing dev accounts
-- Replace 'YOUR_HOUSEHOLD_ID' with your actual household UUID
-- (find it in the Supabase Table Editor → households table)
-- ============================================================

-- insert into public.locations (household_id, name) values
--   ('YOUR_HOUSEHOLD_ID', 'Fridge'),
--   ('YOUR_HOUSEHOLD_ID', 'Freezer'),
--   ('YOUR_HOUSEHOLD_ID', 'Pantry'),
--   ('YOUR_HOUSEHOLD_ID', 'Counter');

-- insert into public.categories (household_id, name) values
--   ('YOUR_HOUSEHOLD_ID', 'Dairy'),
--   ('YOUR_HOUSEHOLD_ID', 'Meat'),
--   ('YOUR_HOUSEHOLD_ID', 'Produce'),
--   ('YOUR_HOUSEHOLD_ID', 'Grains'),
--   ('YOUR_HOUSEHOLD_ID', 'Beverages'),
--   ('YOUR_HOUSEHOLD_ID', 'Snacks'),
--   ('YOUR_HOUSEHOLD_ID', 'Condiments'),
--   ('YOUR_HOUSEHOLD_ID', 'Frozen');
