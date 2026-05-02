-- ============================================
-- Ethiopia ERP MVP — Functions & Triggers
-- ============================================

-- ============================================
-- Auto-decrement stock on sale item insert
-- ============================================
create or replace function public.decrement_stock()
returns trigger
language plpgsql
security definer
as $$
begin
  update public.products
  set quantity = quantity - new.quantity,
      updated_at = now()
  where id = new.product_id;
  return new;
end;
$$;

create trigger tr_decrement_stock
  after insert on public.sale_items
  for each row
  execute function public.decrement_stock();

-- ============================================
-- Auto-update product timestamp
-- ============================================
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

-- ============================================
-- Auto-update credit status on payment
-- ============================================
create or replace function public.update_credit_on_payment()
returns trigger
language plpgsql
security definer
as $$
declare
  total_paid numeric;
  owed numeric;
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
        when total_paid > 0 then 'partial'
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
