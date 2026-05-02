-- ============================================
-- Ethiopia ERP MVP — Database Schema
-- ============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- SHOPS
-- ============================================
create table public.shops (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  address text,
  phone text,
  currency text not null default 'ETB',
  created_at timestamptz not null default now()
);

-- ============================================
-- USER ROLES
-- ============================================
create type public.app_role as enum ('owner', 'cashier');

create table public.user_roles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  shop_id uuid not null references public.shops(id) on delete cascade,
  role public.app_role not null default 'cashier',
  created_at timestamptz not null default now(),
  unique(user_id, shop_id)
);

-- ============================================
-- CATEGORIES (product + expense)
-- ============================================
create type public.category_type as enum ('product', 'expense');

create table public.categories (
  id uuid primary key default uuid_generate_v4(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  name text not null,
  type public.category_type not null,
  created_at timestamptz not null default now()
);

-- ============================================
-- PRODUCTS
-- ============================================
create table public.products (
  id uuid primary key default uuid_generate_v4(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  name text not null,
  sku text,
  category_id uuid references public.categories(id) on delete set null,
  quantity integer not null default 0,
  buying_price numeric(12,2) not null default 0,
  selling_price numeric(12,2) not null default 0,
  low_stock_threshold integer not null default 5,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- CUSTOMERS
-- ============================================
create table public.customers (
  id uuid primary key default uuid_generate_v4(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  created_at timestamptz not null default now()
);

-- ============================================
-- SUPPLIERS
-- ============================================
create table public.suppliers (
  id uuid primary key default uuid_generate_v4(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  created_at timestamptz not null default now()
);

-- ============================================
-- SALES
-- ============================================
create type public.payment_type as enum ('cash', 'credit');

create table public.sales (
  id uuid primary key default uuid_generate_v4(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  cashier_id uuid not null references auth.users(id),
  customer_id uuid references public.customers(id) on delete set null,
  payment_type public.payment_type not null default 'cash',
  total numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

-- ============================================
-- SALE ITEMS
-- ============================================
create table public.sale_items (
  id uuid primary key default uuid_generate_v4(),
  sale_id uuid not null references public.sales(id) on delete cascade,
  product_id uuid not null references public.products(id),
  quantity integer not null default 1,
  unit_price numeric(12,2) not null,
  subtotal numeric(12,2) not null,
  created_at timestamptz not null default now()
);

-- ============================================
-- EXPENSES
-- ============================================
create table public.expenses (
  id uuid primary key default uuid_generate_v4(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  amount numeric(12,2) not null,
  category_id uuid references public.categories(id) on delete set null,
  date date not null default current_date,
  note text,
  supplier_id uuid references public.suppliers(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ============================================
-- CREDIT ENTRIES
-- ============================================
create type public.credit_status as enum ('pending', 'partial', 'paid');

create table public.credit_entries (
  id uuid primary key default uuid_generate_v4(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  sale_id uuid not null references public.sales(id) on delete cascade,
  customer_id uuid not null references public.customers(id),
  amount_owed numeric(12,2) not null,
  amount_paid numeric(12,2) not null default 0,
  status public.credit_status not null default 'pending',
  created_at timestamptz not null default now()
);

-- ============================================
-- PAYMENTS
-- ============================================
create table public.payments (
  id uuid primary key default uuid_generate_v4(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  credit_entry_id uuid not null references public.credit_entries(id) on delete cascade,
  amount numeric(12,2) not null,
  date date not null default current_date,
  created_at timestamptz not null default now()
);

-- ============================================
-- INDEXES
-- ============================================
create index idx_user_roles_user on public.user_roles(user_id);
create index idx_user_roles_shop on public.user_roles(shop_id);
create index idx_products_shop on public.products(shop_id);
create index idx_sales_shop on public.sales(shop_id);
create index idx_sales_cashier on public.sales(cashier_id);
create index idx_sale_items_sale on public.sale_items(sale_id);
create index idx_expenses_shop on public.expenses(shop_id);
create index idx_credit_entries_shop on public.credit_entries(shop_id);
create index idx_credit_entries_customer on public.credit_entries(customer_id);
create index idx_payments_credit on public.payments(credit_entry_id);
create index idx_categories_shop on public.categories(shop_id);
create index idx_customers_shop on public.customers(shop_id);
create index idx_suppliers_shop on public.suppliers(shop_id);
