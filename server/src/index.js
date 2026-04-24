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
    const { rows } = await client.query(
      `INSERT INTO inventory_items (name, category, weight, purity, price_rupees, hallmark, hallmark_number, size, provider_name, storage_box_number, image, stock, high_selling)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,false)
       RETURNING *`,
      [
        String(b.name ?? "").trim(),
        String(b.category ?? ""),
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

    const { rows } = await client.query(
      `UPDATE inventory_items SET
        name = $1, category = $2, weight = $3, purity = $4, price_rupees = $5,
        hallmark = $6, hallmark_number = $7, size = $8, provider_name = $9,
        storage_box_number = $10, image = $11, stock = $12, high_selling = $13
       WHERE id = $14 RETURNING *`,
      [
        String(b.name ?? cur.name).trim(),
        String(b.category ?? cur.category),
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
