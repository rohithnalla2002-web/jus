import { formatCurrency } from "@/lib/demo";

type RevenueRow = {
  month: string;
  income: number;
  expense: number;
  profit: number;
};

type LedgerRow = {
  date: string;
  voucherNo: string;
  account: string;
  debit: number;
  credit: number;
  note: string;
};

type GstRow = {
  type: string;
  rate: string;
  taxableValue: number;
  cgst: number;
  sgst: number;
  totalTax: number;
};

type ReportTab = "revenue" | "ledger" | "gst";

const escapeHtml = (value: unknown) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const tableStyles = `
  table{width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-left:0;border-right:0}
  th,td{padding:11px 10px;border-bottom:1px solid #e5e7eb;font-size:13px;vertical-align:top}
  th{text-transform:uppercase;letter-spacing:.08em;color:#6b7280;font-size:11px;text-align:left}
  td.num{text-align:right;white-space:nowrap}
`;

export const downloadAccountingReportHtml = (args: {
  tab: ReportTab;
  title: string;
  subtitle: string;
  filtersLabel: string;
  revenueRows: RevenueRow[];
  ledgerRows: LedgerRow[];
  gstRows: GstRow[];
}) => {
  const { tab, title, subtitle, filtersLabel, revenueRows, ledgerRows, gstRows } = args;
  const generatedAt = new Date().toLocaleString("en-IN");

  const sectionHtml =
    tab === "revenue"
      ? `
      <h2>Revenue Analysis</h2>
      <table>
        <thead>
          <tr><th>Month</th><th>Income</th><th>Expense</th><th>Profit</th><th>Margin</th></tr>
        </thead>
        <tbody>
          ${revenueRows
            .map((r) => {
              const margin = r.income > 0 ? `${((r.profit / r.income) * 100).toFixed(1)}%` : "0%";
              return `<tr>
                <td>${escapeHtml(r.month)}</td>
                <td class="num">${escapeHtml(formatCurrency(r.income))}</td>
                <td class="num">${escapeHtml(formatCurrency(r.expense))}</td>
                <td class="num">${escapeHtml(formatCurrency(r.profit))}</td>
                <td class="num">${escapeHtml(margin)}</td>
              </tr>`;
            })
            .join("")}
        </tbody>
      </table>
    `
      : tab === "ledger"
        ? `
      <h2>General Ledger</h2>
      <table>
        <thead>
          <tr><th>Date</th><th>Voucher No</th><th>Account</th><th>Debit</th><th>Credit</th><th>Narration</th></tr>
        </thead>
        <tbody>
          ${ledgerRows
            .map(
              (r) => `<tr>
            <td>${escapeHtml(r.date)}</td>
            <td>${escapeHtml(r.voucherNo)}</td>
            <td>${escapeHtml(r.account)}</td>
            <td class="num">${escapeHtml(formatCurrency(r.debit))}</td>
            <td class="num">${escapeHtml(formatCurrency(r.credit))}</td>
            <td>${escapeHtml(r.note)}</td>
          </tr>`,
            )
            .join("")}
        </tbody>
      </table>
    `
        : `
      <h2>GST Details</h2>
      <table>
        <thead>
          <tr><th>Type</th><th>Rate</th><th>Taxable Value</th><th>CGST</th><th>SGST</th><th>Total GST</th></tr>
        </thead>
        <tbody>
          ${gstRows
            .map(
              (r) => `<tr>
            <td>${escapeHtml(r.type)}</td>
            <td>${escapeHtml(r.rate)}</td>
            <td class="num">${escapeHtml(formatCurrency(r.taxableValue))}</td>
            <td class="num">${escapeHtml(formatCurrency(r.cgst))}</td>
            <td class="num">${escapeHtml(formatCurrency(r.sgst))}</td>
            <td class="num">${escapeHtml(formatCurrency(r.totalTax))}</td>
          </tr>`,
            )
            .join("")}
        </tbody>
      </table>
    `;

  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <style>
      *{box-sizing:border-box}
      body{margin:0;background:#fff;color:#111827;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial}
      .page{width:920px;margin:20px auto;padding:26px 30px}
      .head{display:flex;justify-content:space-between;gap:20px;align-items:flex-start}
      .brand{font-size:26px;font-weight:900;letter-spacing:.03em;color:#b8860b}
      .subtitle{margin-top:6px;color:#6b7280;font-size:13px}
      .meta{font-size:12px;color:#6b7280;text-align:right}
      .line{height:2px;background:linear-gradient(90deg,#b8860b,#eab308,#b8860b);margin:14px 0 20px}
      h2{margin:0 0 12px;font-size:17px}
      ${tableStyles}
      .foot{margin-top:16px;font-size:11px;color:#6b7280}
      @media print {.page{width:100%;margin:0;padding:0}}
    </style>
  </head>
  <body>
    <div class="page">
      <div class="head">
        <div>
          <div class="brand">JewelCraft Finance</div>
          <div class="subtitle">${escapeHtml(subtitle)} | Filters: ${escapeHtml(filtersLabel)}</div>
        </div>
        <div class="meta">
          <div>Generated: ${escapeHtml(generatedAt)}</div>
          <div>Prepared by: Accounts Department</div>
        </div>
      </div>
      <div class="line"></div>
      ${sectionHtml}
      <div class="foot">This is a system-generated financial report for internal review and tax filing support.</div>
    </div>
  </body>
</html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${title.toLowerCase().replace(/\s+/g, "-")}.html`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
};
