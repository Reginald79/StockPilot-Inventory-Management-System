# StockPilot — Inventory Management System, v1 Design

## 1. Overview

A scalable inventory management system delivered as a single Expo (React Native) universal codebase that runs on **web (deployed to Vercel)**, **iOS**, and **Android**. Backend is **Supabase** (Postgres + Auth + Row Level Security). All business rules that must be trustworthy (stock math, role checks) live in the database, not the client.

## 2. Stack

| Layer | Choice | Notes |
|---|---|---|
| App framework | Expo SDK 52+, Expo Router v4 | File-based routing, universal web/iOS/Android |
| Language | TypeScript (strict) | |
| Styling | NativeWind v4 (Tailwind for RN) | shadcn-style component patterns in `components/ui` |
| Data | @supabase/supabase-js v2 + TanStack Query v5 | Query caching, optimistic updates |
| Auth | Supabase Auth (email/password; magic link ready) | Session persisted via AsyncStorage (native) / localStorage (web) |
| Web deploy | `expo export -p web` → Vercel static output | SPA output mode |
| DB | Supabase Postgres, migrations in `supabase/migrations` | Apply via Supabase CLI or SQL editor |

## 3. Roles & permissions

Three roles stored in `profiles.role`, enforced twice: in Postgres RLS (authoritative) and in the client (`lib/permissions.ts`, for UI gating only).

| Capability | admin | manager | staff |
|---|---|---|---|
| Manage users/roles | ✅ | — | — |
| Products & suppliers CRUD | ✅ | ✅ | read |
| Purchase orders create/receive | ✅ | ✅ | — |
| Record sales | ✅ | ✅ | ✅ |
| Stock adjustments (add / count / transfer) | ✅ | ✅ | — |
| Manage locations | ✅ | — | — |
| Reports | ✅ | ✅ | own-sales only |

## 4. Data model (ERD)

```
profiles (id → auth.users, full_name, role, active)
categories (id, name)
suppliers (id, name, contact_name, email, phone, notes)
locations (id, name, is_default)                     -- multi-warehouse ready
products (id, sku UNIQUE, name, category_id, supplier_id,
          cost_price, sell_price, reorder_point, unit, barcode, archived)
inventory (product_id, location_id, quantity)         -- PK (product_id, location_id)
stock_movements (id, product_id, location_id, delta, reason, -- ledger, append-only
                 reference_type, reference_id, created_by, created_at)
purchase_orders (id, po_number, supplier_id, status: draft|ordered|received|cancelled,
                 expected_at, received_at, created_by)
purchase_order_items (id, po_id, product_id, quantity, unit_cost)
sales (id, sale_number, total, customer_name, created_by, created_at)
sale_items (id, sale_id, product_id, quantity, unit_price)
```

Key invariants (enforced in Postgres):

1. **`inventory.quantity` is never written by the client.** It is maintained by a trigger on `stock_movements`. Every change to stock is a ledger row — auditable and race-safe.
2. Recording a sale inserts `sale_items`; a trigger writes negative `stock_movements` (reason `sale`).
3. Marking a PO `received` triggers positive `stock_movements` (reason `purchase`) for each item.
4. Manual corrections use reason `adjustment` via RPC `adjust_stock()` (manager+ only). The Stock tab's **Add stock** (batch receiving) and **Cycle count** (physical count → auto-computed delta) screens are both thin UIs over this same RPC.
5. **Low-stock alerts** are the view `low_stock_alerts` (`inventory.quantity <= products.reorder_point`), surfaced on the dashboard — no cron needed for v1. Each alert has a **Reorder** shortcut straight into a prefilled purchase order (supplier + product), mirroring the replenishment flow in NetSuite/Cin7.
6. **Stock transfers** between locations use reason `transfer` via RPC `transfer_stock()` (manager+ only) — two paired ledger rows (out/in) sharing a `reference_id`. This activates the multi-warehouse support the schema already had (`locations` table) but the v1 UI didn't expose.

## 5. RLS strategy

- Every table has RLS enabled; no anon access.
- Helper `public.current_user_role()` (SECURITY DEFINER) reads the caller's role once.
- Reads: any active authenticated user. Writes: gated per the role matrix.
- `stock_movements` INSERT allowed only via SECURITY DEFINER functions (`record_sale`, `receive_purchase_order`, `adjust_stock`) — direct writes denied.
- New signups get role `staff` via `handle_new_user()` trigger; only admins can change roles (first admin promoted manually in SQL editor, see README).

## 6. App structure

```
app/
  _layout.tsx            providers (Query, Auth), route guard
  (auth)/sign-in.tsx     sign in / sign up
  (tabs)/                Dashboard | Products | Stock | Orders | Sales | More
  product/[id].tsx       detail + edit; product/new.tsx
  order/[id].tsx         PO detail + receive; order/new.tsx (accepts ?productId= for reorder prefill)
  sale/new.tsx           point-of-sale style entry
  stock/add.tsx          batch stock receiving
  stock/transfer.tsx     move stock between locations
  stock/count.tsx        cycle count (physical count → auto-adjustment)
  suppliers.tsx, locations.tsx, reports.tsx, users.tsx
components/ui/           Button, Input, Card, Badge, Select, Screen, EmptyState
lib/                     supabase.ts, auth.tsx, permissions.ts, types.ts, api/*.ts
supabase/migrations/     0001_schema, 0002_functions_triggers, 0003_rls; seed.sql
```

## 7. Scalability notes

- Ledger-based stock + `FOR UPDATE`-free design (triggers run in-transaction) avoids lost updates under concurrency.
- `locations` table makes multi-warehouse a data change, not a schema change; `transfer_stock()` now surfaces it in the UI.
- Pagination via keyset (`created_at, id`) on lists; indexes on all FKs, `products.sku`, `stock_movements(product_id, created_at)`.
- Reports read from SQL views (`sales_daily`, `inventory_value`) so heavy aggregation stays in Postgres; can later be materialized.
- v2 candidates: barcode scanning (expo-camera), realtime stock via Supabase Realtime, CSV import/export, per-location reorder points, multi-org tenancy (add `org_id` + RLS by membership).
