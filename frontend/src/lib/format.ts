import type { OrderStatus } from "@/types/api";

/** 249900 -> "₹2,499" and 99950 -> "₹999.50" */
export const formatPrice = (cents: number): string => {
  const whole = cents % 100 === 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  }).format(cents / 100);
};

/** What the seller types ("2499" or 2499.5) -> the whole number the API wants (249900) */
export const rupeesToCents = (rupees: number | string): number => Math.round(Number(rupees) * 100);

/** For filling an edit form: 249900 -> "2499" */
export const centsToRupees = (cents: number): string => String(cents / 100);

export const formatDate = (iso: string | null | undefined, withTime = false): string => {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    ...(withTime ? { timeStyle: "short" } : {}),
  }).format(date);
};

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pending",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

/** The only move a seller may make from each status (the backend enforces it too) */
export const nextSellerStatus = (status: OrderStatus): "shipped" | "delivered" | null => {
  if (status === "pending") return "shipped";
  if (status === "shipped") return "delivered";
  return null;
};