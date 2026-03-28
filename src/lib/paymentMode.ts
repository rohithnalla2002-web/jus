/** Saved on orders and shown on receipts / order details. */
export const ORDER_PAYMENT_MODES = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Debit / credit card" },
  { value: "upi", label: "UPI" },
  { value: "bank", label: "Bank transfer / NEFT" },
  { value: "credit_note", label: "Store credit / advance" },
] as const;

export type OrderPaymentModeValue = (typeof ORDER_PAYMENT_MODES)[number]["value"];

export function labelForPaymentMode(value: string | undefined | null): string {
  const v = String(value ?? "cash").trim().toLowerCase();
  const hit = ORDER_PAYMENT_MODES.find((o) => o.value === v);
  return hit?.label ?? (value?.trim() || "Cash");
}

export const DEFAULT_PAYMENT_MODE: OrderPaymentModeValue = "cash";
