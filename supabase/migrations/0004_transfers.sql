-- 0004_transfers.sql — stock transfers between locations (multi-warehouse)

-- ── RPC: transfer_stock(product, from_location, to_location, qty, why) ──
-- Moves stock between two locations as a paired ledger entry (reason
-- 'transfer'), linked by a shared reference_id so the two legs can be
-- traced back to the same movement. Reuses the existing insufficient-stock
-- guard on stock_movements (apply_stock_movement trigger).
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
  if public.current_user_role() not in ('admin', 'manager') then
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
