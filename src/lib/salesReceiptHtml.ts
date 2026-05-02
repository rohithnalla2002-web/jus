import { formatCurrency, parseCurrency } from "@/lib/demo";
import {
  COMPANY_ADDRESS_FULL,
  COMPANY_CIN,
  COMPANY_LEGAL_NAME,
  COMPANY_PHONE_DISPLAY,
  GOLDMIND_AI_LOGO_SRC,
  GOLDMIND_APP_NAME,
  SALES_RECEIPT_SUBTITLE,
} from "@/lib/company";

export type ReceiptCustomer = {
  name: string;
  phone: string;
  email: string;
  address: string;
};

export type ReceiptLine = {
  productIdLabel: string;
  name: string;
  category: string;
  purity: string;
  weight: string;
  size: string;
  storageBox: string;
  hallmark: boolean;
  hallmarkNumber: string;
  qty: number;
  unitPrice: string;
  lineTotal: string;
};

const escapeHtml = (value: unknown) => {
  const s = String(value ?? "");
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
};

export function buildSalesReceiptHtml(args: {
  orderId: string;
  date: string;
  customer: ReceiptCustomer;
  lines: ReceiptLine[];
  grandTotal: string;
  subtitle?: string;
  paymentModeLabel?: string;
  /** When set, receipt shows subtotal, optional old-gold credit, then amount due as grandTotal. */
  totalsBreakdown?: {
    lineSubtotal: string;
    exchangeCredit: string | null;
    amountDue: string;
  };
}) {
  const {
    orderId,
    date,
    customer,
    lines,
    grandTotal,
    subtitle = SALES_RECEIPT_SUBTITLE,
    paymentModeLabel = "—",
    totalsBreakdown,
  } = args;
  const formattedDate = date
    ? new Intl.DateTimeFormat("en-IN", { year: "numeric", month: "short", day: "numeric" }).format(new Date(`${date}T12:00:00`))
    : "—";

  const rows = lines
    .map(
      (l) => `
      <tr>
        <td>
          <div class="pname">${escapeHtml(l.name)}</div>
          <div class="pid">${escapeHtml(l.productIdLabel)}</div>
        </td>
        <td>${escapeHtml(l.category)}</td>
        <td>${escapeHtml(l.purity)}</td>
        <td>${escapeHtml(l.weight)}</td>
        <td>${escapeHtml(l.size)}</td>
        <td>${escapeHtml(l.storageBox)}</td>
        <td>${l.hallmark ? escapeHtml(`Yes · ${l.hallmarkNumber || "—"}`) : "No"}</td>
        <td class="num">${l.qty}</td>
        <td class="num">${escapeHtml(l.unitPrice)}</td>
        <td class="num strong">${escapeHtml(l.lineTotal)}</td>
      </tr>`,
    )
    .join("");

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Receipt ${escapeHtml(orderId)}</title>
  <style>
    :root { --border:#e5e7eb; --muted:#6b7280; --gold:#5b21b6; }
    body { margin:0; font-family: system-ui, sans-serif; color:#111827; background:#fff; }
    .page { max-width: 920px; margin: 20px auto; padding: 24px; }
    h1 { font-size: 22px; margin: 0 0 4px; }
    .sub { color: var(--muted); font-size: 13px; margin-bottom: 20px; }
    .bar { height: 3px; background: linear-gradient(90deg, var(--gold), #a855f7, var(--gold)); margin: 16px 0 20px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
    .box { border: 1px solid var(--border); border-radius: 10px; padding: 14px 16px; }
    .box h3 { margin: 0 0 10px; font-size: 11px; letter-spacing: .12em; text-transform: uppercase; color: var(--muted); }
    .row { margin: 6px 0; font-size: 14px; }
    .lbl { color: var(--muted); display: inline-block; width: 88px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { border-bottom: 1px solid var(--border); padding: 10px 8px; text-align: left; vertical-align: top; }
    th { font-size: 10px; text-transform: uppercase; letter-spacing: .08em; color: var(--muted); }
    .num { text-align: right; white-space: nowrap; }
    .strong { font-weight: 700; }
    .pname { font-weight: 600; }
    .pid { font-size: 11px; color: var(--muted); font-family: ui-monospace, monospace; margin-top: 2px; }
    .grand { margin-top: 20px; text-align: right; font-size: 18px; font-weight: 800; }
    .foot { margin-top: 28px; font-size: 12px; color: var(--muted); text-align: center; }
  </style>
</head>
<body>
  <div class="page">
    <h1>${escapeHtml(subtitle)}</h1>
    <div class="sub">Order <strong>${escapeHtml(orderId)}</strong> · ${escapeHtml(formattedDate)} · Payment: <strong>${escapeHtml(paymentModeLabel)}</strong></div>
    <div class="bar"></div>
    <div class="grid">
      <div class="box">
        <h3>Customer</h3>
        <div class="row"><span class="lbl">Name</span> ${escapeHtml(customer.name)}</div>
        <div class="row"><span class="lbl">Mobile</span> ${escapeHtml(customer.phone)}</div>
        <div class="row"><span class="lbl">Email</span> ${escapeHtml(customer.email || "—")}</div>
        <div class="row"><span class="lbl">Address</span> ${escapeHtml(customer.address || "—")}</div>
      </div>
      <div class="box">
        <h3>Store</h3>
        <div class="row" style="display:flex;align-items:center;gap:10px;">
          <img src="${GOLDMIND_AI_LOGO_SRC}" alt="" width="44" height="44" style="border-radius:8px;object-fit:contain;border:1px solid rgba(167,139,250,0.25);flex-shrink:0;" />
          <span style="font-weight:700">${escapeHtml(GOLDMIND_APP_NAME)}</span>
        </div>
        <div class="row" style="color:var(--muted);font-size:13px;">${escapeHtml(COMPANY_LEGAL_NAME)}</div>
        <div class="row" style="color:var(--muted);font-size:12px;">CIN ${escapeHtml(COMPANY_CIN)}</div>
        <div class="row" style="color:var(--muted);font-size:12px;">${escapeHtml(COMPANY_ADDRESS_FULL)}</div>
        <div class="row" style="color:var(--muted);font-size:12px;">${escapeHtml(COMPANY_PHONE_DISPLAY)}</div>
        <div class="row" style="color:var(--muted);font-size:13px;margin-top:8px;">Thank you for your purchase.</div>
      </div>
    </div>
    <h3 style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);margin:0 0 10px;">Line items</h3>
    <table>
      <thead>
        <tr>
          <th>Item</th><th>Category</th><th>Purity</th><th>Weight</th><th>Size</th><th>Box</th><th>Hallmark</th><th>Qty</th><th>Unit</th><th>Line total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    ${
      totalsBreakdown
        ? `
    <div class="receipt-totals">
      <div class="receipt-total-line"><span>Items subtotal</span><span>${escapeHtml(totalsBreakdown.lineSubtotal)}</span></div>
      ${totalsBreakdown.exchangeCredit ? `<div class="receipt-total-line credit"><span>Old gold exchange credit</span><span>− ${escapeHtml(totalsBreakdown.exchangeCredit)}</span></div>` : ""}
      <div class="receipt-total-due"><span>Amount due</span><span>${escapeHtml(totalsBreakdown.amountDue)}</span></div>
    </div>
    <style>
      .receipt-totals { margin-top: 20px; text-align: right; max-width: 360px; margin-left: auto; font-size: 15px; }
      .receipt-total-line { display: flex; justify-content: space-between; gap: 16px; margin: 6px 0; color: #4b5563; }
      .receipt-total-line.credit { color: #059669; }
      .receipt-total-due { display: flex; justify-content: space-between; gap: 16px; margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border); font-size: 18px; font-weight: 800; }
    </style>`
        : `<div class="grand">Grand total: ${escapeHtml(grandTotal)}</div>`
    }
    <div class="foot">Open this file in a browser and use Print → Save as PDF if needed.</div>
  </div>
</body>
</html>`;
}

export function downloadSalesReceiptHtml(args: Parameters<typeof buildSalesReceiptHtml>[0] & { filename: string }) {
  const { filename, ...rest } = args;
  const html = buildSalesReceiptHtml(rest);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".html") ? filename : `${filename}.html`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function receiptLineTotals(line: { unitPrice: string; qty: number }) {
  const unit = parseCurrency(line.unitPrice);
  const total = unit * Math.max(1, line.qty);
  return formatCurrency(total);
}
