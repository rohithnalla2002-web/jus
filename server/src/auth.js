import crypto from "crypto";
import express from "express";
import jwt from "jsonwebtoken";

const BEARER = "Bearer ";

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
    return { username: payload.sub };
  } catch {
    return null;
  }
}

export function createAdminAuthRouter() {
  const router = express.Router();

  router.post("/login", (req, res) => {
    const expectedUser = process.env.ADMIN_USERNAME;
    const expectedPass = process.env.ADMIN_PASSWORD;
    if (!expectedUser || !expectedPass) {
      return res.status(500).json({ error: "Server misconfiguration: ADMIN_USERNAME and ADMIN_PASSWORD must be set in .env" });
    }

    const { username, password } = req.body ?? {};
    const u = String(username ?? "");
    const p = String(password ?? "");

    if (!timingSafeStringEqual(u, expectedUser) || !timingSafeStringEqual(p, expectedPass)) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    let secret;
    try {
      secret = getJwtSecret();
    } catch {
      return res.status(500).json({ error: "Server configuration error" });
    }

    const token = jwt.sign({ sub: expectedUser, role: "admin" }, secret, { expiresIn: "7d" });
    return res.json({ token, username: expectedUser });
  });

  router.get("/session", (req, res) => {
    const session = verifyAdminToken(req.headers.authorization);
    if (!session) return res.status(401).json({ error: "Unauthorized" });
    return res.json({ username: session.username });
  });

  return router;
}
