export function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  })
    .format(value)
    .replace(/\u00a0/g, " ");
}

export function parseCurrency(value) {
  return Number(String(value).replace(/[^\d.]/g, "")) || 0;
}
