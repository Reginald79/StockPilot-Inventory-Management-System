-- seed.sql — starter data (run after migrations)
insert into public.locations (name, is_default) values ('Main Warehouse', true);
insert into public.locations (name, is_default) values ('Downtown Retail Store', false);

insert into public.categories (name) values ('Beverages'), ('Snacks'), ('Household');

insert into public.suppliers (name, contact_name, email, phone) values
  ('Accra Wholesale Ltd', 'K. Mensah', 'sales@accrawholesale.example', '+233 20 000 0000'),
  ('Global Foods Co', 'A. Owusu', 'orders@globalfoods.example', '+233 24 111 1111');

insert into public.products (sku, name, category_id, supplier_id, cost_price, sell_price, reorder_point, unit)
select 'BEV-001', 'Bottled Water 500ml (24-pack)', c.id, s.id, 18.00, 26.00, 10, 'pack'
from public.categories c, public.suppliers s
where c.name = 'Beverages' and s.name = 'Accra Wholesale Ltd';

insert into public.products (sku, name, category_id, supplier_id, cost_price, sell_price, reorder_point, unit)
select 'SNK-001', 'Plantain Chips 100g', c.id, s.id, 4.50, 8.00, 25, 'pcs'
from public.categories c, public.suppliers s
where c.name = 'Snacks' and s.name = 'Global Foods Co';

-- Opening stock (ledger-driven; trigger populates inventory)
insert into public.stock_movements (product_id, location_id, delta, reason, note)
select p.id, public.default_location_id(), 40, 'initial', 'Opening stock'
from public.products p;

-- ⚠ Promote your first admin after signing up in the app:
-- update public.profiles set role = 'admin' where id = (select id from auth.users where email = 'you@example.com');
