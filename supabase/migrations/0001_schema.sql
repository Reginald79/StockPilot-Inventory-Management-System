-- 0001_schema.sql — core tables & indexes
create extension if not exists "pgcrypto";

-- ── Roles / profiles ────────────────────────────────────────────────
create type user_role as enum ('admin', 'manager', 'staff');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  role user_role not null default 'staff',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ── Reference data ──────────────────────────────────────────────────
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_name text,
  email text,
  phone text,
  notes text,
  created_at timestamptz not null default now()
);

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_default boolean not null default false
);

-- ── Products ────────────────────────────────────────────────────────
create table public.products (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique,
  name text not null,
  category_id uuid references public.categories (id) on delete set null,
  supplier_id uuid references public.suppliers (id) on delete set null,
  cost_price numeric(12,2) not null default 0 check (cost_price >= 0),
  sell_price numeric(12,2) not null default 0 check (sell_price >= 0),
  reorder_point integer not null default 0 check (reorder_point >= 0),
  unit text not null default 'pcs',
  barcode text,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);
create index idx_products_category on public.products (category_id);
create index idx_products_supplier on public.products (supplier_id);

-- ── Stock ───────────────────────────────────────────────────────────
create table public.inventory (
  product_id uuid not null references public.products (id) on delete cascade,
  location_id uuid not null references public.locations (id) on delete cascade,
  quantity integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (product_id, location_id)
);

create type movement_reason as enum ('purchase', 'sale', 'adjustment', 'transfer', 'initial');

create table public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  location_id uuid not null references public.locations (id),
  delta integer not null check (delta <> 0),
  reason movement_reason not null,
  reference_type text,          -- 'purchase_order' | 'sale' | null
  reference_id uuid,
  note text,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);
create index idx_movements_product on public.stock_movements (product_id, created_at desc);

-- ── Purchasing ──────────────────────────────────────────────────────
create type po_status as enum ('draft', 'ordered', 'received', 'cancelled');

create table public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  po_number text not null unique default ('PO-' || to_char(now(), 'YYMMDD') || '-' || substr(gen_random_uuid()::text, 1, 4)),
  supplier_id uuid not null references public.suppliers (id),
  status po_status not null default 'draft',
  expected_at date,
  received_at timestamptz,
  notes text,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);
create index idx_po_supplier on public.purchase_orders (supplier_id);
create index idx_po_status on public.purchase_orders (status);

create table public.purchase_order_items (
  id uuid primary key default gen_random_uuid(),
  po_id uuid not null references public.purchase_orders (id) on delete cascade,
  product_id uuid not null references public.products (id),
  quantity integer not null check (quantity > 0),
  unit_cost numeric(12,2) not null check (unit_cost >= 0),
  unique (po_id, product_id)
);

-- ── Sales ───────────────────────────────────────────────────────────
create table public.sales (
  id uuid primary key default gen_random_uuid(),
  sale_number text not null unique default ('S-' || to_char(now(), 'YYMMDD') || '-' || substr(gen_random_uuid()::text, 1, 4)),
  total numeric(12,2) not null default 0,
  customer_name text,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);
create index idx_sales_created on public.sales (created_at desc);

create table public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales (id) on delete cascade,
  product_id uuid not null references public.products (id),
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0)
);
create index idx_sale_items_product on public.sale_items (product_id);

-- ── Views ───────────────────────────────────────────────────────────
create view public.low_stock_alerts as
select p.id as product_id, p.sku, p.name, p.reorder_point, i.location_id,
       l.name as location_name, i.quantity
from public.inventory i
join public.products p on p.id = i.product_id and not p.archived
join public.locations l on l.id = i.location_id
where i.quantity <= p.reorder_point;

create view public.inventory_value as
select p.id as product_id, p.sku, p.name,
       coalesce(sum(i.quantity), 0) as total_quantity,
       coalesce(sum(i.quantity), 0) * p.cost_price as stock_value_cost,
       coalesce(sum(i.quantity), 0) * p.sell_price as stock_value_retail
from public.products p
left join public.inventory i on i.product_id = p.id
where not p.archived
group by p.id;

create view public.sales_daily as
select date_trunc('day', s.created_at)::date as day,
       count(distinct s.id) as num_sales,
       sum(si.quantity * si.unit_price) as revenue
from public.sales s
join public.sale_items si on si.sale_id = s.id
group by 1 order by 1 desc;
