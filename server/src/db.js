import pg from "pg";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../../.env") });
dotenv.config({ path: path.join(__dirname, "../.env") });

const url = process.env.DATABASE_URL || "";
const isLocal =
  /localhost|127\.0\.0\.1/.test(url) || url.startsWith("postgresql:///");

/** Render / cloud Postgres expects TLS; without it connections often reset (ECONNRESET). */
const pool = new pg.Pool({
  connectionString: url,
  ssl: isLocal ? false : { rejectUnauthorized: false },
});

export default pool;
