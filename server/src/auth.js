import crypto from "crypto";
import express from "express";
import jwt from "jsonwebtoken";
import pool from "./db.js";

const BEARER = "Bearer ";
const PASSWORD_ALGORITHM = "pbkdf2";
const PASSWORD_ITERATIONS = 210000;
const PASSWORD_KEYLEN = 32;
const PASSWORD_DIGEST = "sha256";
const SUPER_ADMIN_USERNAME = process.env.SUPER_ADMIN_USERNAME || "super";
const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || "super@123";
const ADMIN_LOCK_THRESHOLD = 5;
const ADMIN_LOCK_MINUTES = 15;
const DEFAULT_ADMIN_PERMISSIONS = {
  dashboard: true,
  inventory: true,
  sales: true,
  karigar: true,
  customers: true,
  employees: true,
  accounting: true,
  reports: true,
  goldSchemes: true,
  oldGoldExchange: true,
};

/** Compare secrets without leaking length via timing (hashes are fixed length). */
function timingSafeStringEqual(a, b) {
  const ha = crypto.createHash("sha256").update(String(a ?? ""), "utf8").digest();
  const hb = crypto.createHash("sha256").update(String(b ?? ""), "utf8").digest();
  return crypto.timingSafeEqual(ha, hb);
}

export function getJwtSecret() {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 32) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("JWT_SECRET must be set and at least 32 characters in production");
    }
    console.warn("[auth] JWT_SECRET missing or short; using insecure dev fallback. Set JWT_SECRET in .env");
    return "dev-only-insecure-jwt-secret-min-32-chars!";
  }
  return s;
}

export function verifyAdminToken(authHeader) {
  if (!authHeader?.startsWith(BEARER)) return null;
  const token = authHeader.slice(BEARER.length).trim();
  if (!token) return null;
  try {
    const payload = jwt.verify(token, getJwtSecret());
    if (payload.role !== "admin" || typeof payload.sub !== "string") return null;
    return { id: Number(payload.adminId ?? 0) || null, username: payload.sub, name: payload.name ?? payload.sub };
  } catch {
    return null;
  }
}

export function verifySuperAdminToken(authHeader) {
  if (!authHeader?.startsWith(BEARER)) return null;
  const token = authHeader.slice(BEARER.length).trim();
  if (!token) return null;
  try {
    const payload = jwt.verify(token, getJwtSecret());
    if (payload.role !== "super_admin" || payload.sub !== SUPER_ADMIN_USERNAME) return null;
    return { username: payload.sub, name: "Super Admin" };
  } catch {
    return null;
  }
}

export async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = await new Promise((resolve, reject) => {
    crypto.pbkdf2(
      String(password ?? ""),
      salt,
      PASSWORD_ITERATIONS,
      PASSWORD_KEYLEN,
      PASSWORD_DIGEST,
      (err, key) => (err ? reject(err) : resolve(key.toString("hex"))),
    );
  });
  return `${PASSWORD_ALGORITHM}$${PASSWORD_ITERATIONS}$${salt}$${derived}`;
}

async function verifyPassword(password, storedHash) {
  const parts = String(storedHash ?? "").split("$");
  if (parts.length !== 4 || parts[0] !== PASSWORD_ALGORITHM) return false;
  const iterations = Number(parts[1]);
  const salt = parts[2];
  const expected = parts[3];
  if (!Number.isFinite(iterations) || !salt || !expected) return false;
  const actual = await new Promise((resolve, reject) => {
    crypto.pbkdf2(
      String(password ?? ""),
      salt,
      iterations,
      Buffer.from(expected, "hex").length,
      PASSWORD_DIGEST,
      (err, key) => (err ? reject(err) : resolve(key.toString("hex"))),
    );
  });
  return timingSafeStringEqual(actual, expected);
}

function mapAdminUser(row) {
  const permissions =
    row.permissions && typeof row.permissions === "object"
      ? { ...DEFAULT_ADMIN_PERMISSIONS, ...row.permissions }
      : { ...DEFAULT_ADMIN_PERMISSIONS };
  return {
    id: Number(row.id),
    username: row.username,
    name: row.name,
    email: row.email,
    phone: row.phone,
    roleLabel: row.role_label,
    status: row.status,
    permissions,
    lockedUntil: row.locked_until ? new Date(row.locked_until).toISOString() : null,
    forcePasswordReset: Boolean(row.force_password_reset),
    failedLoginCount: Number(row.failed_login_count ?? 0),
    lastFailedLoginAt: row.last_failed_login_at ? new Date(row.last_failed_login_at).toISOString() : null,
    lastLoginAt: row.last_login_at ? new Date(row.last_login_at).toISOString() : null,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
  };
}

function mapAuditLog(row) {
  return {
    id: Number(row.id),
    actor: row.actor,
    action: row.action,
    detail: row.detail,
    adminId: row.admin_id === null ? null : Number(row.admin_id),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
  };
}

function mapSupportTicket(row) {
  return {
    id: Number(row.id),
    title: row.title,
    description: row.description,
    requesterName: row.requester_name,
    requesterEmail: row.requester_email,
    priority: row.priority,
    status: row.status,
    assignedAdminId: row.assigned_admin_id === null ? null : Number(row.assigned_admin_id),
    assignedAdminName: row.assigned_admin_name ?? null,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
  };
}

function mapFaq(row) {
  return {
    id: Number(row.id),
    question: row.question,
    answer: row.answer,
    status: row.status,
    displayOrder: Number(row.display_order ?? 0),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
  };
}

async function insertAuditLog({ actor, action, detail, adminId = null }) {
  await pool.query(
    `INSERT INTO admin_audit_logs (actor, action, detail, admin_id)
     VALUES ($1, $2, $3, $4)`,
    [actor, action, detail, adminId],
  );
}

function isLocked(row) {
  if (!row?.locked_until) return false;
  return new Date(row.locked_until).getTime() > Date.now();
}

function normalizePermissions(input) {
  const source = input && typeof input === "object" && !Array.isArray(input) ? input : {};
  return Object.fromEntries(
    Object.keys(DEFAULT_ADMIN_PERMISSIONS).map((key) => [key, source[key] === undefined ? true : Boolean(source[key])]),
  );
}

async function registerFailedLogin(admin, username) {
  if (!admin) {
    await insertAuditLog({
      actor: "admin-login",
      action: "Unknown admin login failed",
      detail: `Login failed for ${username}`,
    });
    return;
  }

  const nextFailed = Number(admin.failed_login_count ?? 0) + 1;
  const lockNow = nextFailed >= ADMIN_LOCK_THRESHOLD;
  const lockUntil = lockNow ? `NOW() + INTERVAL '${ADMIN_LOCK_MINUTES} minutes'` : "locked_until";
  await pool.query(
    `UPDATE admin_users SET
      failed_login_count = $1,
      last_failed_login_at = NOW(),
      locked_until = ${lockUntil},
      updated_at = NOW()
     WHERE id = $2`,
    [nextFailed, admin.id],
  );
  await insertAuditLog({
    actor: "admin-login",
    action: lockNow ? "Admin auto-locked" : "Admin login failed",
    detail: lockNow
      ? `${admin.username} reached ${nextFailed} failed attempts and was locked for ${ADMIN_LOCK_MINUTES} minutes`
      : `${admin.username} failed login attempt ${nextFailed}/${ADMIN_LOCK_THRESHOLD}`,
    adminId: admin.id,
  });
}

function requireSuperAdmin(req, res, next) {
  const session = verifySuperAdminToken(req.headers.authorization);
  if (!session) return res.status(401).json({ error: "Unauthorized" });
  req.superAdmin = session;
  return next();
}

export function createAdminAuthRouter() {
  const router = express.Router();

  router.post("/login", async (req, res) => {
    const { username, password } = req.body ?? {};
    const u = String(username ?? "");
    const p = String(password ?? "");

    try {
      /** Static hosts / old bundles sometimes POST super-admin credentials here; accept and issue the same JWT as /api/super-admin/login. */
      if (timingSafeStringEqual(u, SUPER_ADMIN_USERNAME) && timingSafeStringEqual(p, SUPER_ADMIN_PASSWORD)) {
        let secret;
        try {
          secret = getJwtSecret();
        } catch {
          return res.status(500).json({ error: "Server configuration error" });
        }
        const token = jwt.sign(
          { sub: SUPER_ADMIN_USERNAME, role: "super_admin", name: "Super Admin" },
          secret,
          { expiresIn: "7d" },
        );
        return res.json({
          token,
          username: SUPER_ADMIN_USERNAME,
          name: "Super Admin",
          loginAs: "super_admin",
        });
      }

      const { rows } = await pool.query("SELECT * FROM admin_users WHERE LOWER(username) = LOWER($1) LIMIT 1", [u]);
      const admin = rows[0];
      if (!admin) {
        await registerFailedLogin(null, u);
        return res.status(401).json({ error: "Invalid username or password" });
      }
      if (admin.status !== "active") {
        await insertAuditLog({
          actor: "admin-login",
          action: "Inactive admin login blocked",
          detail: `${admin.username} attempted to log in while inactive`,
          adminId: admin.id,
        });
        return res.status(403).json({ error: "This admin account is inactive" });
      }
      if (isLocked(admin)) {
        await insertAuditLog({
          actor: "admin-login",
          action: "Locked admin login blocked",
          detail: `${admin.username} attempted to log in while locked`,
          adminId: admin.id,
        });
        return res.status(423).json({ error: "This admin account is temporarily locked" });
      }
      if (admin.force_password_reset) {
        return res.status(403).json({ error: "Password reset required. Contact Super Admin." });
      }

      const valid = await verifyPassword(p, admin.password_hash);
      if (!valid) {
        await registerFailedLogin(admin, u);
        return res.status(401).json({ error: "Invalid username or password" });
      }

      let secret;
      try {
        secret = getJwtSecret();
      } catch {
        return res.status(500).json({ error: "Server configuration error" });
      }

      await pool.query(
        "UPDATE admin_users SET last_login_at = NOW(), failed_login_count = 0, last_failed_login_at = NULL, locked_until = NULL, updated_at = NOW() WHERE id = $1",
        [admin.id],
      );
      await insertAuditLog({
        actor: "admin-login",
        action: "Admin login success",
        detail: `${admin.username} signed in`,
        adminId: admin.id,
      });
      const token = jwt.sign(
        { sub: admin.username, role: "admin", adminId: Number(admin.id), name: admin.name, permissions: admin.permissions },
        secret,
        { expiresIn: "7d" },
      );
      return res.json({ token, username: admin.username, name: admin.name });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "Login failed" });
    }
  });

  router.get("/session", (req, res) => {
    const session = verifyAdminToken(req.headers.authorization);
    if (!session) return res.status(401).json({ error: "Unauthorized" });
    return res.json({ username: session.username, name: session.name });
  });

  return router;
}

export function createSuperAdminRouter() {
  const router = express.Router();

  router.post("/login", (req, res) => {
    const { username, password } = req.body ?? {};
    const u = String(username ?? "");
    const p = String(password ?? "");

    if (!timingSafeStringEqual(u, SUPER_ADMIN_USERNAME) || !timingSafeStringEqual(p, SUPER_ADMIN_PASSWORD)) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    let secret;
    try {
      secret = getJwtSecret();
    } catch {
      return res.status(500).json({ error: "Server configuration error" });
    }

    const token = jwt.sign({ sub: SUPER_ADMIN_USERNAME, role: "super_admin", name: "Super Admin" }, secret, { expiresIn: "7d" });
    return res.json({ token, username: SUPER_ADMIN_USERNAME, name: "Super Admin" });
  });

  router.get("/session", (req, res) => {
    const session = verifySuperAdminToken(req.headers.authorization);
    if (!session) return res.status(401).json({ error: "Unauthorized" });
    return res.json({ username: session.username, name: session.name });
  });

  router.use(requireSuperAdmin);

  router.get("/overview", async (_req, res) => {
    try {
      const [counts, recentAdmins, logs] = await Promise.all([
        pool.query(`
          SELECT
            COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE status = 'active')::int AS active,
            COUNT(*) FILTER (WHERE status <> 'active')::int AS inactive,
            COUNT(*) FILTER (WHERE last_login_at IS NOT NULL)::int AS logged_in,
            COUNT(*) FILTER (WHERE locked_until > NOW())::int AS locked,
            COUNT(*) FILTER (WHERE force_password_reset = true)::int AS force_reset
          FROM admin_users
        `),
        pool.query("SELECT * FROM admin_users ORDER BY COALESCE(last_login_at, created_at) DESC LIMIT 5"),
        pool.query("SELECT * FROM admin_audit_logs ORDER BY created_at DESC, id DESC LIMIT 8"),
      ]);
      res.json({
        stats: {
          totalAdmins: counts.rows[0]?.total ?? 0,
          activeAdmins: counts.rows[0]?.active ?? 0,
          inactiveAdmins: counts.rows[0]?.inactive ?? 0,
          adminsWithLogins: counts.rows[0]?.logged_in ?? 0,
          lockedAdmins: counts.rows[0]?.locked ?? 0,
          forceResetAdmins: counts.rows[0]?.force_reset ?? 0,
        },
        recentAdmins: recentAdmins.rows.map(mapAdminUser),
        recentAuditLogs: logs.rows.map(mapAuditLog),
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to load overview" });
    }
  });

  router.get("/admins", async (_req, res) => {
    try {
      const { rows } = await pool.query("SELECT * FROM admin_users ORDER BY created_at DESC, id DESC");
      res.json(rows.map(mapAdminUser));
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to load admins" });
    }
  });

  router.get("/admins/:id", async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id < 1) return res.status(400).json({ error: "Invalid admin id" });
    try {
      const [admin, logs] = await Promise.all([
        pool.query("SELECT * FROM admin_users WHERE id = $1", [id]),
        pool.query("SELECT * FROM admin_audit_logs WHERE admin_id = $1 ORDER BY created_at DESC, id DESC LIMIT 30", [id]),
      ]);
      if (!admin.rows.length) return res.status(404).json({ error: "Admin not found" });
      res.json({ admin: mapAdminUser(admin.rows[0]), auditLogs: logs.rows.map(mapAuditLog) });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to load admin" });
    }
  });

  router.post("/admins", async (req, res) => {
    const body = req.body ?? {};
    const username = String(body.username ?? "").trim();
    const password = String(body.password ?? "").trim();
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    const roleLabel = String(body.roleLabel ?? "Branch Admin").trim() || "Branch Admin";
    const permissions = normalizePermissions(body.permissions);

    if (!username || !password || !name) return res.status(400).json({ error: "Username, name and password are required" });
    if (password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });

    try {
      const passwordHash = await hashPassword(password);
      const { rows } = await pool.query(
        `INSERT INTO admin_users (username, password_hash, name, email, phone, role_label, status, permissions)
         VALUES ($1, $2, $3, $4, $5, $6, 'active', $7::jsonb)
         RETURNING *`,
        [username, passwordHash, name, email, phone, roleLabel, JSON.stringify(permissions)],
      );
      await insertAuditLog({
        actor: req.superAdmin.username,
        action: "Admin created",
        detail: `${name} (${username}) was added`,
        adminId: rows[0].id,
      });
      res.status(201).json(mapAdminUser(rows[0]));
    } catch (e) {
      if (e?.code === "23505") return res.status(409).json({ error: "Username already exists" });
      console.error(e);
      res.status(500).json({ error: "Failed to create admin" });
    }
  });

  router.patch("/admins/:id", async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id < 1) return res.status(400).json({ error: "Invalid admin id" });
    const body = req.body ?? {};
    const status = body.status === "inactive" ? "inactive" : body.status === "active" ? "active" : undefined;

    try {
      const { rows } = await pool.query(
        `UPDATE admin_users SET
          name = COALESCE(NULLIF($1, ''), name),
          email = COALESCE($2, email),
          phone = COALESCE($3, phone),
          role_label = COALESCE(NULLIF($4, ''), role_label),
          status = COALESCE($5, status),
          permissions = COALESCE($6::jsonb, permissions),
          updated_at = NOW()
         WHERE id = $7
         RETURNING *`,
        [
          String(body.name ?? "").trim(),
          body.email === undefined ? null : String(body.email ?? "").trim(),
          body.phone === undefined ? null : String(body.phone ?? "").trim(),
          String(body.roleLabel ?? "").trim(),
          status ?? null,
          body.permissions === undefined ? null : JSON.stringify(normalizePermissions(body.permissions)),
          id,
        ],
      );
      if (!rows.length) return res.status(404).json({ error: "Admin not found" });
      await insertAuditLog({
        actor: req.superAdmin.username,
        action: "Admin updated",
        detail: `${rows[0].name} details were updated`,
        adminId: id,
      });
      res.json(mapAdminUser(rows[0]));
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to update admin" });
    }
  });

  router.patch("/admins/:id/password", async (req, res) => {
    const id = Number(req.params.id);
    const password = String(req.body?.password ?? "").trim();
    if (!Number.isFinite(id) || id < 1) return res.status(400).json({ error: "Invalid admin id" });
    if (password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });

    try {
      const passwordHash = await hashPassword(password);
      const { rows } = await pool.query(
        "UPDATE admin_users SET password_hash = $1, force_password_reset = false, failed_login_count = 0, locked_until = NULL, updated_at = NOW() WHERE id = $2 RETURNING *",
        [passwordHash, id],
      );
      if (!rows.length) return res.status(404).json({ error: "Admin not found" });
      await insertAuditLog({
        actor: req.superAdmin.username,
        action: "Password reset",
        detail: `${rows[0].name} password was reset`,
        adminId: id,
      });
      res.json(mapAdminUser(rows[0]));
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to reset password" });
    }
  });

  router.delete("/admins/:id", async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id < 1) return res.status(400).json({ error: "Invalid admin id" });
    try {
      const { rows } = await pool.query(
        "UPDATE admin_users SET status = 'inactive', updated_at = NOW() WHERE id = $1 RETURNING *",
        [id],
      );
      if (!rows.length) return res.status(404).json({ error: "Admin not found" });
      await insertAuditLog({
        actor: req.superAdmin.username,
        action: "Admin deactivated",
        detail: `${rows[0].name} was deactivated`,
        adminId: id,
      });
      res.json(mapAdminUser(rows[0]));
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to deactivate admin" });
    }
  });

  router.patch("/admins/:id/permissions", async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id < 1) return res.status(400).json({ error: "Invalid admin id" });
    try {
      const permissions = normalizePermissions(req.body?.permissions);
      const { rows } = await pool.query(
        "UPDATE admin_users SET permissions = $1::jsonb, updated_at = NOW() WHERE id = $2 RETURNING *",
        [JSON.stringify(permissions), id],
      );
      if (!rows.length) return res.status(404).json({ error: "Admin not found" });
      await insertAuditLog({
        actor: req.superAdmin.username,
        action: "Permissions updated",
        detail: `${rows[0].name} permissions were updated`,
        adminId: id,
      });
      res.json(mapAdminUser(rows[0]));
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to update permissions" });
    }
  });

  router.patch("/admins/:id/lock", async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id < 1) return res.status(400).json({ error: "Invalid admin id" });
    const locked = Boolean(req.body?.locked);
    const minutes = Math.max(1, Math.min(1440, Number(req.body?.minutes ?? ADMIN_LOCK_MINUTES) || ADMIN_LOCK_MINUTES));
    try {
      const { rows } = locked
        ? await pool.query(
            `UPDATE admin_users SET locked_until = NOW() + ($1::text || ' minutes')::interval, updated_at = NOW()
             WHERE id = $2 RETURNING *`,
            [String(minutes), id],
          )
        : await pool.query(
            "UPDATE admin_users SET locked_until = NULL, failed_login_count = 0, updated_at = NOW() WHERE id = $1 RETURNING *",
            [id],
          );
      if (!rows.length) return res.status(404).json({ error: "Admin not found" });
      await insertAuditLog({
        actor: req.superAdmin.username,
        action: locked ? "Admin locked" : "Admin unlocked",
        detail: locked ? `${rows[0].name} was locked for ${minutes} minutes` : `${rows[0].name} was unlocked`,
        adminId: id,
      });
      res.json(mapAdminUser(rows[0]));
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to update lock state" });
    }
  });

  router.patch("/admins/:id/force-reset", async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id < 1) return res.status(400).json({ error: "Invalid admin id" });
    const required = Boolean(req.body?.forcePasswordReset);
    try {
      const { rows } = await pool.query(
        "UPDATE admin_users SET force_password_reset = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
        [required, id],
      );
      if (!rows.length) return res.status(404).json({ error: "Admin not found" });
      await insertAuditLog({
        actor: req.superAdmin.username,
        action: required ? "Password reset required" : "Password reset requirement cleared",
        detail: required ? `${rows[0].name} must reset password before access` : `${rows[0].name} reset requirement was cleared`,
        adminId: id,
      });
      res.json(mapAdminUser(rows[0]));
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to update password reset requirement" });
    }
  });

  router.get("/business-overview", async (_req, res) => {
    try {
      const [
        orders,
        inventory,
        customers,
        employees,
        schemes,
        activities,
      ] = await Promise.all([
        pool.query(`
          SELECT
            COUNT(*)::int AS total_orders,
            COUNT(*) FILTER (WHERE status <> 'delivered')::int AS pending_orders,
            COUNT(*) FILTER (WHERE status = 'delivered')::int AS delivered_orders,
            COALESCE(SUM(total_rupees), 0)::bigint AS total_revenue,
            COALESCE(SUM(total_rupees) FILTER (WHERE order_date >= CURRENT_DATE - INTERVAL '30 days'), 0)::bigint AS revenue_30d
          FROM orders
        `),
        pool.query(`
          SELECT
            COUNT(*)::int AS total_items,
            COUNT(*) FILTER (WHERE stock <= 5)::int AS low_stock_items,
            COALESCE(SUM(price_rupees * stock), 0)::bigint AS inventory_value,
            COALESCE(SUM(stock), 0)::bigint AS total_stock
          FROM inventory_items
        `),
        pool.query("SELECT COUNT(*)::int AS total_customers, COALESCE(SUM(total_purchases_rupees), 0)::bigint AS customer_value FROM customers"),
        pool.query("SELECT COUNT(*)::int AS total_employees, COUNT(*) FILTER (WHERE status = 'active')::int AS active_employees FROM employees"),
        pool.query("SELECT COUNT(*)::int AS total_schemes, COUNT(*) FILTER (WHERE status = 'active')::int AS active_schemes FROM gold_schemes"),
        pool.query("SELECT action, detail, created_at FROM activities ORDER BY created_at DESC LIMIT 6"),
      ]);

      res.json({
        sales: {
          totalOrders: orders.rows[0]?.total_orders ?? 0,
          pendingOrders: orders.rows[0]?.pending_orders ?? 0,
          deliveredOrders: orders.rows[0]?.delivered_orders ?? 0,
          totalRevenueRupees: Number(orders.rows[0]?.total_revenue ?? 0),
          revenue30dRupees: Number(orders.rows[0]?.revenue_30d ?? 0),
        },
        inventory: {
          totalItems: inventory.rows[0]?.total_items ?? 0,
          lowStockItems: inventory.rows[0]?.low_stock_items ?? 0,
          inventoryValueRupees: Number(inventory.rows[0]?.inventory_value ?? 0),
          totalStock: Number(inventory.rows[0]?.total_stock ?? 0),
        },
        people: {
          totalCustomers: customers.rows[0]?.total_customers ?? 0,
          customerValueRupees: Number(customers.rows[0]?.customer_value ?? 0),
          totalEmployees: employees.rows[0]?.total_employees ?? 0,
          activeEmployees: employees.rows[0]?.active_employees ?? 0,
        },
        schemes: {
          totalSchemes: schemes.rows[0]?.total_schemes ?? 0,
          activeSchemes: schemes.rows[0]?.active_schemes ?? 0,
        },
        recentActivities: activities.rows.map((row) => ({
          action: row.action,
          detail: row.detail,
          createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
        })),
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to load business overview" });
    }
  });

  router.get("/system-health", async (_req, res) => {
    const startedAt = Date.now();
    try {
      const [
        dbNow,
        inventoryCount,
        customerCount,
        orderCount,
        adminCount,
        auditCount,
        latestActivity,
      ] = await Promise.all([
        pool.query("SELECT NOW() AS now"),
        pool.query("SELECT COUNT(*)::int AS count FROM inventory_items"),
        pool.query("SELECT COUNT(*)::int AS count FROM customers"),
        pool.query("SELECT COUNT(*)::int AS count FROM orders"),
        pool.query("SELECT COUNT(*)::int AS count FROM admin_users"),
        pool.query("SELECT COUNT(*)::int AS count FROM admin_audit_logs"),
        pool.query("SELECT created_at FROM activities ORDER BY created_at DESC LIMIT 1"),
      ]);
      res.json({
        api: {
          status: "online",
          checkedAt: new Date().toISOString(),
          responseMs: Date.now() - startedAt,
        },
        database: {
          status: "connected",
          serverTime: dbNow.rows[0]?.now ? new Date(dbNow.rows[0].now).toISOString() : null,
        },
        tableCounts: {
          inventoryItems: inventoryCount.rows[0]?.count ?? 0,
          customers: customerCount.rows[0]?.count ?? 0,
          orders: orderCount.rows[0]?.count ?? 0,
          admins: adminCount.rows[0]?.count ?? 0,
          auditLogs: auditCount.rows[0]?.count ?? 0,
        },
        latestActivityAt: latestActivity.rows[0]?.created_at
          ? new Date(latestActivity.rows[0].created_at).toISOString()
          : null,
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({
        api: { status: "degraded", checkedAt: new Date().toISOString(), responseMs: Date.now() - startedAt },
        database: { status: "error" },
        error: "Failed to load system health",
      });
    }
  });

  router.get("/tickets", async (req, res) => {
    const status = String(req.query.status ?? "").trim();
    const statusFilter = ["open", "in_progress", "resolved", "closed"].includes(status) ? status : null;
    try {
      const query = statusFilter
        ? {
            text: `
              SELECT t.*, a.name AS assigned_admin_name
              FROM support_tickets t
              LEFT JOIN admin_users a ON a.id = t.assigned_admin_id
              WHERE t.status = $1
              ORDER BY t.created_at DESC, t.id DESC
            `,
            values: [statusFilter],
          }
        : {
            text: `
              SELECT t.*, a.name AS assigned_admin_name
              FROM support_tickets t
              LEFT JOIN admin_users a ON a.id = t.assigned_admin_id
              ORDER BY t.created_at DESC, t.id DESC
            `,
            values: [],
          };
      const { rows } = await pool.query(query);
      res.json(rows.map(mapSupportTicket));
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to load tickets" });
    }
  });

  router.post("/tickets", async (req, res) => {
    const body = req.body ?? {};
    const title = String(body.title ?? "").trim();
    const description = String(body.description ?? "").trim();
    const requesterName = String(body.requesterName ?? "").trim();
    const requesterEmail = String(body.requesterEmail ?? "").trim();
    const priority = ["low", "medium", "high", "urgent"].includes(body.priority) ? body.priority : "medium";
    const assignedAdminId = Number(body.assignedAdminId);
    const assignee = Number.isFinite(assignedAdminId) && assignedAdminId > 0 ? assignedAdminId : null;

    if (!title) return res.status(400).json({ error: "Ticket title is required" });

    try {
      const { rows } = await pool.query(
        `INSERT INTO support_tickets (title, description, requester_name, requester_email, priority, status, assigned_admin_id)
         VALUES ($1, $2, $3, $4, $5, 'open', $6)
         RETURNING *`,
        [title, description, requesterName, requesterEmail, priority, assignee],
      );
      await insertAuditLog({
        actor: req.superAdmin.username,
        action: "Ticket created",
        detail: `${title} was opened`,
      });
      const joined = await pool.query(
        `SELECT t.*, a.name AS assigned_admin_name
         FROM support_tickets t
         LEFT JOIN admin_users a ON a.id = t.assigned_admin_id
         WHERE t.id = $1`,
        [rows[0].id],
      );
      res.status(201).json(mapSupportTicket(joined.rows[0]));
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to create ticket" });
    }
  });

  router.patch("/tickets/:id", async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id < 1) return res.status(400).json({ error: "Invalid ticket id" });
    const body = req.body ?? {};
    const status = ["open", "in_progress", "resolved", "closed"].includes(body.status) ? body.status : undefined;
    const priority = ["low", "medium", "high", "urgent"].includes(body.priority) ? body.priority : undefined;
    const assignedAdminId = body.assignedAdminId === null ? null : Number(body.assignedAdminId);
    const assignee =
      body.assignedAdminId === undefined
        ? undefined
        : Number.isFinite(assignedAdminId) && assignedAdminId > 0
          ? assignedAdminId
          : null;

    try {
      const { rows } = await pool.query(
        `UPDATE support_tickets SET
          title = COALESCE(NULLIF($1, ''), title),
          description = COALESCE($2, description),
          requester_name = COALESCE($3, requester_name),
          requester_email = COALESCE($4, requester_email),
          priority = COALESCE($5, priority),
          status = COALESCE($6, status),
          assigned_admin_id = CASE WHEN $7::boolean THEN $8 ELSE assigned_admin_id END,
          updated_at = NOW()
         WHERE id = $9
         RETURNING *`,
        [
          String(body.title ?? "").trim(),
          body.description === undefined ? null : String(body.description ?? "").trim(),
          body.requesterName === undefined ? null : String(body.requesterName ?? "").trim(),
          body.requesterEmail === undefined ? null : String(body.requesterEmail ?? "").trim(),
          priority ?? null,
          status ?? null,
          assignee !== undefined,
          assignee,
          id,
        ],
      );
      if (!rows.length) return res.status(404).json({ error: "Ticket not found" });
      await insertAuditLog({
        actor: req.superAdmin.username,
        action: "Ticket updated",
        detail: `${rows[0].title} is now ${rows[0].status}`,
      });
      const joined = await pool.query(
        `SELECT t.*, a.name AS assigned_admin_name
         FROM support_tickets t
         LEFT JOIN admin_users a ON a.id = t.assigned_admin_id
         WHERE t.id = $1`,
        [id],
      );
      res.json(mapSupportTicket(joined.rows[0]));
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to update ticket" });
    }
  });

  router.get("/faqs", async (_req, res) => {
    try {
      const { rows } = await pool.query("SELECT * FROM faqs ORDER BY display_order ASC, id ASC");
      res.json(rows.map(mapFaq));
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to load FAQs" });
    }
  });

  router.post("/faqs", async (req, res) => {
    const body = req.body ?? {};
    const question = String(body.question ?? "").trim();
    const answer = String(body.answer ?? "").trim();
    const status = body.status === "draft" ? "draft" : "published";
    const displayOrder = Number(body.displayOrder ?? 0) || 0;
    if (!question || !answer) return res.status(400).json({ error: "Question and answer are required" });

    try {
      const { rows } = await pool.query(
        `INSERT INTO faqs (question, answer, status, display_order)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [question, answer, status, displayOrder],
      );
      await insertAuditLog({
        actor: req.superAdmin.username,
        action: "FAQ created",
        detail: question,
      });
      res.status(201).json(mapFaq(rows[0]));
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to create FAQ" });
    }
  });

  router.patch("/faqs/:id", async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id < 1) return res.status(400).json({ error: "Invalid FAQ id" });
    const body = req.body ?? {};
    const status = body.status === "draft" ? "draft" : body.status === "published" ? "published" : undefined;
    const displayOrder = body.displayOrder === undefined ? undefined : Number(body.displayOrder) || 0;

    try {
      const { rows } = await pool.query(
        `UPDATE faqs SET
          question = COALESCE(NULLIF($1, ''), question),
          answer = COALESCE(NULLIF($2, ''), answer),
          status = COALESCE($3, status),
          display_order = COALESCE($4, display_order),
          updated_at = NOW()
         WHERE id = $5
         RETURNING *`,
        [
          String(body.question ?? "").trim(),
          String(body.answer ?? "").trim(),
          status ?? null,
          displayOrder ?? null,
          id,
        ],
      );
      if (!rows.length) return res.status(404).json({ error: "FAQ not found" });
      await insertAuditLog({
        actor: req.superAdmin.username,
        action: "FAQ updated",
        detail: rows[0].question,
      });
      res.json(mapFaq(rows[0]));
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to update FAQ" });
    }
  });

  router.delete("/faqs/:id", async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id < 1) return res.status(400).json({ error: "Invalid FAQ id" });
    try {
      const { rows } = await pool.query("DELETE FROM faqs WHERE id = $1 RETURNING question", [id]);
      if (!rows.length) return res.status(404).json({ error: "FAQ not found" });
      await insertAuditLog({
        actor: req.superAdmin.username,
        action: "FAQ deleted",
        detail: rows[0].question,
      });
      res.json({ ok: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to delete FAQ" });
    }
  });

  router.get("/audit-logs", async (req, res) => {
    const adminId = req.query.adminId ? Number(req.query.adminId) : null;
    try {
      const query = adminId
        ? {
            text: "SELECT * FROM admin_audit_logs WHERE admin_id = $1 ORDER BY created_at DESC, id DESC LIMIT 100",
            values: [adminId],
          }
        : {
            text: "SELECT * FROM admin_audit_logs ORDER BY created_at DESC, id DESC LIMIT 100",
            values: [],
          };
      const { rows } = await pool.query(query);
      res.json(rows.map(mapAuditLog));
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to load audit logs" });
    }
  });

  return router;
}
