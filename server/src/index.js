import express from "express";
import cors from "cors";
import pool from "./db.js";
import { formatCurrency, parseCurrency } from "./format.js";
import { createAdminAuthRouter } from "./auth.js";

const app = express();
const PORT = Number(process.env.PORT) || 3001;

async function ensureBaseSchema() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS inventory_items (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        weight TEXT NOT NULL,
        purity TEXT NOT NULL,
        price_rupees BIGINT NOT NULL,
        hallmark BOOLEAN NOT NULL DEFAULT true,
        hallmark_number TEXT NOT NULL DEFAULT '',
        size TEXT NOT NULL DEFAULT '',
        provider_name TEXT NOT NULL DEFAULT '',
        storage_box_number TEXT NOT NULL DEFAULT '',
        image TEXT NOT NULL DEFAULT 'necklace',
        stock INT NOT NULL DEFAULT 0,
        high_selling BOOLEAN NOT NULL DEFAULT false
      );
    `);
    await client.query(`
      ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS inventory_track TEXT NOT NULL DEFAULT 'jewellery';
    `);
    await client.query(`
      ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS quantity_unit TEXT NOT NULL DEFAULT 'g';
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT NOT NULL DEFAULT '',
        email TEXT NOT NULL DEFAULT '',
        address TEXT NOT NULL DEFAULT '',
        total_purchases_rupees BIGINT NOT NULL DEFAULT 0,
        visits INT NOT NULL DEFAULT 0,
        last_visit TEXT NOT NULL DEFAULT ''
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS gold_schemes (
        id SERIAL PRIMARY KEY,
        customer_id INT NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
        monthly_amount_rupees BIGINT NOT NULL,
        tenure_months INT NOT NULL,
        benefit_type TEXT NOT NULL DEFAULT 'one_month_free',
        benefit_bonus_rupees BIGINT NOT NULL DEFAULT 0,
        benefit_making_discount_pct INT NOT NULL DEFAULT 0,
        start_date DATE NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        redeemed_at TIMESTAMPTZ,
        notes TEXT NOT NULL DEFAULT '',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT gold_schemes_tenure_chk CHECK (tenure_months IN (6, 10, 12)),
        CONSTRAINT gold_schemes_benefit_chk CHECK (
          benefit_type IN ('one_month_free', 'bonus_rupees', 'making_discount_pct')
        )
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS gold_scheme_payments (
        id SERIAL PRIMARY KEY,
        scheme_id INT NOT NULL REFERENCES gold_schemes(id) ON DELETE CASCADE,
        amount_rupees BIGINT NOT NULL,
        paid_date DATE NOT NULL DEFAULT CURRENT_DATE,
        installment_no INT NOT NULL,
        notes TEXT NOT NULL DEFAULT '',
        UNIQUE (scheme_id, installment_no)
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS cash_book_days (
        id SERIAL PRIMARY KEY,
        book_date DATE NOT NULL UNIQUE,
        opening_rupees BIGINT NOT NULL DEFAULT 0,
        is_closed BOOLEAN NOT NULL DEFAULT false,
        notes TEXT NOT NULL DEFAULT ''
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS cash_book_lines (
        id SERIAL PRIMARY KEY,
        day_id INT NOT NULL REFERENCES cash_book_days(id) ON DELETE CASCADE,
        direction TEXT NOT NULL CHECK (direction IN ('in', 'out')),
        category TEXT NOT NULL DEFAULT '',
        amount_rupees BIGINT NOT NULL CHECK (amount_rupees >= 0),
        memo TEXT NOT NULL DEFAULT '',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_cash_book_lines_day_id ON cash_book_lines(day_id);`);
    await client.query(`
      CREATE TABLE IF NOT EXISTS employees (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        department TEXT NOT NULL,
        salary_rupees BIGINT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        join_date TEXT NOT NULL DEFAULT '',
        phone TEXT NOT NULL DEFAULT '',
        email TEXT NOT NULL DEFAULT '',
        address TEXT NOT NULL DEFAULT ''
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        customer TEXT NOT NULL,
        customer_phone TEXT NOT NULL DEFAULT '',
        customer_email TEXT NOT NULL DEFAULT '',
        customer_address TEXT NOT NULL DEFAULT '',
        payment_mode TEXT NOT NULL DEFAULT 'cash',
        items TEXT NOT NULL,
        total_rupees BIGINT NOT NULL,
        status TEXT NOT NULL,
        order_date DATE NOT NULL
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS karigar_jobs (
        id SERIAL PRIMARY KEY,
        column_key TEXT NOT NULL CHECK (column_key IN ('assigned', 'inProgress', 'completed')),
        title TEXT NOT NULL,
        karigar TEXT NOT NULL,
        material TEXT NOT NULL DEFAULT '',
        deadline TEXT NOT NULL DEFAULT '',
        priority TEXT NOT NULL DEFAULT 'medium',
        customer_name TEXT NOT NULL DEFAULT '',
        customer_mobile TEXT NOT NULL DEFAULT '',
        instructions TEXT NOT NULL DEFAULT '',
        size TEXT NOT NULL DEFAULT '',
        reference_image TEXT NOT NULL DEFAULT '',
        price_rupees BIGINT NOT NULL DEFAULT 0
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS activities (
        id BIGSERIAL PRIMARY KEY,
        action TEXT NOT NULL,
        detail TEXT NOT NULL,
        time_display TEXT NOT NULL,
        type TEXT NOT NULL,
        activity_date DATE NOT NULL,
        read BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS accounting_monthly (
        id SERIAL PRIMARY KEY,
        month_label TEXT NOT NULL UNIQUE,
        income_rupees BIGINT NOT NULL,
        expense_rupees BIGINT NOT NULL
      );
    `);
    await client.query(
      `CREATE INDEX IF NOT EXISTS idx_orders_order_date ON orders (order_date)`,
    );
    await client.query(
      `CREATE INDEX IF NOT EXISTS idx_activities_created ON activities (created_at DESC)`,
    );
  } finally {
    client.release();
  }
}

/** Add contact columns if DB was created before they existed, then backfill from customers by name. */
async function ensureOrdersContactColumns() {
  const client = await pool.connect();
  try {
    await client.query(
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone TEXT NOT NULL DEFAULT ''",
    );
    await client.query(
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_email TEXT NOT NULL DEFAULT ''",
    );
    await client.query(
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_address TEXT NOT NULL DEFAULT ''",
    );
    await client.query(
      `UPDATE orders o SET
         customer_phone = c.phone,
         customer_email = c.email,
         customer_address = c.address
       FROM customers c
       WHERE LOWER(TRIM(o.customer)) = LOWER(TRIM(c.name))
         AND TRIM(COALESCE(o.customer_phone, '')) = ''`,
    );
    await client.query(
      "ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_mode TEXT NOT NULL DEFAULT 'cash'",
    );
  } finally {
    client.release();
  }
}

async function ensureKarigarJobsPriceColumn() {
  const client = await pool.connect();
  try {
    await client.query(
      "ALTER TABLE karigar_jobs ADD COLUMN IF NOT EXISTS price_rupees BIGINT NOT NULL DEFAULT 0",
    );
  } finally {
    client.release();
  }
}

async function ensureSalaryPaymentsTable() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS salary_payments (
        id BIGSERIAL PRIMARY KEY,
        employee_id INT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        amount_rupees BIGINT NOT NULL,
        month_period TEXT NOT NULL,
        payment_method TEXT NOT NULL DEFAULT 'Bank Transfer',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);
    await client.query(
      `CREATE INDEX IF NOT EXISTS idx_salary_payments_employee ON salary_payments (employee_id, created_at DESC)`,
    );
  } finally {
    client.release();
  }
}

const ORDER_PAYMENT_MODES = new Set(["cash", "card", "upi", "bank", "credit_note"]);

function normalizePaymentMode(raw) {
  const s = String(raw ?? "cash")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
  return ORDER_PAYMENT_MODES.has(s) ? s : "cash";
}

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "4mb" }));

app.use("/api/admin", createAdminAuthRouter());

const orderStatusSequence = ["ordered", "in-production", "ready", "delivered"];
const jobColumnSequence = ["assigned", "inProgress", "completed"];

function mapInventory(r) {
  return {
    id: r.id,
    name: r.name,
    category: r.category,
    inventoryTrack: r.inventory_track ?? "jewellery",
    quantityUnit: r.quantity_unit ?? "g",
    weight: r.weight,
    purity: r.purity,
    price: formatCurrency(Number(r.price_rupees)),
    hallmark: r.hallmark,
    hallmarkNumber: r.hallmark_number,
    size: r.size,
    providerName: r.provider_name,
    storageBoxNumber: r.storage_box_number,
    image: r.image,
    stock: r.stock,
    highSelling: r.high_selling,
  };
}

function mapGoldSchemeRow(r) {
  const monthly = Number(r.monthly_amount_rupees);
  const tenure = Number(r.tenure_months);
  const paid = Number(r.installments_paid ?? 0);
  const totalPaid = Number(r.total_paid_rupees ?? 0);
  const expectedTotal = monthly * tenure;
  const sd = r.start_date;
  const startStr =
    sd instanceof Date ? sd.toISOString().slice(0, 10) : String(sd ?? "").slice(0, 10);
  return {
    id: r.id,
    customerId: r.customer_id,
    customerName: r.customer_name,
    customerPhone: r.customer_phone ?? "",
    monthlyAmountRupees: monthly,
    monthlyAmount: formatCurrency(monthly),
    tenureMonths: tenure,
    benefitType: r.benefit_type,
    benefitBonusRupees: Number(r.benefit_bonus_rupees ?? 0),
    benefitMakingDiscountPct: Number(r.benefit_making_discount_pct ?? 0),
    startDate: startStr,
    status: r.status,
    redeemedAt: r.redeemed_at ? new Date(r.redeemed_at).toISOString() : null,
    notes: r.notes ?? "",
    createdAt: r.created_at ? new Date(r.created_at).toISOString() : null,
    installmentsPaid: paid,
    totalPaidRupees: totalPaid,
    totalPaid: formatCurrency(totalPaid),
    expectedTotalRupees: expectedTotal,
    expectedTotal: formatCurrency(expectedTotal),
    isComplete: paid >= tenure,
    canRedeem: r.status === "active" && paid >= tenure,
  };
}

function isValidBookDate(s) {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}

/** Cash book inflows: orders except credit_note; gold scheme installments. Outflows: salary when payment method is Cash. */
function syntheticCashBookLineOrder(r) {
  const amt = Number(r.total_rupees);
  const mode = r.payment_mode ?? "cash";
  return {
    id: `order:${r.id}`,
    source: "order",
    sourceId: r.id,
    dayId: null,
    direction: "in",
    category: "Sale",
    amountRupees: amt,
    amount: formatCurrency(amt),
    memo: `${r.customer} · ${mode}`,
    paymentMode: mode,
    createdAt: r.order_date ? `${String(r.order_date).slice(0, 10)}T12:00:00.000Z` : null,
  };
}

function syntheticCashBookLineScheme(r) {
  const amt = Number(r.amount_rupees);
  return {
    id: `scheme_payment:${r.id}`,
    source: "scheme_payment",
    sourceId: String(r.id),
    schemeId: Number(r.scheme_id),
    dayId: null,
    direction: "in",
    category: "Gold scheme installment",
    amountRupees: amt,
    amount: formatCurrency(amt),
    memo: `${r.customer_name ?? ""} · scheme #${r.scheme_id}${r.notes ? ` · ${r.notes}` : ""}`.trim(),
    createdAt: r.paid_date ? `${String(r.paid_date).slice(0, 10)}T12:00:00.000Z` : null,
  };
}

function syntheticCashBookLineSalary(r) {
  const amt = Number(r.amount_rupees);
  return {
    id: `salary:${r.id}`,
    source: "salary",
    sourceId: String(r.id),
    employeeId: Number(r.employee_id),
    dayId: null,
    direction: "out",
    category: "Salary (cash)",
    amountRupees: amt,
    amount: formatCurrency(amt),
    memo: `${r.employee_name ?? ""} · ${r.month_period ?? ""}`.trim(),
    paymentMode: r.payment_method ?? "",
    createdAt: r.created_at ? new Date(r.created_at).toISOString() : null,
  };
}

async function loadCashBookDayPayload(bookDate) {
  const { rows: metaRows } = await pool.query(
    `SELECT id, notes, is_closed FROM cash_book_days WHERE book_date = $1`,
    [bookDate],
  );
  const meta = metaRows[0];
  const dayId = meta?.id ?? null;
  const notes = meta?.notes ?? "";
  const isClosed = Boolean(meta?.is_closed);

  const [beforeRows, orderRows, schemeRows, salaryRows] = await Promise.all([
    pool.query(
      `SELECT
        (SELECT COALESCE(SUM(total_rupees), 0)::bigint FROM orders
         WHERE order_date < $1::date AND COALESCE(payment_mode, '') <> 'credit_note') AS ord_in,
        (SELECT COALESCE(SUM(amount_rupees), 0)::bigint FROM gold_scheme_payments WHERE paid_date < $1::date) AS sch_in,
        (SELECT COALESCE(SUM(amount_rupees), 0)::bigint FROM salary_payments
         WHERE created_at::date < $1::date AND LOWER(TRIM(COALESCE(payment_method, ''))) = 'cash') AS sal_out`,
      [bookDate],
    ),
    pool.query(
      `SELECT id, customer, total_rupees, payment_mode, order_date FROM orders
       WHERE order_date = $1::date AND COALESCE(payment_mode, '') <> 'credit_note'
       ORDER BY id`,
      [bookDate],
    ),
    pool.query(
      `SELECT p.id, p.amount_rupees, p.paid_date, p.notes, c.name AS customer_name, gs.id AS scheme_id
       FROM gold_scheme_payments p
       JOIN gold_schemes gs ON gs.id = p.scheme_id
       JOIN customers c ON c.id = gs.customer_id
       WHERE p.paid_date = $1::date
       ORDER BY p.id`,
      [bookDate],
    ),
    pool.query(
      `SELECT sp.id, sp.employee_id, sp.amount_rupees, sp.created_at, sp.payment_method, sp.month_period, e.name AS employee_name
       FROM salary_payments sp
       JOIN employees e ON e.id = sp.employee_id
       WHERE sp.created_at::date = $1::date AND LOWER(TRIM(COALESCE(sp.payment_method, ''))) = 'cash'
       ORDER BY sp.id`,
      [bookDate],
    ),
  ]);

  const b = beforeRows.rows[0];
  const openingRupees =
    Number(b.ord_in) + Number(b.sch_in) - Number(b.sal_out);

  const linesIn = [];
  const linesOut = [];
  const mappedLines = [];

  for (const r of orderRows.rows) {
    const m = syntheticCashBookLineOrder(r);
    mappedLines.push(m);
    linesIn.push(m);
  }
  for (const r of schemeRows.rows) {
    const m = syntheticCashBookLineScheme(r);
    mappedLines.push(m);
    linesIn.push(m);
  }
  for (const r of salaryRows.rows) {
    const m = syntheticCashBookLineSalary(r);
    mappedLines.push(m);
    linesOut.push(m);
  }

  mappedLines.sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    if (ta !== tb) return ta - tb;
    return String(a.id).localeCompare(String(b.id));
  });

  const tin = linesIn.reduce((s, x) => s + x.amountRupees, 0);
  const tout = linesOut.reduce((s, x) => s + x.amountRupees, 0);
  const closingRupees = openingRupees + tin - tout;

  return {
    bookDate,
    dayExists: Boolean(meta),
    dayId,
    openingRupees,
    opening: formatCurrency(openingRupees),
    openingNote:
      "Opening equals the running position from earlier days: all sales (except credit note) plus gold scheme installments received, minus salaries paid in cash, before this date. Starts from ₹0 before your first recorded transaction.",
    totalInRupees: tin,
    totalIn: formatCurrency(tin),
    totalOutRupees: tout,
    totalOut: formatCurrency(tout),
    closingRupees,
    closing: formatCurrency(closingRupees),
    isClosed,
    notes,
    lines: mappedLines,
    linesIn,
    linesOut,
    sourcesSummary: {
      ordersInCount: orderRows.rows.length,
      schemePaymentsInCount: schemeRows.rows.length,
      salaryCashOutCount: salaryRows.rows.length,
    },
  };
}

function mapCustomer(r) {
  return {
    id: r.id,
    name: r.name,
    phone: r.phone,
    email: r.email,
    address: r.address,
    totalPurchases: formatCurrency(Number(r.total_purchases_rupees)),
    visits: r.visits,
    lastVisit: r.last_visit,
  };
}

function digitsOnlyPhone(s) {
  return String(s ?? "").replace(/\D/g, "");
}

function phoneTail10(s) {
  const d = digitsOnlyPhone(s);
  return d.length >= 10 ? d.slice(-10) : "";
}

function lastVisitLabelFromOrderDate(isoDate) {
  try {
    const d = new Date(`${String(isoDate).slice(0, 10)}T12:00:00`);
    return new Intl.DateTimeFormat("en-IN", { month: "short", day: "numeric", year: "numeric" }).format(d);
  } catch {
    return "Recent";
  }
}

/**
 * One CRM row per mobile (last 10 digits): insert or update when an order is placed.
 * Runs inside the same DB transaction as the order insert.
 */
async function upsertCustomerFromOrder(client, params) {
  const {
    customerName,
    customerPhone,
    customerEmail,
    customerAddress,
    orderTotalRupees,
    orderDateIso,
  } = params;
  const tail = phoneTail10(customerPhone);
  if (!tail) return;

  const name = String(customerName ?? "").trim() || "Customer";
  const phone = String(customerPhone ?? "").trim();
  const email = String(customerEmail ?? "").trim();
  const address = String(customerAddress ?? "").trim();
  const lastVisit = lastVisitLabelFromOrderDate(orderDateIso);
  const addTotal = Number(orderTotalRupees) || 0;

  const { rows: hits } = await client.query(
    `SELECT id, total_purchases_rupees, visits
     FROM customers
     WHERE length(regexp_replace(COALESCE(phone, ''), '[^0-9]', '', 'g')) >= 10
       AND right(regexp_replace(COALESCE(phone, ''), '[^0-9]', '', 'g'), 10) = $1
     LIMIT 1`,
    [tail],
  );

  if (hits.length) {
    const row = hits[0];
    const newTotal = Number(row.total_purchases_rupees) + addTotal;
    const newVisits = Number(row.visits) + 1;
    await client.query(
      `UPDATE customers SET
         name = $1,
         phone = CASE WHEN $2::text <> '' THEN $2 ELSE phone END,
         email = $3,
         address = $4,
         total_purchases_rupees = $5,
         visits = $6,
         last_visit = $7
       WHERE id = $8`,
      [name, phone, email, address, newTotal, newVisits, lastVisit, row.id],
    );
  } else {
    await client.query(
      `INSERT INTO customers (name, phone, email, address, total_purchases_rupees, visits, last_visit)
       VALUES ($1, $2, $3, $4, $5, 1, $6)`,
      [name, phone || tail, email, address, addTotal, lastVisit],
    );
  }
}

/**
 * Upsert CRM row when a karigar job is assigned (no purchase total). Match by mobile last 10 digits.
 */
async function upsertCustomerFromKarigarContact(client, params) {
  const { customerName, customerPhone, customerEmail, customerAddress } = params;
  const tail = phoneTail10(customerPhone);
  if (!tail) return;

  const name = String(customerName ?? "").trim() || "Customer";
  const phone = String(customerPhone ?? "").trim();
  const email = String(customerEmail ?? "").trim();
  const address = String(customerAddress ?? "").trim();
  const lastVisit = lastVisitLabelFromOrderDate(new Date().toISOString().slice(0, 10));

  const { rows: hits } = await client.query(
    `SELECT id
     FROM customers
     WHERE length(regexp_replace(COALESCE(phone, ''), '[^0-9]', '', 'g')) >= 10
       AND right(regexp_replace(COALESCE(phone, ''), '[^0-9]', '', 'g'), 10) = $1
     LIMIT 1`,
    [tail],
  );

  if (hits.length) {
    await client.query(
      `UPDATE customers SET
         name = $1,
         phone = CASE WHEN $2::text <> '' THEN $2 ELSE phone END,
         email = CASE WHEN $3::text <> '' THEN $3 ELSE email END,
         address = CASE WHEN $4::text <> '' THEN $4 ELSE address END,
         visits = visits + 1,
         last_visit = $5
       WHERE id = $6`,
      [name, phone, email, address, lastVisit, hits[0].id],
    );
  } else {
    await client.query(
      `INSERT INTO customers (name, phone, email, address, total_purchases_rupees, visits, last_visit)
       VALUES ($1, $2, $3, $4, 0, 1, $5)`,
      [name, phone || tail, email, address, lastVisit],
    );
  }
}

function mapEmployee(r) {
  return {
    id: r.id,
    name: r.name,
    role: r.role,
    department: r.department,
    salary: formatCurrency(Number(r.salary_rupees)),
    status: r.status,
    joinDate: r.join_date,
    phone: r.phone,
    email: r.email,
    address: r.address,
  };
}

function mapSalaryPayment(r) {
  return {
    id: Number(r.id),
    employeeId: Number(r.employee_id),
    amount: formatCurrency(Number(r.amount_rupees)),
    amountRupees: Number(r.amount_rupees),
    monthPeriod: r.month_period,
    paymentMethod: r.payment_method,
    createdAt: r.created_at ? new Date(r.created_at).toISOString() : "",
  };
}

function mapOrder(r) {
  return {
    id: r.id,
    customer: r.customer,
    customerPhone: r.customer_phone ?? "",
    customerEmail: r.customer_email ?? "",
    customerAddress: r.customer_address ?? "",
    paymentMode: r.payment_mode ?? "cash",
    items: r.items,
    total: formatCurrency(Number(r.total_rupees)),
    status: r.status,
    date: r.order_date instanceof Date ? r.order_date.toISOString().slice(0, 10) : String(r.order_date).slice(0, 10),
  };
}

function mapJob(r) {
  const priceRupees = Number(r.price_rupees ?? 0);
  return {
    id: r.id,
    title: r.title,
    karigar: r.karigar,
    material: r.material,
    deadline: r.deadline,
    priority: r.priority,
    customerName: r.customer_name,
    customerMobile: r.customer_mobile,
    instructions: r.instructions,
    size: r.size,
    referenceImage: r.reference_image ?? "",
    price: formatCurrency(priceRupees),
    price_rupees: priceRupees,
    columnKey: r.column_key,
  };
}

function mapActivity(r) {
  const date =
    r.activity_date instanceof Date
      ? r.activity_date.toISOString().slice(0, 10)
      : String(r.activity_date).slice(0, 10);
  return {
    id: Number(r.id),
    action: r.action,
    detail: r.detail,
    time: r.time_display,
    type: r.type,
    date,
    read: r.read,
  };
}

async function insertActivity(client, { action, detail, type }) {
  const q = `INSERT INTO activities (action, detail, time_display, type, activity_date, read)
    VALUES ($1, $2, $3, $4, CURRENT_DATE, false)`;
  const params = [action, detail, "Just now", type];
  if (client) await client.query(q, params);
  else await pool.query(q, params);
}

async function buildKarigarBoard() {
  const { rows } = await pool.query("SELECT * FROM karigar_jobs ORDER BY id");
  const board = { assigned: [], inProgress: [], completed: [] };
  for (const r of rows) {
    const j = mapJob(r);
    if (r.column_key === "assigned") board.assigned.push(j);
    else if (r.column_key === "inProgress") board.inProgress.push(j);
    else board.completed.push(j);
  }
  return board;
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/bootstrap", async (_req, res) => {
  try {
    const [inv, cust, emp, ord, jobs, act] = await Promise.all([
      pool.query("SELECT * FROM inventory_items ORDER BY id"),
      pool.query("SELECT * FROM customers ORDER BY id"),
      pool.query("SELECT * FROM employees ORDER BY id"),
      pool.query("SELECT * FROM orders ORDER BY order_date DESC, id DESC"),
      pool.query("SELECT * FROM karigar_jobs ORDER BY id"),
      pool.query("SELECT * FROM activities ORDER BY created_at DESC LIMIT 50"),
    ]);

    const board = { assigned: [], inProgress: [], completed: [] };
    for (const r of jobs.rows) {
      const j = mapJob(r);
      if (r.column_key === "assigned") board.assigned.push(j);
      else if (r.column_key === "inProgress") board.inProgress.push(j);
      else board.completed.push(j);
    }

    const activities = act.rows.map(mapActivity);
    const notifications = activities.map((a) => ({
      id: a.id,
      title: a.action,
      detail: a.detail,
      time: a.time,
      read: a.read,
    }));

    res.json({
      inventory: inv.rows.map(mapInventory),
      customerList: cust.rows.map(mapCustomer),
      employeeList: emp.rows.map(mapEmployee),
      salesOrders: ord.rows.map(mapOrder),
      karigarBoard: board,
      recentActivities: activities,
      notifications,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load data" });
  }
});

app.get("/api/orders/:id", async (req, res) => {
  const id = String(req.params.id ?? "");
  try {
    const { rows } = await pool.query("SELECT * FROM orders WHERE id = $1", [id]);
    if (!rows.length) {
      res.status(404).json({ error: "Order not found" });
      return;
    }
    res.json(mapOrder(rows[0]));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load order" });
  }
});

app.get("/api/accounting/monthly", async (_req, res) => {
  try {
    const { rows } = await pool.query("SELECT month_label, income_rupees, expense_rupees FROM accounting_monthly ORDER BY id");
    res.json({
      income: rows.map((r) => ({ month: r.month_label, amount: Number(r.income_rupees) })),
      expenses: rows.map((r) => ({ month: r.month_label, amount: Number(r.expense_rupees) })),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load accounting" });
  }
});

app.post("/api/inventory", async (req, res) => {
  const b = req.body ?? {};
  const priceRupees = parseCurrency(String(b.price ?? "0"));
  const image =
    b.image && String(b.image).trim().length > 0 ? String(b.image).trim() : String(b.category ?? "gold").toLowerCase();

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const invTrack = String(b.inventoryTrack ?? "jewellery").trim() || "jewellery";
    const qtyUnit = String(b.quantityUnit ?? "g").trim() || "g";
    const { rows } = await client.query(
      `INSERT INTO inventory_items (name, category, inventory_track, quantity_unit, weight, purity, price_rupees, hallmark, hallmark_number, size, provider_name, storage_box_number, image, stock, high_selling)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,false)
       RETURNING *`,
      [
        String(b.name ?? "").trim(),
        String(b.category ?? ""),
        invTrack,
        qtyUnit,
        String(b.weight ?? "").trim(),
        String(b.purity ?? ""),
        priceRupees,
        Boolean(b.hallmark),
        String(b.hallmarkNumber ?? "").trim(),
        String(b.size ?? "").trim(),
        String(b.providerName ?? "").trim(),
        String(b.storageBoxNumber ?? "").trim(),
        image,
        Number(b.stock) || 0,
      ],
    );
    await insertActivity(client, {
      action: "Inventory item added",
      detail: `${rows[0].name} · ${rows[0].purity}`,
      type: "inventory",
    });
    await client.query("COMMIT");
    res.json(mapInventory(rows[0]));
  } catch (e) {
    await client.query("ROLLBACK");
    console.error(e);
    res.status(500).json({ error: "Failed to add inventory" });
  } finally {
    client.release();
  }
});

app.patch("/api/inventory/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id < 1) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const b = req.body ?? {};
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows: existing } = await client.query("SELECT * FROM inventory_items WHERE id = $1 FOR UPDATE", [id]);
    if (!existing.length) {
      await client.query("ROLLBACK");
      res.status(404).json({ error: "Not found" });
      return;
    }
    const cur = existing[0];
    const parsedPrice = parseCurrency(String(b.price ?? ""));
    const priceRupees = parsedPrice > 0 ? parsedPrice : Number(cur.price_rupees);
    const imageRaw = b.image !== undefined ? String(b.image).trim() : "";
    const image = imageRaw.length > 0 ? imageRaw : cur.image;

    const nextTrack =
      b.inventoryTrack !== undefined ? String(b.inventoryTrack).trim() || cur.inventory_track || "jewellery" : cur.inventory_track || "jewellery";
    const nextUnit =
      b.quantityUnit !== undefined ? String(b.quantityUnit).trim() || cur.quantity_unit || "g" : cur.quantity_unit || "g";
    const { rows } = await client.query(
      `UPDATE inventory_items SET
        name = $1, category = $2, inventory_track = $3, quantity_unit = $4,
        weight = $5, purity = $6, price_rupees = $7,
        hallmark = $8, hallmark_number = $9, size = $10, provider_name = $11,
        storage_box_number = $12, image = $13, stock = $14, high_selling = $15
       WHERE id = $16 RETURNING *`,
      [
        String(b.name ?? cur.name).trim(),
        String(b.category ?? cur.category),
        nextTrack,
        nextUnit,
        String(b.weight ?? cur.weight).trim(),
        String(b.purity ?? cur.purity),
        priceRupees,
        b.hallmark !== undefined ? Boolean(b.hallmark) : cur.hallmark,
        String(b.hallmarkNumber ?? cur.hallmark_number ?? "").trim(),
        String(b.size ?? cur.size).trim(),
        String(b.providerName ?? cur.provider_name).trim(),
        String(b.storageBoxNumber ?? cur.storage_box_number).trim(),
        image,
        Number(b.stock) >= 0 ? Number(b.stock) : cur.stock,
        b.highSelling !== undefined ? Boolean(b.highSelling) : cur.high_selling,
        id,
      ],
    );
    await insertActivity(client, {
      action: "Inventory item updated",
      detail: `${rows[0].name} · ${rows[0].purity}`,
      type: "inventory",
    });
    await client.query("COMMIT");
    res.json(mapInventory(rows[0]));
  } catch (e) {
    await client.query("ROLLBACK");
    console.error(e);
    res.status(500).json({ error: "Failed to update inventory" });
  } finally {
    client.release();
  }
});

app.delete("/api/inventory/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id < 1) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query("DELETE FROM inventory_items WHERE id = $1 RETURNING name, purity", [id]);
    if (!rows.length) {
      await client.query("ROLLBACK");
      res.status(404).json({ error: "Not found" });
      return;
    }
    await insertActivity(client, {
      action: "Inventory item deleted",
      detail: `${rows[0].name} · ${rows[0].purity}`,
      type: "inventory",
    });
    await client.query("COMMIT");
    res.json({ ok: true, id });
  } catch (e) {
    await client.query("ROLLBACK");
    console.error(e);
    res.status(500).json({ error: "Failed to delete inventory" });
  } finally {
    client.release();
  }
});

app.post("/api/orders", async (req, res) => {
  const b = req.body ?? {};
  const totalRupees = parseCurrency(String(b.total ?? "0"));
  const status = String(b.status ?? "ordered");
  const isoDate = b.date ? String(b.date).slice(0, 10) : new Date().toISOString().slice(0, 10);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows: maxRows } = await client.query(
      `SELECT id FROM orders WHERE id ~ '^JW-[0-9]+$'`,
    );
    let highest = 2850;
    for (const r of maxRows) {
      const n = Number(String(r.id).replace(/\D/g, ""));
      if (Number.isFinite(n)) highest = Math.max(highest, n);
    }
    const nextId = `JW-${String(highest + 1).padStart(4, "0")}`;

    const custPhone = String(b.customerPhone ?? "").trim();
    const custEmail = String(b.customerEmail ?? "").trim();
    const custAddr = String(b.customerAddress ?? "").trim();
    const paymentMode = normalizePaymentMode(b.paymentMode);
    const { rows } = await client.query(
      `INSERT INTO orders (id, customer, customer_phone, customer_email, customer_address, payment_mode, items, total_rupees, status, order_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [
        nextId,
        String(b.customer ?? "").trim(),
        custPhone,
        custEmail,
        custAddr,
        paymentMode,
        String(b.items ?? "").trim(),
        totalRupees,
        status,
        isoDate,
      ],
    );
    await upsertCustomerFromOrder(client, {
      customerName: String(b.customer ?? "").trim(),
      customerPhone: custPhone,
      customerEmail: custEmail,
      customerAddress: custAddr,
      orderTotalRupees: totalRupees,
      orderDateIso: isoDate,
    });
    await insertActivity(client, {
      action: "New order created",
      detail: `${nextId} · ${String(b.customer ?? "").trim()}`,
      type: "sale",
    });
    await client.query("COMMIT");
    res.json(mapOrder(rows[0]));
  } catch (e) {
    await client.query("ROLLBACK");
    console.error(e);
    res.status(500).json({ error: "Failed to create order" });
  } finally {
    client.release();
  }
});

app.patch("/api/orders/:id/advance", async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query("SELECT * FROM orders WHERE id = $1 FOR UPDATE", [id]);
    if (!rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Order not found" });
    }
    const order = rows[0];
    const idx = orderStatusSequence.indexOf(order.status);
    const next = orderStatusSequence[Math.min(idx + 1, orderStatusSequence.length - 1)];
    if (next === order.status) {
      await client.query("ROLLBACK");
      return res.json({ status: null, order: mapOrder(order) });
    }
    const { rows: updated } = await client.query(
      "UPDATE orders SET status = $1 WHERE id = $2 RETURNING *",
      [next, id],
    );
    await insertActivity(client, {
      action: "Order status updated",
      detail: `${id} moved to ${next.replace("-", " ")}`,
      type: "delivery",
    });
    await client.query("COMMIT");
    res.json({ status: next, order: mapOrder(updated[0]) });
  } catch (e) {
    await client.query("ROLLBACK");
    console.error(e);
    res.status(500).json({ error: "Failed to advance order" });
  } finally {
    client.release();
  }
});

app.get("/api/karigar-jobs/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id < 1) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  try {
    const { rows } = await pool.query("SELECT * FROM karigar_jobs WHERE id = $1", [id]);
    if (!rows.length) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(mapJob(rows[0]));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load job" });
  }
});

app.post("/api/karigar-jobs", async (req, res) => {
  const b = req.body ?? {};
  const priceRupees = parseCurrency(String(b.price ?? "0"));
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      `INSERT INTO karigar_jobs (column_key, title, karigar, material, deadline, priority, customer_name, customer_mobile, instructions, size, reference_image, price_rupees)
       VALUES ('assigned',$1,$2,$3,$4,'medium',$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [
        String(b.title ?? "").trim(),
        String(b.karigar ?? ""),
        String(b.material ?? "").trim(),
        String(b.deadline ?? "").trim(),
        String(b.customerName ?? "").trim(),
        String(b.customerMobile ?? "").trim(),
        String(b.instructions ?? "").trim(),
        String(b.size ?? "").trim(),
        String(b.referenceImage ?? ""),
        priceRupees,
      ],
    );
    await insertActivity(client, {
      action: "Karigar job assigned",
      detail: `${rows[0].title} assigned to ${rows[0].karigar}`,
      type: "karigar",
    });
    await upsertCustomerFromKarigarContact(client, {
      customerName: String(b.customerName ?? "").trim(),
      customerPhone: String(b.customerMobile ?? "").trim(),
      customerEmail: String(b.customerEmail ?? "").trim(),
      customerAddress: String(b.customerAddress ?? "").trim(),
    });
    await client.query("COMMIT");
    res.json(mapJob(rows[0]));
  } catch (e) {
    await client.query("ROLLBACK");
    console.error(e);
    res.status(500).json({ error: "Failed to create job" });
  } finally {
    client.release();
  }
});

app.patch("/api/karigar-jobs/:id/move", async (req, res) => {
  const id = Number(req.params.id);
  const { column, advance } = req.body ?? {};

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query("SELECT * FROM karigar_jobs WHERE id = $1 FOR UPDATE", [id]);
    if (!rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Job not found" });
    }
    const row = rows[0];
    let nextCol = row.column_key;

    if (advance) {
      const idx = jobColumnSequence.indexOf(row.column_key);
      nextCol = jobColumnSequence[Math.min(idx + 1, jobColumnSequence.length - 1)];
    } else if (column && jobColumnSequence.includes(column)) {
      nextCol = column;
    } else {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Invalid move" });
    }

    if (nextCol === row.column_key) {
      await client.query("ROLLBACK");
      return res.json({ advanced: false, column: nextCol, job: mapJob(row) });
    }

    const { rows: updated } = await client.query(
      "UPDATE karigar_jobs SET column_key = $1 WHERE id = $2 RETURNING *",
      [nextCol, id],
    );
    const verb = advance ? "updated" : "moved";
    await insertActivity(client, {
      action: `Karigar job ${verb}`,
      detail: `${row.title} moved to ${nextCol}`,
      type: "karigar",
    });
    await client.query("COMMIT");
    res.json({ advanced: true, column: nextCol, job: mapJob(updated[0]) });
  } catch (e) {
    await client.query("ROLLBACK");
    console.error(e);
    res.status(500).json({ error: "Failed to move job" });
  } finally {
    client.release();
  }
});

app.post("/api/employees", async (req, res) => {
  const b = req.body ?? {};
  const salaryRupees = parseCurrency(String(b.salary ?? "0"));
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      `INSERT INTO employees (name, role, department, salary_rupees, status, join_date, phone, email, address)
       VALUES ($1,$2,$3,$4,'active',$5,$6,$7,$8)
       RETURNING *`,
      [
        String(b.name ?? "").trim(),
        String(b.role ?? "Salesman"),
        String(b.department ?? "").trim(),
        salaryRupees,
        String(b.joinDate ?? "").trim() || "Today",
        String(b.phone ?? "").trim(),
        String(b.email ?? "").trim(),
        String(b.address ?? "").trim(),
      ],
    );
    await insertActivity(client, {
      action: "Employee added",
      detail: `${rows[0].name} joined ${rows[0].department}`,
      type: "inventory",
    });
    await client.query("COMMIT");
    res.json(mapEmployee(rows[0]));
  } catch (e) {
    await client.query("ROLLBACK");
    console.error(e);
    res.status(500).json({ error: "Failed to add employee" });
  } finally {
    client.release();
  }
});

app.get("/api/employees/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
  const client = await pool.connect();
  try {
    const { rows: emRows } = await client.query("SELECT * FROM employees WHERE id = $1", [id]);
    if (!emRows.length) return res.status(404).json({ error: "Not found" });
    const { rows: payRows } = await client.query(
      `SELECT * FROM salary_payments WHERE employee_id = $1 ORDER BY created_at DESC, id DESC`,
      [id],
    );
    res.json({ employee: mapEmployee(emRows[0]), payments: payRows.map(mapSalaryPayment) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load employee" });
  } finally {
    client.release();
  }
});

app.post("/api/employees/:id/payments", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
  const amountRupees = parseCurrency(String(req.body?.amount ?? req.body?.amountRupees ?? "0"));
  const monthPeriod = String(req.body?.monthPeriod ?? "").trim();
  const paymentMethod = String(req.body?.paymentMethod ?? "Bank Transfer").trim() || "Bank Transfer";
  if (!amountRupees) return res.status(400).json({ error: "Invalid amount" });
  if (!/^\d{4}-\d{2}$/.test(monthPeriod)) return res.status(400).json({ error: "Invalid month (use YYYY-MM)" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows: er } = await client.query("SELECT name FROM employees WHERE id = $1 FOR UPDATE", [id]);
    if (!er.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Not found" });
    }
    const { rows } = await client.query(
      `INSERT INTO salary_payments (employee_id, amount_rupees, month_period, payment_method)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [id, amountRupees, monthPeriod, paymentMethod],
    );
    await insertActivity(client, {
      action: "Salary paid",
      detail: `${er[0].name} · ${monthPeriod} · ${formatCurrency(amountRupees)} (${paymentMethod})`,
      type: "payment",
    });
    await client.query("COMMIT");
    res.status(201).json(mapSalaryPayment(rows[0]));
  } catch (e) {
    await client.query("ROLLBACK");
    console.error(e);
    res.status(500).json({ error: "Failed to record payment" });
  } finally {
    client.release();
  }
});

app.patch("/api/employees/:id", async (req, res) => {
  const id = Number(req.params.id);
  const b = req.body ?? {};
  const salaryRupees = parseCurrency(String(b.salary ?? "0"));

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      `UPDATE employees SET
        name = COALESCE(NULLIF($1,''), name),
        role = COALESCE($2, role),
        department = COALESCE(NULLIF($3,''), department),
        salary_rupees = CASE WHEN $4 > 0 THEN $4 ELSE salary_rupees END,
        join_date = COALESCE(NULLIF($5,''), join_date),
        phone = COALESCE(NULLIF($6,''), phone),
        email = COALESCE(NULLIF($7,''), email),
        address = COALESCE(NULLIF($8,''), address)
       WHERE id = $9
       RETURNING *`,
      [
        String(b.name ?? "").trim(),
        b.role || null,
        String(b.department ?? "").trim(),
        salaryRupees,
        String(b.joinDate ?? "").trim(),
        String(b.phone ?? "").trim(),
        String(b.email ?? "").trim(),
        String(b.address ?? "").trim(),
        id,
      ],
    );
    if (!rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Not found" });
    }
    await insertActivity(client, {
      action: "Employee updated",
      detail: `${rows[0].name} details were updated`,
      type: "inventory",
    });
    await client.query("COMMIT");
    res.json(mapEmployee(rows[0]));
  } catch (e) {
    await client.query("ROLLBACK");
    console.error(e);
    res.status(500).json({ error: "Failed to update employee" });
  } finally {
    client.release();
  }
});

app.patch("/api/employees/:id/salary", async (req, res) => {
  const id = Number(req.params.id);
  const salaryRupees = parseCurrency(String(req.body?.salary ?? "0"));
  if (!salaryRupees) return res.status(400).json({ error: "Invalid salary" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      "UPDATE employees SET salary_rupees = $1 WHERE id = $2 RETURNING *",
      [salaryRupees, id],
    );
    if (!rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Not found" });
    }
    await insertActivity(client, {
      action: "Salary updated",
      detail: `Employee #${id} salary has been revised`,
      type: "payment",
    });
    await client.query("COMMIT");
    res.json(mapEmployee(rows[0]));
  } catch (e) {
    await client.query("ROLLBACK");
    console.error(e);
    res.status(500).json({ error: "Failed to update salary" });
  } finally {
    client.release();
  }
});

app.patch("/api/employees/:id/toggle-status", async (req, res) => {
  const id = Number(req.params.id);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows: cur } = await client.query("SELECT status FROM employees WHERE id = $1 FOR UPDATE", [id]);
    if (!cur.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Not found" });
    }
    const next = cur[0].status === "active" ? "on-leave" : "active";
    const { rows } = await client.query("UPDATE employees SET status = $1 WHERE id = $2 RETURNING *", [next, id]);
    await insertActivity(client, {
      action: "Employee status changed",
      detail: `Employee #${id} is now ${next}`,
      type: "inventory",
    });
    await client.query("COMMIT");
    res.json(mapEmployee(rows[0]));
  } catch (e) {
    await client.query("ROLLBACK");
    console.error(e);
    res.status(500).json({ error: "Failed to toggle status" });
  } finally {
    client.release();
  }
});

app.patch("/api/activities/:id/read", async (req, res) => {
  const id = Number(req.params.id);
  try {
    await pool.query("UPDATE activities SET read = true WHERE id = $1", [id]);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed" });
  }
});

app.patch("/api/activities/read-all", async (_req, res) => {
  try {
    await pool.query("UPDATE activities SET read = true");
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed" });
  }
});

app.get("/api/gold-schemes", async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT gs.*, c.name AS customer_name, c.phone AS customer_phone,
        (SELECT COUNT(*)::int FROM gold_scheme_payments p WHERE p.scheme_id = gs.id) AS installments_paid,
        (SELECT COALESCE(SUM(p.amount_rupees), 0)::bigint FROM gold_scheme_payments p WHERE p.scheme_id = gs.id) AS total_paid_rupees
      FROM gold_schemes gs
      JOIN customers c ON c.id = gs.customer_id
      ORDER BY gs.id DESC
    `);
    res.json(rows.map(mapGoldSchemeRow));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load gold schemes" });
  }
});

app.get("/api/gold-schemes/:id", async (req, res) => {
  const schemeId = Number(req.params.id);
  if (!Number.isFinite(schemeId) || schemeId < 1) {
    res.status(400).json({ error: "Invalid scheme" });
    return;
  }
  try {
    const { rows } = await pool.query(
      `SELECT gs.*, c.name AS customer_name, c.phone AS customer_phone,
        (SELECT COUNT(*)::int FROM gold_scheme_payments p WHERE p.scheme_id = gs.id) AS installments_paid,
        (SELECT COALESCE(SUM(p.amount_rupees), 0)::bigint FROM gold_scheme_payments p WHERE p.scheme_id = gs.id) AS total_paid_rupees
       FROM gold_schemes gs
       JOIN customers c ON c.id = gs.customer_id WHERE gs.id = $1`,
      [schemeId],
    );
    if (!rows.length) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const pay = await pool.query(
      `SELECT id, amount_rupees, paid_date, installment_no, notes
       FROM gold_scheme_payments WHERE scheme_id = $1 ORDER BY installment_no ASC`,
      [schemeId],
    );
    const scheme = mapGoldSchemeRow(rows[0]);
    scheme.payments = pay.rows.map((p) => ({
      id: p.id,
      amountRupees: Number(p.amount_rupees),
      amount: formatCurrency(Number(p.amount_rupees)),
      paidDate:
        p.paid_date instanceof Date
          ? p.paid_date.toISOString().slice(0, 10)
          : String(p.paid_date).slice(0, 10),
      installmentNo: p.installment_no,
      notes: p.notes ?? "",
    }));
    res.json(scheme);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load scheme" });
  }
});

app.post("/api/gold-schemes", async (req, res) => {
  const b = req.body ?? {};
  const customerId = Number(b.customerId);
  const monthly = parseCurrency(String(b.monthlyAmount ?? "0"));
  const tenure = Number(b.tenureMonths);
  const benefitType = String(b.benefitType ?? "one_month_free").trim();
  const bonus = Number(b.benefitBonusRupees ?? 0) || 0;
  const mkPct = Number(b.benefitMakingDiscountPct ?? 0) || 0;
  const startDate = b.startDate ? String(b.startDate).slice(0, 10) : new Date().toISOString().slice(0, 10);
  const notes = String(b.notes ?? "").trim();

  if (!Number.isFinite(customerId) || customerId < 1) {
    res.status(400).json({ error: "Invalid customer" });
    return;
  }
  if (!monthly || monthly < 1) {
    res.status(400).json({ error: "Monthly amount required" });
    return;
  }
  if (![6, 10, 12].includes(tenure)) {
    res.status(400).json({ error: "Tenure must be 6, 10, or 12 months" });
    return;
  }
  if (!["one_month_free", "bonus_rupees", "making_discount_pct"].includes(benefitType)) {
    res.status(400).json({ error: "Invalid benefit type" });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const cust = await client.query("SELECT id FROM customers WHERE id = $1", [customerId]);
    if (!cust.rows.length) {
      await client.query("ROLLBACK");
      res.status(400).json({ error: "Customer not found" });
      return;
    }
    const { rows } = await client.query(
      `INSERT INTO gold_schemes (
        customer_id, monthly_amount_rupees, tenure_months, benefit_type,
        benefit_bonus_rupees, benefit_making_discount_pct, start_date, status, notes
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,'active',$8)
      RETURNING *`,
      [customerId, monthly, tenure, benefitType, bonus, mkPct, startDate, notes],
    );
    const gs = rows[0];
    const { rows: joinRows } = await client.query(
      `SELECT gs.*, c.name AS customer_name, c.phone AS customer_phone,
        0::int AS installments_paid, 0::bigint AS total_paid_rupees
       FROM gold_schemes gs
       JOIN customers c ON c.id = gs.customer_id WHERE gs.id = $1`,
      [gs.id],
    );
    await insertActivity(client, {
      action: "Gold saving scheme enrolled",
      detail: `Customer #${customerId} · ${formatCurrency(monthly)}/mo × ${tenure} mo`,
      type: "inventory",
    });
    await client.query("COMMIT");
    res.json(mapGoldSchemeRow(joinRows[0]));
  } catch (e) {
    await client.query("ROLLBACK");
    console.error(e);
    res.status(500).json({ error: "Failed to create scheme" });
  } finally {
    client.release();
  }
});

app.post("/api/gold-schemes/:id/payments", async (req, res) => {
  const schemeId = Number(req.params.id);
  if (!Number.isFinite(schemeId) || schemeId < 1) {
    res.status(400).json({ error: "Invalid scheme" });
    return;
  }
  const b = req.body ?? {};
  const paidDate = b.paidDate ? String(b.paidDate).slice(0, 10) : new Date().toISOString().slice(0, 10);
  const note = String(b.notes ?? "").trim();

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows: sch } = await client.query(
      "SELECT * FROM gold_schemes WHERE id = $1 FOR UPDATE",
      [schemeId],
    );
    if (!sch.length) {
      await client.query("ROLLBACK");
      res.status(404).json({ error: "Scheme not found" });
      return;
    }
    if (sch[0].status !== "active") {
      await client.query("ROLLBACK");
      res.status(400).json({ error: "Scheme is not active" });
      return;
    }
    const tenure = Number(sch[0].tenure_months);
    const { rows: cnt } = await client.query(
      "SELECT COUNT(*)::int AS n FROM gold_scheme_payments WHERE scheme_id = $1",
      [schemeId],
    );
    const paidCount = cnt[0]?.n ?? 0;
    if (paidCount >= tenure) {
      await client.query("ROLLBACK");
      res.status(400).json({ error: "All installments already recorded" });
      return;
    }
    const defaultAmt = Number(sch[0].monthly_amount_rupees);
    const amount = b.amount !== undefined ? parseCurrency(String(b.amount)) : defaultAmt;
    if (!amount || amount < 1) {
      await client.query("ROLLBACK");
      res.status(400).json({ error: "Invalid amount" });
      return;
    }
    const nextNo = paidCount + 1;
    await client.query(
      `INSERT INTO gold_scheme_payments (scheme_id, amount_rupees, paid_date, installment_no, notes)
       VALUES ($1,$2,$3,$4,$5)`,
      [schemeId, amount, paidDate, nextNo, note],
    );
    const { rows: summary } = await client.query(
      `SELECT gs.*, c.name AS customer_name, c.phone AS customer_phone,
        (SELECT COUNT(*)::int FROM gold_scheme_payments p WHERE p.scheme_id = gs.id) AS installments_paid,
        (SELECT COALESCE(SUM(p.amount_rupees), 0)::bigint FROM gold_scheme_payments p WHERE p.scheme_id = gs.id) AS total_paid_rupees
       FROM gold_schemes gs
       JOIN customers c ON c.id = gs.customer_id WHERE gs.id = $1`,
      [schemeId],
    );
    await insertActivity(client, {
      action: "Gold scheme installment",
      detail: `Scheme #${schemeId} · installment ${nextNo}/${tenure} · ${formatCurrency(amount)}`,
      type: "inventory",
    });
    await client.query("COMMIT");
    res.json(mapGoldSchemeRow(summary[0]));
  } catch (e) {
    await client.query("ROLLBACK");
    if (e && e.code === "23505") {
      res.status(409).json({ error: "Duplicate installment number" });
      return;
    }
    console.error(e);
    res.status(500).json({ error: "Failed to record payment" });
  } finally {
    client.release();
  }
});

app.patch("/api/gold-schemes/:id/redeem", async (req, res) => {
  const schemeId = Number(req.params.id);
  if (!Number.isFinite(schemeId) || schemeId < 1) {
    res.status(400).json({ error: "Invalid scheme" });
    return;
  }
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows: sch } = await client.query(
      `SELECT gs.*, c.name AS customer_name, c.phone AS customer_phone,
        (SELECT COUNT(*)::int FROM gold_scheme_payments p WHERE p.scheme_id = gs.id) AS installments_paid,
        (SELECT COALESCE(SUM(p.amount_rupees), 0)::bigint FROM gold_scheme_payments p WHERE p.scheme_id = gs.id) AS total_paid_rupees
       FROM gold_schemes gs
       JOIN customers c ON c.id = gs.customer_id
       WHERE gs.id = $1 FOR UPDATE`,
      [schemeId],
    );
    if (!sch.length) {
      await client.query("ROLLBACK");
      res.status(404).json({ error: "Not found" });
      return;
    }
    const row = sch[0];
    if (row.status !== "active") {
      await client.query("ROLLBACK");
      res.status(400).json({ error: "Scheme is not active" });
      return;
    }
    const tenure = Number(row.tenure_months);
    const paid = Number(row.installments_paid ?? 0);
    if (paid < tenure) {
      await client.query("ROLLBACK");
      res.status(400).json({ error: "All installments must be paid before redemption" });
      return;
    }
    await client.query(
      `UPDATE gold_schemes SET status = 'redeemed', redeemed_at = NOW() WHERE id = $1 RETURNING *`,
      [schemeId],
    );
    const { rows: out } = await client.query(
      `SELECT gs.*, c.name AS customer_name, c.phone AS customer_phone,
        (SELECT COUNT(*)::int FROM gold_scheme_payments p WHERE p.scheme_id = gs.id) AS installments_paid,
        (SELECT COALESCE(SUM(p.amount_rupees), 0)::bigint FROM gold_scheme_payments p WHERE p.scheme_id = gs.id) AS total_paid_rupees
       FROM gold_schemes gs
       JOIN customers c ON c.id = gs.customer_id WHERE gs.id = $1`,
      [schemeId],
    );
    await insertActivity(client, {
      action: "Gold scheme redeemed",
      detail: `${row.customer_name} · scheme #${schemeId}`,
      type: "inventory",
    });
    await client.query("COMMIT");
    res.json(mapGoldSchemeRow(out[0]));
  } catch (e) {
    await client.query("ROLLBACK");
    console.error(e);
    res.status(500).json({ error: "Failed to redeem" });
  } finally {
    client.release();
  }
});

app.patch("/api/gold-schemes/:id/cancel", async (req, res) => {
  const schemeId = Number(req.params.id);
  if (!Number.isFinite(schemeId) || schemeId < 1) {
    res.status(400).json({ error: "Invalid scheme" });
    return;
  }
  try {
    const { rows } = await pool.query(
      `UPDATE gold_schemes SET status = 'cancelled' WHERE id = $1 AND status = 'active' RETURNING id`,
      [schemeId],
    );
    if (!rows.length) {
      res.status(400).json({ error: "Cannot cancel" });
      return;
    }
    await insertActivity(null, {
      action: "Gold scheme cancelled",
      detail: `Scheme #${schemeId}`,
      type: "inventory",
    });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed" });
  }
});

app.get("/api/cash-book/day/:date", async (req, res) => {
  const bookDate = decodeURIComponent(String(req.params.date)).slice(0, 10);
  if (!isValidBookDate(bookDate)) {
    res.status(400).json({ error: "Invalid date" });
    return;
  }
  try {
    const payload = await loadCashBookDayPayload(bookDate);
    res.json(payload);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load cash book" });
  }
});

app.patch("/api/cash-book/day/:date", async (req, res) => {
  const bookDate = decodeURIComponent(String(req.params.date)).slice(0, 10);
  if (!isValidBookDate(bookDate)) {
    res.status(400).json({ error: "Invalid date" });
    return;
  }
  const body = req.body ?? {};
  const notes = typeof body.notes === "string" ? body.notes : undefined;
  const isClosed = typeof body.isClosed === "boolean" ? body.isClosed : undefined;

  try {
    const { rows: existing } = await pool.query(`SELECT * FROM cash_book_days WHERE book_date = $1`, [bookDate]);
    if (!existing.length) {
      const n = notes !== undefined ? notes : "";
      const closed = isClosed === true;
      await pool.query(
        `INSERT INTO cash_book_days (book_date, opening_rupees, is_closed, notes) VALUES ($1, 0, $2, $3)`,
        [bookDate, closed, n],
      );
      if (closed) {
        await insertActivity(null, {
          action: "Cash book day closed",
          detail: bookDate,
          type: "payment",
        });
      }
      const payload = await loadCashBookDayPayload(bookDate);
      res.json(payload);
      return;
    }

    const row = existing[0];
    if (row.is_closed) {
      const keys = Object.keys(body).filter((k) => body[k] !== undefined);
      const onlyReopen = keys.length === 1 && keys[0] === "isClosed" && body.isClosed === false;
      if (!onlyReopen) {
        res
          .status(400)
          .json({ error: "Day is closed. Set isClosed to false to reopen before editing." });
        return;
      }
      await pool.query(`UPDATE cash_book_days SET is_closed = false WHERE id = $1`, [row.id]);
      await insertActivity(null, {
        action: "Cash book day reopened",
        detail: bookDate,
        type: "payment",
      });
      const payload = await loadCashBookDayPayload(bookDate);
      res.json(payload);
      return;
    }

    const updates = [];
    const vals = [];
    let i = 1;
    if (notes !== undefined) {
      updates.push(`notes = $${i++}`);
      vals.push(notes);
    }
    if (isClosed !== undefined) {
      updates.push(`is_closed = $${i++}`);
      vals.push(isClosed);
    }
    if (!updates.length) {
      const payload = await loadCashBookDayPayload(bookDate);
      res.json(payload);
      return;
    }
    vals.push(row.id);
    await pool.query(`UPDATE cash_book_days SET ${updates.join(", ")} WHERE id = $${i}`, vals);
    if (isClosed === true) {
      await insertActivity(null, {
        action: "Cash book day closed",
        detail: bookDate,
        type: "payment",
      });
    }
    const payload = await loadCashBookDayPayload(bookDate);
    res.json(payload);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to update cash book day" });
  }
});

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

ensureBaseSchema()
  .then(() => ensureOrdersContactColumns())
  .then(() => ensureSalaryPaymentsTable())
  .then(() => ensureKarigarJobsPriceColumn())
  .then(() => {
    const server = app.listen(PORT, () => {
      console.log(`API listening on http://localhost:${PORT}`);
    });
    server.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.error(
          `[api] Port ${PORT} is already in use. Another API is probably running (e.g. root "npm run dev"). Stop it, or set PORT=3002 in .env and restart.`,
        );
      } else {
        console.error(err);
      }
      process.exit(1);
    });
  })
  .catch((err) => {
    console.error("[api] Failed to ensure orders schema:", err);
    process.exit(1);
  });
