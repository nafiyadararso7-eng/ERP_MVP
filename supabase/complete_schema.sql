-- ================================================================
-- Ethiopia ERP MVP — Complete Supabase Schema
-- ================================================================
-- Ready to paste into Supabase SQL Editor and execute.
-- Combines: tables, enums, relationships, indexes, RLS policies,
--           helper functions, and triggers.
-- ================================================================
-- ⚠️  Run this on a FRESH Supabase project or ensure no conflicting
--     objects exist. Drop statements are NOT included to prevent
--     accidental data loss.
-- ================================================================


-- ============================================
-- 0. EXTENSIONS
-- ============================================
create extension if not exists "uuid-ossp";


-- ============================================
-- 1. CUSTOM ENUM TYPES
-- ============================================
create type public.app_role      as enum ('owner', 'cashier');
create type public.category_type as enum ('product', 'expense');
create type public.payment_type  as enum ('cash', 'credit');
create type public.credit_status as enum ('pending', 'partial', 'paid');


-- ============================================
-- 2. TABLES
-- ============================================

-- ────────────────────────────────────────────
-- 2a. SHOPS
-- ────────────────────────────────────────────
create table public.shops (
  id         uuid        primary key default uuid_generate_v4(),
  name       text        not null,
  address    text,
  phone      text,
  currency   text        not null default 'ETB',
  created_at timestamptz not null default now()
);

comment on table  public.shops            is 'Business/shop entities — each deployment supports multiple shops.';
comment on column public.shops.currency   is 'Locked to ETB for Ethiopian Birr.';

-- ────────────────────────────────────────────
-- 2b. USER ROLES (join table: auth.users ↔ shops)
-- ────────────────────────────────────────────
create table public.user_roles (
  id         uuid           primary key default uuid_generate_v4(),
  user_id    uuid           not null references auth.users(id) on delete cascade,
  shop_id    uuid           not null references public.shops(id) on delete cascade,
  role       public.app_role not null default 'cashier',
  created_at timestamptz    not null default now(),

  unique(user_id, shop_id)
);

comment on table public.user_roles is 'Maps Supabase Auth users to shops with a role (owner / cashier).';

-- ────────────────────────────────────────────
-- 2c. CATEGORIES (product + expense)
-- ────────────────────────────────────────────
create table public.categories (
  id         uuid               primary key default uuid_generate_v4(),
  shop_id    uuid               not null references public.shops(id) on delete cascade,
  name       text               not null,
  type       public.category_type not null,
  created_at timestamptz        not null default now()
);

comment on table public.categories is 'Shared categories for products and expenses, scoped by shop.';

-- ────────────────────────────────────────────
-- 2d. PRODUCTS
-- ────────────────────────────────────────────
create table public.products (
  id                  uuid          primary key default uuid_generate_v4(),
  shop_id             uuid          not null references public.shops(id) on delete cascade,
  name                text          not null,
  sku                 text,
  category_id         uuid          references public.categories(id) on delete set null,
  quantity            integer       not null default 0,
  buying_price        numeric(12,2) not null default 0,
  selling_price       numeric(12,2) not null default 0,
  low_stock_threshold integer       not null default 5,
  created_at          timestamptz   not null default now(),
  updated_at          timestamptz   not null default now()
);

comment on table  public.products                   is 'Inventory items for a shop.';
comment on column public.products.low_stock_threshold is 'Dashboard alerts when quantity ≤ this value.';

-- ────────────────────────────────────────────
-- 2e. CUSTOMERS
-- ────────────────────────────────────────────
create table public.customers (
  id         uuid        primary key default uuid_generate_v4(),
  shop_id    uuid        not null references public.shops(id) on delete cascade,
  name       text        not null,
  phone      text,
  email      text,
  created_at timestamptz not null default now()
);

comment on table public.customers is 'Customers tracked per shop — needed for credit sales.';

-- ────────────────────────────────────────────
-- 2f. SUPPLIERS
-- ────────────────────────────────────────────
create table public.suppliers (
  id         uuid        primary key default uuid_generate_v4(),
  shop_id    uuid        not null references public.shops(id) on delete cascade,
  name       text        not null,
  phone      text,
  email      text,
  created_at timestamptz not null default now()
);

comment on table public.suppliers is 'Suppliers for expense tracking — optional on expenses.';

-- ────────────────────────────────────────────
-- 2g. SALES
-- ────────────────────────────────────────────
create table public.sales (
  id           uuid              primary key default uuid_generate_v4(),
  shop_id      uuid              not null references public.shops(id) on delete cascade,
  cashier_id   uuid              not null references auth.users(id),
  customer_id  uuid              references public.customers(id) on delete set null,
  payment_type public.payment_type not null default 'cash',
  total        numeric(12,2)     not null default 0,
  created_at   timestamptz       not null default now()
);

comment on table  public.sales             is 'Sales header — one row per checkout transaction.';
comment on column public.sales.cashier_id  is 'References auth.users — the cashier who completed the sale.';

-- ────────────────────────────────────────────
-- 2h. SALE ITEMS (line items of a sale)
-- ────────────────────────────────────────────
create table public.sale_items (
  id         uuid          primary key default uuid_generate_v4(),
  sale_id    uuid          not null references public.sales(id) on delete cascade,
  product_id uuid          not null references public.products(id),
  quantity   integer       not null default 1,
  unit_price numeric(12,2) not null,
  subtotal   numeric(12,2) not null,
  created_at timestamptz   not null default now()
);

comment on table public.sale_items is 'Individual products within a sale transaction.';

-- ────────────────────────────────────────────
-- 2i. EXPENSES
-- ────────────────────────────────────────────
create table public.expenses (
  id          uuid          primary key default uuid_generate_v4(),
  shop_id     uuid          not null references public.shops(id) on delete cascade,
  amount      numeric(12,2) not null,
  category_id uuid          references public.categories(id) on delete set null,
  date        date          not null default current_date,
  note        text,
  supplier_id uuid          references public.suppliers(id) on delete set null,
  created_at  timestamptz   not null default now()
);

comment on table public.expenses is 'Expense log — rent, supplies, salaries, restock costs, etc.';

-- ────────────────────────────────────────────
-- 2j. CREDIT ENTRIES (debtors ledger)
-- ────────────────────────────────────────────
create table public.credit_entries (
  id          uuid               primary key default uuid_generate_v4(),
  shop_id     uuid               not null references public.shops(id) on delete cascade,
  sale_id     uuid               not null references public.sales(id) on delete cascade,
  customer_id uuid               not null references public.customers(id),
  amount_owed numeric(12,2)      not null,
  amount_paid numeric(12,2)      not null default 0,
  status      public.credit_status not null default 'pending',
  created_at  timestamptz        not null default now()
);

comment on table public.credit_entries is 'Tracks credit (on-account) sales and outstanding balances.';

-- ────────────────────────────────────────────
-- 2k. PAYMENTS (against credit entries)
-- ────────────────────────────────────────────
create table public.payments (
  id              uuid          primary key default uuid_generate_v4(),
  shop_id         uuid          not null references public.shops(id) on delete cascade,
  credit_entry_id uuid          not null references public.credit_entries(id) on delete cascade,
  amount          numeric(12,2) not null,
  date            date          not null default current_date,
  created_at      timestamptz   not null default now()
);

comment on table public.payments is 'Partial or full payments received against credit entries.';


-- ============================================
-- 3. INDEXES (performance)
-- ============================================
-- user_roles
create index idx_user_roles_user     on public.user_roles(user_id);
create index idx_user_roles_shop     on public.user_roles(shop_id);

-- categories
create index idx_categories_shop     on public.categories(shop_id);

-- products
create index idx_products_shop       on public.products(shop_id);
create index idx_products_category   on public.products(category_id);
create index idx_products_low_stock  on public.products(shop_id, quantity)
  where quantity <= 5;  -- partial index for dashboard low-stock badge

-- customers
create index idx_customers_shop      on public.customers(shop_id);

-- suppliers
create index idx_suppliers_shop      on public.suppliers(shop_id);

-- sales
create index idx_sales_shop          on public.sales(shop_id);
create index idx_sales_cashier       on public.sales(cashier_id);
create index idx_sales_created_at    on public.sales(shop_id, created_at);  -- for date-range dashboard queries

-- sale_items
create index idx_sale_items_sale     on public.sale_items(sale_id);
create index idx_sale_items_product  on public.sale_items(product_id);

-- expenses
create index idx_expenses_shop       on public.expenses(shop_id);
create index idx_expenses_date       on public.expenses(shop_id, date);  -- for finance summary queries

-- credit_entries
create index idx_credit_entries_shop     on public.credit_entries(shop_id);
create index idx_credit_entries_customer on public.credit_entries(customer_id);
create index idx_credit_entries_status   on public.credit_entries(shop_id, status)
  where status in ('pending', 'partial');  -- partial index for outstanding debts

-- payments
create index idx_payments_credit     on public.payments(credit_entry_id);


-- ============================================
-- 4. HELPER FUNCTIONS (security definer)
-- ============================================

-- Check if a user has a specific role for a given shop.
-- Used inside RLS policies to avoid recursive self-references.
create or replace function public.has_role(
  _user_id uuid,
  _shop_id uuid,
  _role    public.app_role
)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id
      and shop_id = _shop_id
      and role    = _role
  );
$$;

comment on function public.has_role is 'SECURITY DEFINER — checks user role without triggering user_roles RLS.';

-- Return the shop_id for the currently authenticated user.
-- Convenience for RLS policies.
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

comment on function public.get_user_shop_id is 'Returns the first shop_id associated with the current auth user.';


-- ============================================
-- 5. TRIGGERS & TRIGGER FUNCTIONS
-- ============================================

-- ─── 5a. Auto-decrement stock when a sale_item is inserted ───
create or replace function public.decrement_stock()
returns trigger
language plpgsql
security definer
as $$
begin
  update public.products
  set quantity   = quantity - new.quantity,
      updated_at = now()
  where id = new.product_id;
  return new;
end;
$$;

create trigger tr_decrement_stock
  after insert on public.sale_items
  for each row
  execute function public.decrement_stock();

-- ─── 5b. Auto-update products.updated_at on any update ───
create or replace function public.update_product_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger tr_update_product_timestamp
  before update on public.products
  for each row
  execute function public.update_product_timestamp();

-- ─── 5c. Auto-update credit_entries on payment insert ───
-- Recalculates amount_paid and flips status to partial/paid.
create or replace function public.update_credit_on_payment()
returns trigger
language plpgsql
security definer
as $$
declare
  total_paid numeric;
  owed       numeric;
begin
  select coalesce(sum(amount), 0) into total_paid
  from public.payments
  where credit_entry_id = new.credit_entry_id;

  select amount_owed into owed
  from public.credit_entries
  where id = new.credit_entry_id;

  update public.credit_entries
  set amount_paid = total_paid,
      status = case
        when total_paid >= owed then 'paid'
        when total_paid > 0    then 'partial'
        else 'pending'
      end
  where id = new.credit_entry_id;

  return new;
end;
$$;

create trigger tr_update_credit_on_payment
  after insert on public.payments
  for each row
  execute function public.update_credit_on_payment();


-- ============================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- ─── 6a. SHOPS ───
alter table public.shops enable row level security;

create policy "Users can view their own shop"
  on public.shops for select
  using (id in (select shop_id from public.user_roles where user_id = auth.uid()));

create policy "Owners can update their shop"
  on public.shops for update
  using (public.has_role(auth.uid(), id, 'owner'));

create policy "Anyone can create a shop (signup flow)"
  on public.shops for insert
  with check (true);

-- ─── 6b. USER ROLES ───
alter table public.user_roles enable row level security;

create policy "Users can view roles in their shop"
  on public.user_roles for select
  using (shop_id in (select ur.shop_id from public.user_roles ur where ur.user_id = auth.uid()));

create policy "Anyone can insert their own role (signup)"
  on public.user_roles for insert
  with check (user_id = auth.uid());

create policy "Owners can insert roles (invite cashier)"
  on public.user_roles for insert
  with check (public.has_role(auth.uid(), shop_id, 'owner'));

create policy "Owners can delete roles"
  on public.user_roles for delete
  using (public.has_role(auth.uid(), shop_id, 'owner'));

-- ─── 6c. CATEGORIES ───
alter table public.categories enable row level security;

create policy "Users can view categories in their shop"
  on public.categories for select
  using (shop_id = public.get_user_shop_id());

create policy "Owners can manage categories"
  on public.categories for all
  using (public.has_role(auth.uid(), shop_id, 'owner'));

-- ─── 6d. PRODUCTS ───
alter table public.products enable row level security;

create policy "Users can view products in their shop"
  on public.products for select
  using (shop_id = public.get_user_shop_id());

create policy "Owners can manage products"
  on public.products for all
  using (public.has_role(auth.uid(), shop_id, 'owner'));

-- ─── 6e. CUSTOMERS ───
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

-- ─── 6f. SUPPLIERS ───
alter table public.suppliers enable row level security;

create policy "Users can view suppliers in their shop"
  on public.suppliers for select
  using (shop_id = public.get_user_shop_id());

create policy "Owners can manage suppliers"
  on public.suppliers for all
  using (public.has_role(auth.uid(), shop_id, 'owner'));

-- ─── 6g. SALES ───
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

-- ─── 6h. SALE ITEMS ───
alter table public.sale_items enable row level security;

create policy "Users can view sale items for their shop sales"
  on public.sale_items for select
  using (sale_id in (select id from public.sales where shop_id = public.get_user_shop_id()));

create policy "Users can insert sale items"
  on public.sale_items for insert
  with check (sale_id in (select id from public.sales where shop_id = public.get_user_shop_id()));

-- ─── 6i. EXPENSES ───
alter table public.expenses enable row level security;

create policy "Users can view expenses in their shop"
  on public.expenses for select
  using (shop_id = public.get_user_shop_id());

create policy "Users can insert expenses"
  on public.expenses for insert
  with check (shop_id = public.get_user_shop_id());

create policy "Owners can manage expenses"
  on public.expenses for all
  using (public.has_role(auth.uid(), shop_id, 'owner'));

-- ─── 6j. CREDIT ENTRIES ───
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

-- ─── 6k. PAYMENTS ───
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


-- ============================================
-- ✅ DONE — Schema is ready.
-- ============================================
-- Tables:   shops, user_roles, categories, products, customers,
--           suppliers, sales, sale_items, expenses, credit_entries, payments
-- Enums:    app_role, category_type, payment_type, credit_status
-- Functions: has_role(), get_user_shop_id()
-- Triggers: tr_decrement_stock, tr_update_product_timestamp,
--           tr_update_credit_on_payment
-- RLS:      Enabled on all 11 tables with shop-scoped policies
-- ============================================
