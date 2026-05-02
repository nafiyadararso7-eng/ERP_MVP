-- ============================================
-- Fix: infinite recursion in user_roles RLS
-- ============================================

-- Drop the broken policy
drop policy if exists "Users can view roles in their shop" on public.user_roles;

-- Replace with a non-recursive policy:
-- Users can see their OWN role rows directly (no self-reference)
create policy "Users can view own roles"
  on public.user_roles for select
  using (user_id = auth.uid());

-- Also fix the shops SELECT policy which queries user_roles directly
-- (this can also trigger recursion since user_roles RLS fires on that sub-select)
drop policy if exists "Users can view their own shop" on public.shops;

create policy "Users can view their own shop"
  on public.shops for select
  using (id = public.get_user_shop_id());
