import { formatCurrency, parseCurrency } from "@/lib/demo";

type CustomerLike = {
  name: string;
  phone: string;
  email: string;
  address?: string;
};

type InventoryLike = {
  name: string;
  category: string;
  weight?: string;
  purity?: string;
  hallmark?: boolean;
  hallmarkNumber?: string;
  size?: string;
  providerName?: string;
  storageBoxNumber?: string;
};

type OrderLike = {
  id: string;
  customer: string;
  items: string;
  total: string;
  date: string;
  status: string;
};

const gstRate = 0.03;

const escapeHtml = (value: unknown) => {
  const s = String(value ?? "");
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
};

const buildInvoiceLines = (orderItems: string, orderSubtotalRounded: number, inventory: InventoryLike[]) => {
  const itemNames = orderItems
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const count = Math.max(1, itemNames.length);
  const base = Math.floor(orderSubtotalRounded / count);
  const remainder = orderSubtotalRounded - base * count;

  return itemNames.map((name, idx) => {
    const lower = name.toLowerCase();
    const keyword = lower.split(/\s+/)[0];

    const matched = inventory.find((inv) => {
      const invLower = inv.name.toLowerCase();
      return invLower.includes(keyword) || lower.includes(inv.category.toLowerCase());
    });

    const lineAmount = idx < remainder ? base + 1 : base;

    return {
      name,
      amount: lineAmount,
      weight: matched?.weight ?? null,
      purity: matched?.purity ?? null,
      hallmark: Boolean(matched?.hallmark),
      hallmarkNumber: matched?.hallmarkNumber ?? null,
      size: matched?.size ?? null,
      providerName: matched?.providerName ?? null,
      storageBoxNumber: matched?.storageBoxNumber ?? null,
    };
  });
};

export const buildInvoiceHtml = (args: {
  order: OrderLike;
  customer: CustomerLike;
  inventory: InventoryLike[];
  goldRatePerGram?: string;
  paymentMethod?: string;
}) => {
  const { order, customer, inventory, goldRatePerGram = "₹7,245/g", paymentMethod = "Credit Card" } = args;

  const orderTotalValue = parseCurrency(order.total);
  const subtotalValue = orderTotalValue / (1 + gstRate);
  const subtotalRounded = Math.round(subtotalValue);
  const gstRounded = orderTotalValue - subtotalRounded;

  const invoiceLines = buildInvoiceLines(order.items, subtotalRounded, inventory);

  const invoiceDate = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "2-digit", day: "2-digit" }).format(
    new Date(`${order.date}T00:00:00`),
  );

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Invoice ${escapeHtml(order.id)}</title>
    <style>
      :root{
        --bg:#ffffff;
        --text:#111827;
        --muted:#6b7280;
        --border:#e5e7eb;
        --gold:#b8860b;
        --gold-2:#eab308;
      }
      *{ box-sizing:border-box; }
      body{
        margin:0;
        font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji","Segoe UI Emoji";
        background: var(--bg);
        color: var(--text);
      }
      .page{
        width: 860px;
        margin: 18px auto;
        padding: 24px 30px;
      }
      .header{
        display:flex;
        justify-content:space-between;
        gap:20px;
        margin-bottom:22px;
      }
      .titlebar{
        height:2px;
        background: linear-gradient(90deg, var(--gold) 0%, var(--gold-2) 50%, var(--gold) 100%);
        margin: 10px 0 18px;
      }
      .box-title{
        font-size:12px;
        letter-spacing: .14em;
        text-transform: uppercase;
        color: var(--muted);
        font-weight: 700;
        margin-bottom:10px;
      }
      .bill{
        width: 420px;
      }
      .orderinfo{
        width: 260px;
        text-align:left;
      }
      .row{
        display:flex;
        align-items:flex-start;
        gap:10px;
        margin: 8px 0;
      }
      .label{ color: var(--muted); font-size:14px; width: 94px; }
      .value{ font-size:16px; font-weight: 650; }
      .value.small{ font-size:14px; font-weight: 550; }
      .meta{
        margin-top: 6px;
        padding-top: 8px;
        border-top: 1px solid var(--border);
      }
      table{
        width:100%;
        border-collapse: collapse;
        border: 1px solid var(--border);
        border-left:0;
        border-right:0;
      }
      th, td{
        padding: 14px 10px;
        border-bottom: 1px solid var(--border);
        vertical-align: top;
      }
      th{
        font-size:12px;
        letter-spacing: .12em;
        text-transform: uppercase;
        color: var(--muted);
        font-weight: 800;
        text-align:left;
      }
      td.amount{
        text-align:right;
        font-weight: 700;
        white-space: nowrap;
      }
      td.weight{
        text-align:right;
        white-space: nowrap;
      }
      .desc{
        font-size:16px;
        font-weight: 750;
        margin-bottom: 4px;
      }
      .sub{
        color: var(--muted);
        font-size: 13px;
        line-height: 1.35;
      }
      .totals{
        display:flex;
        justify-content:flex-end;
        margin-top: 26px;
      }
      .totalsbox{
        width: 360px;
      }
      .trow{
        display:flex;
        justify-content:space-between;
        padding: 8px 0;
        border-bottom: 1px solid var(--border);
      }
      .trow:last-child{ border-bottom:0; }
      .tlabel{ color: var(--muted); font-size: 15px; }
      .tvalue{ font-size: 15px; font-weight: 650; }
      .grand{
        padding-top: 14px;
      }
      .grand .tlabel{ font-size: 16px; font-weight: 650; color: var(--muted); }
      .grand .tvalue{ font-size: 26px; font-weight: 900; color: var(--gold-2); }
      .footer{
        margin-top: 26px;
        color: var(--muted);
        font-size: 12px;
      }
      @media print{
        .page{ margin: 0; width: 100%; padding: 0; }
      }
    </style>
  </head>
  <body>
    <div class="page">
      <div class="header">
        <div class="bill">
          <div class="box-title">Bill To</div>
          <div class="row">
            <div class="value">${escapeHtml(customer.name)}</div>
          </div>
          <div class="row">
            <div class="label">Phone</div>
            <div class="value small">${escapeHtml(customer.phone)}</div>
          </div>
          <div class="row">
            <div class="label">Email</div>
            <div class="value small">${escapeHtml(customer.email)}</div>
          </div>
          ${
            customer.address
              ? `<div class="row">
                  <div class="label">Address</div>
                  <div class="value small">${escapeHtml(customer.address)}</div>
                </div>`
              : ""
          }
        </div>
        <div class="orderinfo">
          <div class="box-title">Order Info</div>
          <div class="row">
            <div class="label">Date</div>
            <div class="value small">${escapeHtml(invoiceDate)}</div>
          </div>
          <div class="row">
            <div class="label">Gold Rate</div>
            <div class="value small">${escapeHtml(goldRatePerGram)}</div>
          </div>
          <div class="row">
            <div class="label">Payment</div>
            <div class="value small">${escapeHtml(paymentMethod)}</div>
          </div>
          <div class="meta">
            <div class="row">
              <div class="label">Order</div>
              <div class="value small">${escapeHtml(order.id)}</div>
            </div>
          </div>
        </div>
      </div>
      <div class="titlebar"></div>

      <table>
        <thead>
          <tr>
            <th style="width: 48%;">Description</th>
            <th style="width: 18%; text-align:right;">Weight</th>
            <th style="width: 34%; text-align:right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${invoiceLines
            .map(
              (line) => `
            <tr>
              <td>
                <div class="desc">${escapeHtml(line.name)}</div>
                <div class="sub">
                  ${line.purity ? `<div>${escapeHtml(line.purity)} Gold</div>` : ""}
                  ${
                    line.hallmark
                      ? `<div>Hallmark Certified${
                          line.hallmarkNumber ? ` · No. ${escapeHtml(line.hallmarkNumber)}` : ""
                        }</div>`
                      : `<div>Not Hallmark Certified</div>`
                  }
                  ${
                    line.size ? `<div>Size: ${escapeHtml(line.size)}</div>` : ""
                  }
                  ${
                    line.providerName ? `<div>Provider: ${escapeHtml(line.providerName)}</div>` : ""
                  }
                  ${
                    line.storageBoxNumber ? `<div>Storage Box: ${escapeHtml(line.storageBoxNumber)}</div>` : ""
                  }
                </div>
              </td>
              <td class="weight">${escapeHtml(line.weight ?? "—")}</td>
              <td class="amount">${escapeHtml(formatCurrency(line.amount))}</td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>

      <div class="totals">
        <div class="totalsbox">
          <div class="trow">
            <div class="tlabel">Subtotal</div>
            <div class="tvalue">${escapeHtml(formatCurrency(subtotalRounded))}</div>
          </div>
          <div class="trow">
            <div class="tlabel">GST (3%)</div>
            <div class="tvalue">${escapeHtml(formatCurrency(gstRounded))}</div>
          </div>
          <div class="trow grand">
            <div class="tlabel">Total Amount</div>
            <div class="tvalue">${escapeHtml(formatCurrency(orderTotalValue))}</div>
          </div>
        </div>
      </div>

      <div class="footer">
        Generated from GoldMind ERP Admin Dashboard · Thanks for your business.
      </div>
    </div>
  </body>
</html>`;
};

export const downloadInvoiceHtml = (args: {
  filename: string;
  order: OrderLike;
  customer: CustomerLike;
  inventory: InventoryLike[];
  goldRatePerGram?: string;
  paymentMethod?: string;
}) => {
  const html = buildInvoiceHtml(args);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${args.filename}.html`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
};

export type KarigarJobReceiptLike = {
  id: number;
  title: string;
  karigar: string;
  material: string;
  deadline: string;
  priority: string;
  customerName: string;
  customerMobile: string;
  instructions: string;
  size: string;
  referenceImage: string;
  price: string;
};

function isTrustedReceiptImageSrc(url: string): boolean {
  const t = url.trim();
  if (!t) return false;
  if (/^data:image\/(png|jpeg|jpg|gif|webp|bmp);base64,/i.test(t)) return true;
  if (/^https?:\/\//i.test(t)) return true;
  return t.startsWith("/");
}

/** Same visual language as sales invoices: printable HTML receipt for a karigar job. */
export const buildKarigarJobReceiptHtml = (args: {
  job: KarigarJobReceiptLike;
  workflowStage: string;
  customerEmail?: string;
  customerAddress?: string;
}) => {
  const { job, workflowStage, customerEmail = "", customerAddress = "" } = args;
  const priceRupees = parseCurrency(String(job.price ?? ""));
  const priceLine = priceRupees > 0 ? formatCurrency(priceRupees) : "—";
  const ref = job.referenceImage.trim();
  const refBlock =
    ref && isTrustedReceiptImageSrc(ref)
      ? `<div class="box-title" style="margin-top:18px">Reference image</div>
         <div class="ref-wrap"><img class="ref-img" src="${ref.replace(/"/g, "&quot;")}" alt="Design reference" /></div>`
      : "";

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Karigar job #${escapeHtml(job.id)}</title>
    <style>
      :root{
        --bg:#ffffff;
        --text:#111827;
        --muted:#6b7280;
        --border:#e5e7eb;
        --gold:#b8860b;
        --gold-2:#eab308;
      }
      *{ box-sizing:border-box; }
      body{
        margin:0;
        font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
        background: var(--bg);
        color: var(--text);
      }
      .page{ width: 860px; margin: 18px auto; padding: 24px 30px; }
      .titlebar{
        height:2px;
        background: linear-gradient(90deg, var(--gold) 0%, var(--gold-2) 50%, var(--gold) 100%);
        margin: 10px 0 18px;
      }
      h1{ font-size: 22px; margin: 0 0 6px; font-weight: 800; }
      .sub{ color: var(--muted); font-size: 14px; margin-bottom: 20px; }
      .box-title{
        font-size:12px;
        letter-spacing: .14em;
        text-transform: uppercase;
        color: var(--muted);
        font-weight: 700;
        margin-bottom:10px;
      }
      .grid2{ display:grid; grid-template-columns: 1fr 1fr; gap: 24px; }
      @media (max-width: 720px){ .grid2{ grid-template-columns: 1fr; } }
      .row{ display:flex; gap:10px; margin: 8px 0; align-items:flex-start; }
      .label{ color: var(--muted); font-size:14px; min-width: 100px; }
      .value{ font-size:15px; font-weight: 650; }
      .price-big{ font-size: 22px; font-weight: 900; color: var(--gold-2); margin-top: 8px; }
      .instr{ margin-top: 14px; padding: 12px; background: #f9fafb; border: 1px solid var(--border); border-radius: 8px; white-space: pre-wrap; font-size: 14px; line-height: 1.45; }
      .ref-wrap{ margin-top: 8px; border: 1px solid var(--border); border-radius: 8px; padding: 10px; background: #fafafa; text-align: center; }
      .ref-img{ max-width: 100%; max-height: 420px; object-fit: contain; }
      .footer{ margin-top: 28px; color: var(--muted); font-size: 12px; }
      @media print{ .page{ margin:0; width:100%; padding:12px; } }
    </style>
  </head>
  <body>
    <div class="page">
      <h1>Workshop job receipt</h1>
      <div class="sub">Job #${escapeHtml(job.id)} · ${escapeHtml(workflowStage)}</div>
      <div class="titlebar"></div>

      <div class="grid2">
        <div>
          <div class="box-title">Customer</div>
          <div class="row"><span class="label">Name</span><span class="value">${escapeHtml(job.customerName)}</span></div>
          <div class="row"><span class="label">Phone</span><span class="value">${escapeHtml(job.customerMobile)}</span></div>
          ${
            customerEmail
              ? `<div class="row"><span class="label">Email</span><span class="value">${escapeHtml(customerEmail)}</span></div>`
              : ""
          }
          ${
            customerAddress
              ? `<div class="row"><span class="label">Address</span><span class="value">${escapeHtml(customerAddress)}</span></div>`
              : ""
          }
        </div>
        <div>
          <div class="box-title">Job</div>
          <div class="row"><span class="label">Title</span><span class="value">${escapeHtml(job.title)}</span></div>
          <div class="row"><span class="label">Karigar</span><span class="value">${escapeHtml(job.karigar)}</span></div>
          <div class="row"><span class="label">Material</span><span class="value">${escapeHtml(job.material || "—")}</span></div>
          <div class="row"><span class="label">Size</span><span class="value">${escapeHtml(job.size || "—")}</span></div>
          <div class="row"><span class="label">Deadline</span><span class="value">${escapeHtml(job.deadline || "—")}</span></div>
          <div class="row"><span class="label">Priority</span><span class="value">${escapeHtml(job.priority)}</span></div>
          <div class="row"><span class="label">Quoted price</span><span class="value price-big">${escapeHtml(priceLine)}</span></div>
        </div>
      </div>

      ${
        job.instructions.trim()
          ? `<div class="box-title" style="margin-top:20px">Instructions</div><div class="instr">${escapeHtml(job.instructions)}</div>`
          : ""
      }
      ${refBlock}

      <div class="footer">Generated from GoldMind ERP Admin Dashboard · Karigar workshop record.</div>
    </div>
  </body>
</html>`;
};

export const downloadKarigarJobReceiptHtml = (args: {
  job: KarigarJobReceiptLike;
  workflowStage: string;
  customerEmail?: string;
  customerAddress?: string;
}) => {
  const html = buildKarigarJobReceiptHtml(args);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `karigar-job-${args.job.id}.html`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
};

