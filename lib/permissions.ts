import type { UserRole } from "./types";

// UI gating only — real enforcement is Postgres RLS.
export const can = {
  manageUsers: (r?: UserRole | null) => r === "admin",
  editProducts: (r?: UserRole | null) => r === "admin" || r === "manager",
  editSuppliers: (r?: UserRole | null) => r === "admin" || r === "manager",
  managePurchaseOrders: (r?: UserRole | null) => r === "admin" || r === "manager",
  adjustStock: (r?: UserRole | null) => r === "admin" || r === "manager",
  transferStock: (r?: UserRole | null) => r === "admin" || r === "manager",
  manageLocations: (r?: UserRole | null) => r === "admin",
  recordSales: (r?: UserRole | null) => !!r,
  viewAllReports: (r?: UserRole | null) => r === "admin" || r === "manager",
};
