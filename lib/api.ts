import { supabase } from "./supabase";
import type {
  Category,
  InventoryRow,
  InventoryValue,
  Location,
  LowStockAlert,
  Product,
  Profile,
  PurchaseOrder,
  Sale,
  SalesDaily,
  StockMovement,
  Supplier,
} from "./types";

function unwrap<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

// ── Products ──────────────────────────────────────────────────────────
export const listProducts = async (search = ""): Promise<Product[]> => {
  let q = supabase
    .from("products")
    .select("*, categories(*), suppliers(*)")
    .eq("archived", false)
    .order("name");
  if (search) q = q.or(`name.ilike.%${search}%,sku.ilike.%${search}%`);
  return unwrap(await q);
};

export const getProduct = async (id: string): Promise<Product> =>
  unwrap(await supabase.from("products").select("*, categories(*), suppliers(*)").eq("id", id).single());

export const upsertProduct = async (p: Partial<Product> & { sku: string; name: string }) =>
  unwrap(await supabase.from("products").upsert(p).select().single());

export const archiveProduct = async (id: string) =>
  unwrap(await supabase.from("products").update({ archived: true }).eq("id", id).select().single());

export const listCategories = async (): Promise<Category[]> =>
  unwrap(await supabase.from("categories").select("*").order("name"));

// ── Stock ─────────────────────────────────────────────────────────────
export const getStockLevels = async (): Promise<Record<string, number>> => {
  const rows = unwrap(await supabase.from("inventory").select("product_id, quantity"));
  const map: Record<string, number> = {};
  for (const r of rows as { product_id: string; quantity: number }[]) {
    map[r.product_id] = (map[r.product_id] ?? 0) + r.quantity;
  }
  return map;
};

export const getLowStockAlerts = async (): Promise<LowStockAlert[]> =>
  unwrap(await supabase.from("low_stock_alerts").select("*"));

export const getMovements = async (productId: string): Promise<StockMovement[]> =>
  unwrap(
    await supabase
      .from("stock_movements")
      .select("*")
      .eq("product_id", productId)
      .order("created_at", { ascending: false })
      .limit(50)
  );

export const adjustStock = async (productId: string, delta: number, note?: string) =>
  unwrap(await supabase.rpc("adjust_stock", { product: productId, qty_delta: delta, why: note ?? null }));

export const getStockByLocation = async (): Promise<InventoryRow[]> =>
  unwrap(await supabase.from("inventory").select("*"));

// ── Locations ─────────────────────────────────────────────────────────
export const listLocations = async (): Promise<Location[]> =>
  unwrap(await supabase.from("locations").select("*").order("name"));

export const upsertLocation = async (l: Partial<Location> & { name: string }) =>
  unwrap(await supabase.from("locations").upsert(l).select().single());

export const transferStock = async (
  productId: string,
  fromLocationId: string,
  toLocationId: string,
  qty: number,
  note?: string
) =>
  unwrap(
    await supabase.rpc("transfer_stock", {
      product: productId,
      from_location: fromLocationId,
      to_location: toLocationId,
      qty,
      why: note ?? null,
    })
  );

// ── Suppliers ─────────────────────────────────────────────────────────
export const listSuppliers = async (): Promise<Supplier[]> =>
  unwrap(await supabase.from("suppliers").select("*").order("name"));

export const upsertSupplier = async (s: Partial<Supplier> & { name: string }) =>
  unwrap(await supabase.from("suppliers").upsert(s).select().single());

// ── Purchase orders ───────────────────────────────────────────────────
export const listPurchaseOrders = async (): Promise<PurchaseOrder[]> =>
  unwrap(
    await supabase
      .from("purchase_orders")
      .select("*, suppliers(*), purchase_order_items(*, products(id, sku, name))")
      .order("created_at", { ascending: false })
  );

export const getPurchaseOrder = async (id: string): Promise<PurchaseOrder> =>
  unwrap(
    await supabase
      .from("purchase_orders")
      .select("*, suppliers(*), purchase_order_items(*, products(id, sku, name))")
      .eq("id", id)
      .single()
  );

export const createPurchaseOrder = async (
  supplierId: string,
  items: { product_id: string; quantity: number; unit_cost: number }[],
  notes?: string
): Promise<PurchaseOrder> => {
  const po = unwrap(
    await supabase
      .from("purchase_orders")
      .insert({ supplier_id: supplierId, status: "ordered", notes: notes ?? null })
      .select()
      .single()
  ) as PurchaseOrder;
  unwrap(
    await supabase
      .from("purchase_order_items")
      .insert(items.map((i) => ({ ...i, po_id: po.id })))
      .select()
  );
  return po;
};

export const receivePurchaseOrder = async (poId: string) =>
  unwrap(await supabase.rpc("receive_purchase_order", { po: poId }));

export const cancelPurchaseOrder = async (poId: string) =>
  unwrap(await supabase.from("purchase_orders").update({ status: "cancelled" }).eq("id", poId).select().single());

// ── Sales ─────────────────────────────────────────────────────────────
export const listSales = async (): Promise<Sale[]> =>
  unwrap(
    await supabase
      .from("sales")
      .select("*, sale_items(*, products(id, sku, name))")
      .order("created_at", { ascending: false })
      .limit(100)
  );

export const recordSale = async (
  items: { product_id: string; quantity: number; unit_price: number }[],
  customer?: string
): Promise<string> =>
  unwrap(await supabase.rpc("record_sale", { items, customer: customer ?? null }));

// ── Reports ───────────────────────────────────────────────────────────
export const getSalesDaily = async (): Promise<SalesDaily[]> =>
  unwrap(await supabase.from("sales_daily").select("*").limit(30));

export const getInventoryValue = async (): Promise<InventoryValue[]> =>
  unwrap(await supabase.from("inventory_value").select("*").order("stock_value_cost", { ascending: false }));

// ── Users ─────────────────────────────────────────────────────────────
export const listProfiles = async (): Promise<Profile[]> =>
  unwrap(await supabase.from("profiles").select("*").order("created_at"));

export const updateProfile = async (id: string, patch: Partial<Profile>) =>
  unwrap(await supabase.from("profiles").update(patch).eq("id", id).select().single());
