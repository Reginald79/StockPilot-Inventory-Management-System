export type UserRole = "admin" | "manager" | "staff";
export type PoStatus = "draft" | "ordered" | "received" | "cancelled";
export type MovementReason = "purchase" | "sale" | "adjustment" | "transfer" | "initial";

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  active: boolean;
  created_at: string;
}

export interface Category { id: string; name: string }

export interface Location { id: string; name: string; is_default: boolean }

export interface Supplier {
  id: string;
  name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  created_at: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category_id: string | null;
  supplier_id: string | null;
  cost_price: number;
  sell_price: number;
  reorder_point: number;
  unit: string;
  barcode: string | null;
  archived: boolean;
  created_at: string;
  categories?: Category | null;
  suppliers?: Supplier | null;
}

export interface InventoryRow {
  product_id: string;
  location_id: string;
  quantity: number;
  updated_at: string;
}

export interface StockMovement {
  id: string;
  product_id: string;
  location_id: string;
  delta: number;
  reason: MovementReason;
  reference_type: string | null;
  reference_id: string | null;
  note: string | null;
  created_by: string | null;
  created_at: string;
}

export interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier_id: string;
  status: PoStatus;
  expected_at: string | null;
  received_at: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  suppliers?: Supplier | null;
  purchase_order_items?: PurchaseOrderItem[];
}

export interface PurchaseOrderItem {
  id: string;
  po_id: string;
  product_id: string;
  quantity: number;
  unit_cost: number;
  products?: Pick<Product, "id" | "sku" | "name"> | null;
}

export interface Sale {
  id: string;
  sale_number: string;
  total: number;
  customer_name: string | null;
  created_by: string | null;
  created_at: string;
  sale_items?: SaleItem[];
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  products?: Pick<Product, "id" | "sku" | "name"> | null;
}

export interface LowStockAlert {
  product_id: string;
  sku: string;
  name: string;
  reorder_point: number;
  location_id: string;
  location_name: string;
  quantity: number;
}

export interface SalesDaily { day: string; num_sales: number; revenue: number }

export interface InventoryValue {
  product_id: string;
  sku: string;
  name: string;
  total_quantity: number;
  stock_value_cost: number;
  stock_value_retail: number;
}
