export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  })
    .format(value)
    .replace(/\u00a0/g, " ");

export const parseCurrency = (value: string) => Number(value.replace(/[^\d.]/g, "")) || 0;

/** Compact lakhs label for badges (e.g. ₹4.26L). Uses ₹ (U+20B9). */
export function formatLakhsShort(rupees: number): string {
  if (!Number.isFinite(rupees) || rupees < 0) return "—";
  return `₹${(rupees / 100_000).toFixed(2)}L`;
}

export const formatShortDate = (value: Date | string = new Date()) => {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
};

export const downloadTextFile = (
  filename: string,
  content: string,
  mimeType = "text/plain;charset=utf-8",
) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 0);
};