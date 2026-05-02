-- ============================================
-- Fix: Shop creation RLS issue
-- A SECURITY DEFINER function that creates the shop
-- and the owner role in one atomic operation.
-- ============================================

create or replace function public.create_shop_with_owner(
  _name text,
  _address text default null,
  _phone text default null
)
returns json
language plpgsql
security definer
as $$
declare
  _shop_id uuid;
  _user_id uuid := auth.uid();
  _result json;
begin
  if _user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Check if user already has a shop
  if exists (select 1 from public.user_roles where user_id = _user_id) then
    raise exception 'User already has a shop';
  end if;

  -- Create the shop
  insert into public.shops (name, address, phone)
  values (_name, _address, _phone)
  returning id into _shop_id;

  -- Create the owner role
  insert into public.user_roles (user_id, shop_id, role)
  values (_user_id, _shop_id, 'owner');

  -- Return the shop data
  select json_build_object(
    'id', s.id,
    'name', s.name,
    'address', s.address,
    'phone', s.phone,
    'currency', s.currency
  ) into _result
  from public.shops s
  where s.id = _shop_id;

  return _result;
end;
$$;
