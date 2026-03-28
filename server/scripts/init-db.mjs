import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import pg from "pg";
import {
  inventorySeed,
  customerSeed,
  employeeSeed,
  orderSeed,
  karigarJobSeed,
  activitySeed,
  accountingSeed,
} from "../seed/seedData.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../../.env") });
dotenv.config({ path: path.join(__dirname, "../.env") });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is not set. Add it to .env in the project root.");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: DATABASE_URL });

function daysAgoDate(daysAgo) {
  const d = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
}

async function main() {
  const schemaPath = path.join(__dirname, "../schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf8");
  console.log("Applying schema...");
  await pool.query(schema);

  console.log("Seeding inventory...");
  for (const r of inventorySeed) {
    await pool.query(
      `INSERT INTO inventory_items (name, category, weight, purity, price_rupees, hallmark, hallmark_number, size, provider_name, storage_box_number, image, stock, high_selling)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [
        r.name,
        r.category,
        r.weight,
        r.purity,
        r.priceRupees,
        r.hallmark,
        r.hallmarkNumber,
        r.size,
        r.providerName,
        r.storageBoxNumber,
        r.image,
        r.stock,
        r.highSelling,
      ],
    );
  }

  console.log("Seeding customers...");
  for (const r of customerSeed) {
    await pool.query(
      `INSERT INTO customers (name, phone, email, address, total_purchases_rupees, visits, last_visit)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [r.name, r.phone, r.email, r.address, r.totalPurchasesRupees, r.visits, r.lastVisit],
    );
  }

  console.log("Seeding employees...");
  for (const r of employeeSeed) {
    await pool.query(
      `INSERT INTO employees (name, role, department, salary_rupees, status, join_date, phone, email, address)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [r.name, r.role, r.department, r.salaryRupees, r.status, r.joinDate, r.phone, r.email, r.address],
    );
  }

  console.log("Seeding salary payments...");
  const salaryPaymentSeed = [
    { name: "Vikram Singh", month: "2026-02", amount: 45000, method: "Bank Transfer" },
    { name: "Vikram Singh", month: "2026-01", amount: 45000, method: "Bank Transfer" },
    { name: "Pooja Mehta", month: "2026-02", amount: 42000, method: "UPI" },
  ];
  for (const s of salaryPaymentSeed) {
    const { rows } = await pool.query("SELECT id FROM employees WHERE name = $1", [s.name]);
    if (rows[0]) {
      await pool.query(
        `INSERT INTO salary_payments (employee_id, amount_rupees, month_period, payment_method) VALUES ($1,$2,$3,$4)`,
        [rows[0].id, s.amount, s.month, s.method],
      );
    }
  }

  console.log("Seeding orders...");
  for (const r of orderSeed) {
    const { rows: matchRows } = await pool.query(
      `SELECT phone, email, address FROM customers WHERE LOWER(TRIM(name)) = LOWER(TRIM($1)) LIMIT 1`,
      [r.customer],
    );
    const m = matchRows[0];
    await pool.query(
      `INSERT INTO orders (id, customer, customer_phone, customer_email, customer_address, payment_mode, items, total_rupees, status, order_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        r.id,
        r.customer,
        m?.phone ?? "",
        m?.email ?? "",
        m?.address ?? "",
        "card",
        r.items,
        r.totalRupees,
        r.status,
        daysAgoDate(r.daysAgo),
      ],
    );
  }

  console.log("Seeding karigar jobs...");
  for (const r of karigarJobSeed) {
    await pool.query(
      `INSERT INTO karigar_jobs (column_key, title, karigar, material, deadline, priority, customer_name, customer_mobile, instructions, size, reference_image, price_rupees)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [
        r.column,
        r.title,
        r.karigar,
        r.material,
        r.deadline,
        r.priority,
        r.customerName,
        r.customerMobile,
        r.instructions,
        r.size,
        r.referenceImage,
        r.priceRupees ?? 0,
      ],
    );
  }

  console.log("Seeding activities...");
  for (const r of activitySeed) {
    await pool.query(
      `INSERT INTO activities (action, detail, time_display, type, activity_date, read)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [r.action, r.detail, r.time, r.type, r.date, r.read],
    );
  }

  console.log("Seeding accounting...");
  for (const r of accountingSeed) {
    await pool.query(
      `INSERT INTO accounting_monthly (month_label, income_rupees, expense_rupees) VALUES ($1,$2,$3)`,
      [r.month, r.income, r.expense],
    );
  }

  console.log("Done.");
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
