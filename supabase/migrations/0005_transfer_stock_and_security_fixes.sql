-- 0005_transfer_stock_and_security_fixes.sql
--
-- Brings the live database in line with the app code (adds the
-- transfer_stock RPC introduced for multi-location transfers) and closes
-- two authorization gaps found during the audit:
--
--   1. adjust_stock / receive_purchase_order (and transfer_stock as
--      originally written) checked `current_user_role() not in (...)`.
--      For a caller with no role row (unauthenticated, or deactivated),
--      current_user_role() returns NULL, so `NULL not in (...)` is NULL —
--      and `if NULL then` is treated as false in PL/pgSQL, so the
--      exception never fires. Confirmed live: the public anon key could
--      call adjust_stock and reach the insert, authorization check never
--      raised. Fixed by adding an explicit `is null or` check, matching
--      the pattern already used correctly in record_sale.
--
--   2. low_stock_alerts / inventory_value / sales_daily are views without
--      `security_invoker`, so Postgres runs them as the view owner and
--      they bypass the RLS policies on their underlying tables. Confirmed
--      live: inventory_value returned real cost/retail stock values to an
--      unauthenticated anon-key request. Fixed by switching the views to
--      run with the caller's own permissions.

-- ── RPC: transfer_stock(product, from_location, to_location, qty, why) ──
create or replace function public.transfer_stock(
  product uuid,
  from_location uuid,
  to_location uuid,
  qty int,
  why text default null
)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_ref uuid := gen_random_uuid();
begin
  if public.current_user_role() is null or public.current_user_role() not in ('admin', 'manager') then
    raise exception 'Not authorized';
  end if;
  if qty <= 0 then
    raise exception 'Transfer quantity must be positive';
  end if;
  if from_location = to_location then
    raise exception 'Source and destination locations must be different';
  end if;

  insert into public.stock_movements
    (product_id, location_id, delta, reason, reference_type, reference_id, note, created_by)
  values
    (product, from_location, -qty, 'transfer', 'transfer', v_ref, why, auth.uid());

  insert into public.stock_movements
    (product_id, location_id, delta, reason, reference_type, reference_id, note, created_by)
  values
    (product, to_location, qty, 'transfer', 'transfer', v_ref, why, auth.uid());
end;
$$;

-- ── Fix: adjust_stock — authorization bypass on NULL role ────────────
create or replace function public.adjust_stock(product uuid, qty_delta int, why text default null)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if public.current_user_role() is null or public.current_user_role() not in ('admin', 'manager') then
    raise exception 'Not authorized';
  end if;
  insert into public.stock_movements (product_id, location_id, delta, reason, note, created_by)
  values (product, public.default_location_id(), qty_delta, 'adjustment', why, auth.uid());
end;
$$;

-- ── Fix: receive_purchase_order — authorization bypass on NULL role ──
create or replace function public.receive_purchase_order(po uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_item record;
begin
  if public.current_user_role() is null or public.current_user_role() not in ('admin', 'manager') then
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

-- ── Fix: reporting views bypassing RLS on underlying tables ──────────
alter view public.low_stock_alerts set (security_invoker = true);
alter view public.inventory_value set (security_invoker = true);
alter view public.sales_daily set (security_invoker = true);
