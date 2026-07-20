-- 0002_functions_triggers.sql — business logic in the database

-- Role helper (used by RLS)
create or replace function public.current_user_role()
returns user_role
language sql stable security definer set search_path = public
as $$
  select role from public.profiles where id = auth.uid() and active
$$;

-- Auto-create profile on signup (default role: staff)
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Ledger → inventory upsert. The ONLY writer of inventory.quantity.
create or replace function public.apply_stock_movement()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.inventory (product_id, location_id, quantity, updated_at)
  values (new.product_id, new.location_id, new.delta, now())
  on conflict (product_id, location_id)
  do update set quantity = public.inventory.quantity + new.delta, updated_at = now();

  if (select quantity from public.inventory
      where product_id = new.product_id and location_id = new.location_id) < 0 then
    raise exception 'Insufficient stock for product %', new.product_id;
  end if;
  return new;
end;
$$;

create trigger trg_apply_stock_movement
after insert on public.stock_movements
for each row execute function public.apply_stock_movement();

-- Default location helper
create or replace function public.default_location_id()
returns uuid language sql stable set search_path = public
as $$ select id from public.locations where is_default limit 1 $$;

-- ── RPC: record_sale(items jsonb, customer text) ────────────────────
-- items: [{"product_id": "...", "quantity": 2, "unit_price": 9.99}, ...]
create or replace function public.record_sale(items jsonb, customer text default null)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_sale_id uuid;
  v_item jsonb;
  v_total numeric(12,2) := 0;
begin
  if public.current_user_role() is null then
    raise exception 'Not authorized';
  end if;
  if jsonb_array_length(items) = 0 then
    raise exception 'Sale must contain at least one item';
  end if;

  insert into public.sales (customer_name, created_by)
  values (customer, auth.uid()) returning id into v_sale_id;

  for v_item in select * from jsonb_array_elements(items) loop
    insert into public.sale_items (sale_id, product_id, quantity, unit_price)
    values (v_sale_id, (v_item ->> 'product_id')::uuid,
            (v_item ->> 'quantity')::int, (v_item ->> 'unit_price')::numeric);

    insert into public.stock_movements (product_id, location_id, delta, reason,
                                        reference_type, reference_id, created_by)
    values ((v_item ->> 'product_id')::uuid, public.default_location_id(),
            -((v_item ->> 'quantity')::int), 'sale', 'sale', v_sale_id, auth.uid());

    v_total := v_total + (v_item ->> 'quantity')::int * (v_item ->> 'unit_price')::numeric;
  end loop;

  update public.sales set total = v_total where id = v_sale_id;
  return v_sale_id;
end;
$$;

-- ── RPC: receive_purchase_order(po uuid) ────────────────────────────
create or replace function public.receive_purchase_order(po uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_item record;
begin
  if public.current_user_role() not in ('admin', 'manager') then
    raise exception 'Not authorized';
  end if;
  if (select status from public.purchase_orders where id = po) <> 'ordered' then
    raise exception 'Only ordered POs can be received';
  end if;

  for v_item in select product_id, quantity from public.purchase_order_items where po_id = po loop
    insert into public.stock_movements (product_id, location_id, delta, reason,
                                        reference_type, reference_id, created_by)
    values (v_item.product_id, public.default_location_id(), v_item.quantity,
            'purchase', 'purchase_order', po, auth.uid());
  end loop;

  update public.purchase_orders
  set status = 'received', received_at = now() where id = po;
end;
$$;

-- ── RPC: adjust_stock(product uuid, qty_delta int, why text) ────────
create or replace function public.adjust_stock(product uuid, qty_delta int, why text default null)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if public.current_user_role() not in ('admin', 'manager') then
    raise exception 'Not authorized';
  end if;
  insert into public.stock_movements (product_id, location_id, delta, reason, note, created_by)
  values (product, public.default_location_id(), qty_delta, 'adjustment', why, auth.uid());
end;
$$;
