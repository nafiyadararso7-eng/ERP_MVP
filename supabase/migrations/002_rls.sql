-- ============================================
-- Ethiopia ERP MVP — Row Level Security
-- ============================================

-- ============================================
-- Helper function: check user role
-- ============================================
create or replace function public.has_role(_user_id uuid, _shop_id uuid, _role public.app_role)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id
      and shop_id = _shop_id
      and role = _role
  );
$$;

-- Helper: get shop_id for current user
create or replace function public.get_user_shop_id()
returns uuid
language sql
security definer
stable
as $$
  select shop_id from public.user_roles
  where user_id = auth.uid()
  limit 1;
$$;

-- ============================================
-- SHOPS RLS
-- ============================================
alter table public.shops enable row level security;

create policy "Users can view their own shop"
  on public.shops for select
  using (id in (select shop_id from public.user_roles where user_id = auth.uid()));

create policy "Owners can update their shop"
  on public.shops for update
  using (public.has_role(auth.uid(), id, 'owner'));

create policy "Anyone can create a shop (for signup)"
  on public.shops for insert
  with check (true);

-- ============================================
-- USER ROLES RLS
-- ============================================
alter table public.user_roles enable row level security;

create policy "Users can view roles in their shop"
  on public.user_roles for select
  using (shop_id in (select shop_id from public.user_roles ur where ur.user_id = auth.uid()));

create policy "Anyone can insert their own role (signup)"
  on public.user_roles for insert
  with check (user_id = auth.uid());

create policy "Owners can insert roles (invite)"
  on public.user_roles for insert
  with check (public.has_role(auth.uid(), shop_id, 'owner'));

create policy "Owners can delete roles"
  on public.user_roles for delete
  using (public.has_role(auth.uid(), shop_id, 'owner'));

-- ============================================
-- CATEGORIES RLS
-- ============================================
alter table public.categories enable row level security;

create policy "Users can view categories in their shop"
  on public.categories for select
  using (shop_id = public.get_user_shop_id());

create policy "Owners can manage categories"
  on public.categories for all
  using (public.has_role(auth.uid(), shop_id, 'owner'));

-- ============================================
-- PRODUCTS RLS
-- ============================================
alter table public.products enable row level security;

create policy "Users can view products in their shop"
  on public.products for select
  using (shop_id = public.get_user_shop_id());

create policy "Owners can manage products"
  on public.products for all
  using (public.has_role(auth.uid(), shop_id, 'owner'));

-- ============================================
-- CUSTOMERS RLS
-- ============================================
alter table public.customers enable row level security;

create policy "Users can view customers in their shop"
  on public.customers for select
  using (shop_id = public.get_user_shop_id());

create policy "Users can insert customers"
  on public.customers for insert
  with check (shop_id = public.get_user_shop_id());

create policy "Owners can manage customers"
  on public.customers for all
  using (public.has_role(auth.uid(), shop_id, 'owner'));

-- ============================================
-- SUPPLIERS RLS
-- ============================================
alter table public.suppliers enable row level security;

create policy "Users can view suppliers in their shop"
  on public.suppliers for select
  using (shop_id = public.get_user_shop_id());

create policy "Owners can manage suppliers"
  on public.suppliers for all
  using (public.has_role(auth.uid(), shop_id, 'owner'));

-- ============================================
-- SALES RLS
-- ============================================
alter table public.sales enable row level security;

create policy "Users can view sales in their shop"
  on public.sales for select
  using (shop_id = public.get_user_shop_id());

create policy "Users can insert sales"
  on public.sales for insert
  with check (shop_id = public.get_user_shop_id());

create policy "Owners can manage sales"
  on public.sales for all
  using (public.has_role(auth.uid(), shop_id, 'owner'));

-- ============================================
-- SALE ITEMS RLS
-- ============================================
alter table public.sale_items enable row level security;

create policy "Users can view sale items for their shop sales"
  on public.sale_items for select
  using (sale_id in (select id from public.sales where shop_id = public.get_user_shop_id()));

create policy "Users can insert sale items"
  on public.sale_items for insert
  with check (sale_id in (select id from public.sales where shop_id = public.get_user_shop_id()));

-- ============================================
-- EXPENSES RLS
-- ============================================
alter table public.expenses enable row level security;

create policy "Users can view expenses in their shop"
  on public.expenses for select
  using (shop_id = public.get_user_shop_id());

create policy "Owners can manage expenses"
  on public.expenses for all
  using (public.has_role(auth.uid(), shop_id, 'owner'));

-- ============================================
-- CREDIT ENTRIES RLS
-- ============================================
alter table public.credit_entries enable row level security;

create policy "Users can view credits in their shop"
  on public.credit_entries for select
  using (shop_id = public.get_user_shop_id());

create policy "Users can insert credits"
  on public.credit_entries for insert
  with check (shop_id = public.get_user_shop_id());

create policy "Owners can manage credits"
  on public.credit_entries for all
  using (public.has_role(auth.uid(), shop_id, 'owner'));

-- ============================================
-- PAYMENTS RLS
-- ============================================
alter table public.payments enable row level security;

create policy "Users can view payments in their shop"
  on public.payments for select
  using (shop_id = public.get_user_shop_id());

create policy "Users can insert payments"
  on public.payments for insert
  with check (shop_id = public.get_user_shop_id());

create policy "Owners can manage payments"
  on public.payments for all
  using (public.has_role(auth.uid(), shop_id, 'owner'));
