-- 0003_rls.sql — Row Level Security
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.suppliers enable row level security;
alter table public.locations enable row level security;
alter table public.products enable row level security;
alter table public.inventory enable row level security;
alter table public.stock_movements enable row level security;
alter table public.purchase_orders enable row level security;
alter table public.purchase_order_items enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;

-- Profiles: read all (active users); self-update name; admin manages roles
create policy profiles_select on public.profiles
  for select using (public.current_user_role() is not null);
create policy profiles_update_self on public.profiles
  for update using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));
create policy profiles_admin_all on public.profiles
  for all using (public.current_user_role() = 'admin');

-- Reference data & products: read = any active user; write = admin/manager
create policy read_all_categories on public.categories for select using (public.current_user_role() is not null);
create policy write_categories on public.categories for all using (public.current_user_role() in ('admin','manager'));

create policy read_all_suppliers on public.suppliers for select using (public.current_user_role() is not null);
create policy write_suppliers on public.suppliers for all using (public.current_user_role() in ('admin','manager'));

create policy read_all_locations on public.locations for select using (public.current_user_role() is not null);
create policy write_locations on public.locations for all using (public.current_user_role() = 'admin');

create policy read_all_products on public.products for select using (public.current_user_role() is not null);
create policy write_products on public.products for all using (public.current_user_role() in ('admin','manager'));

-- Inventory & movements: read-only from client. All writes go through
-- SECURITY DEFINER RPCs (record_sale / receive_purchase_order / adjust_stock).
create policy read_inventory on public.inventory for select using (public.current_user_role() is not null);
create policy read_movements on public.stock_movements for select using (public.current_user_role() is not null);
-- (no insert/update policies: direct writes are denied by default)

-- Purchase orders: read any; create/update = admin/manager (status flips to
-- 'received' only via RPC, but draft editing happens directly)
create policy read_pos on public.purchase_orders for select using (public.current_user_role() is not null);
create policy write_pos on public.purchase_orders for all using (public.current_user_role() in ('admin','manager'));
create policy read_po_items on public.purchase_order_items for select using (public.current_user_role() is not null);
create policy write_po_items on public.purchase_order_items for all using (public.current_user_role() in ('admin','manager'));

-- Sales: created only via record_sale RPC; reads role-scoped
create policy read_sales on public.sales for select
  using (public.current_user_role() in ('admin','manager') or created_by = auth.uid());
create policy read_sale_items on public.sale_items for select
  using (exists (select 1 from public.sales s where s.id = sale_id
                 and (public.current_user_role() in ('admin','manager') or s.created_by = auth.uid())));

-- Views run with invoker rights and inherit the above policies.
