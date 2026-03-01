-- ============================================================
-- Fix: invite join household
-- When a user signs up with a valid invite_code in their auth
-- metadata, link them to the existing household instead of
-- creating a new one. Falls back to creating a new household
-- (with default seeds) if no valid invite code is found.
-- ============================================================

create or replace function public.handle_new_user()
returns trigger as $$
declare
  new_household_id uuid;
  raw_invite_code  text;
begin
  -- Check if an invite code was provided during sign-up
  raw_invite_code := trim(new.raw_user_meta_data->>'invite_code');

  -- If a valid invite code is provided, look up the matching household
  if raw_invite_code is not null and raw_invite_code <> '' then
    select id into new_household_id
    from public.households
    where invite_code = raw_invite_code
    limit 1;
  end if;

  -- If no household found via invite, create a new one and seed defaults
  if new_household_id is null then
    insert into public.households (name)
    values (coalesce(new.raw_user_meta_data->>'display_name', 'My') || '''s Household')
    returning id into new_household_id;

    insert into public.locations (household_id, name) values
      (new_household_id, 'Fridge'),
      (new_household_id, 'Freezer'),
      (new_household_id, 'Pantry'),
      (new_household_id, 'Counter');

    insert into public.categories (household_id, name) values
      (new_household_id, 'Dairy'),
      (new_household_id, 'Meat'),
      (new_household_id, 'Produce'),
      (new_household_id, 'Grains'),
      (new_household_id, 'Beverages'),
      (new_household_id, 'Snacks'),
      (new_household_id, 'Condiments'),
      (new_household_id, 'Frozen');
  end if;

  -- Always create the profile
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
