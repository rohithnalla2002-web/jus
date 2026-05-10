# Deploying: Netlify (frontend) + Render (API + Postgres)

There is **no single `.env` file** you upload to Netlify or Render. You **paste each variable** in each platform’s dashboard (or use their “Environment” / “Environment variables” UI).

---

## 1. Where the Render API URL goes (frontend)

The browser must know where your API lives. That value is **`VITE_API_URL`**.

| Platform | Where to set it |
|----------|------------------|
| **Netlify** | Site configuration → **Environment variables** → add `VITE_API_URL` |
| **Local `.env` (optional)** | Project root `.env`: `VITE_API_URL=https://your-service.onrender.com` (for `vite` without proxy) |

**Rules**

- Use your **Render web service URL**, e.g. `https://goldmind-erp-api.onrender.com`
- **No trailing slash**
- **Redeploy** the Netlify site after changing it (Vite bakes this in at **build** time)

---

## 2. Render (backend API) - env vars to set

In Render: your **Web Service** → **Environment** → add:

| Variable | Required | Notes |
|----------|----------|--------|
| `DATABASE_URL` | Yes | Use Render’s **Internal Database URL** for the Postgres instance (same region as the web service). |
| `JWT_SECRET` | Yes | Long random string (e.g. `openssl rand -hex 32`). |
| `ADMIN_USERNAME` | Yes | Branch admin user for `/admin/login` (seeded into `admin_users`). |
| `ADMIN_PASSWORD` | Yes | Strong password (pairs with `ADMIN_USERNAME`). |
| `ADMIN_SYNC_PASSWORD_FROM_ENV` | Optional | Set to `true` **once** after rotating `ADMIN_PASSWORD` if login still returns 401 — existing rows use `ON CONFLICT DO NOTHING` unless this sync is enabled. Remove or set `false` after login works if admins manage passwords in the app. |
| `SUPER_ADMIN_USERNAME` | Recommended | Super Admin login username (default `super`). Must match `VITE_LOGIN_HINT_SUPER_USERNAME` if you set that on the frontend for routing/hints. |
| `SUPER_ADMIN_PASSWORD` | Recommended | Super Admin password (change default before production). |
| `NODE_ENV` | Recommended | `production` |
| `PORT` | No | Render sets this automatically; the app already uses `process.env.PORT`. |

You do **not** put `VITE_API_URL` on Render unless you also build the frontend there (this project builds the UI on Netlify).

**First deploy / empty DB:** from your machine (with `DATABASE_URL` pointing at that DB), run once:

```bash
npm run db:init --prefix server
```

(Uses `DATABASE_URL` from your local `.env`.)

---

## 3. Netlify (frontend) - env vars to set

In Netlify: **Site settings** → **Environment variables** → add:

| Variable | When | Value example |
|----------|------|----------------|
| `VITE_API_URL` | **Build** | `https://your-api.onrender.com` |

Optional (already in `netlify.toml`): Node **20** for build.

---

## 4. Commands summary

### Netlify (dashboard)

| Setting | Value |
|---------|--------|
| **Build command** | `npm run build` |
| **Publish directory** | `dist` |
| **Base directory** | *(leave empty / repo root)* |

Or rely on **`netlify.toml`** in the repo (already configured).

**CLI (optional)**

```bash
npm install -g netlify-cli
netlify login
netlify init    # link site
netlify deploy --prod
```

---

### Render (Web Service - API)

Create a **Web Service** connected to this Git repo, then:

| Setting | Value |
|---------|--------|
| **Root directory** | `server` |
| **Runtime** | **Node** (not Bun) |
| **Build command** | `npm install` |
| **Start command** | `sh start.sh` *(use this - see below)* |

Add the environment variables from section 2.

### Render still shows `Running 'npm start`'` and crashes?

Your **Start Command** in the Render dashboard is **saved with a broken character** (a backtick `` ` ``). **Blueprint / `render.yaml` does not always overwrite** an existing service’s start command - you must fix it once in the UI.

1. Render Dashboard → your **Web Service** → **Settings**.
2. Find **Start Command**.
3. **Select all text in that box and delete it** (Cmd+A / Ctrl+A, Delete).
4. Type **only** this (plain ASCII, no smart quotes):

   ```text
   sh start.sh
   ```

5. **Save** → **Manual Deploy** → **Clear build cache & deploy** (or normal deploy).

The repo includes **`server/start.sh`**, which runs `node src/index.js`. Using `sh start.sh` avoids `npm` and stray quote bugs.

**If deploy fails with** `unexpected EOF while looking for matching` **quotes:** that is always a **corrupted Start Command** - repeat steps 2–5.

Optional: use the repo’s **`render.yaml`** (Blueprint) so Render picks **Node 20**, `rootDir: server`, and the start command from Git - no manual typing.

**Bun vs Node:** If logs say “Using Bun”, the service runtime is wrong - switch the service to **Node** in Settings, or redeploy from the Blueprint.

**CLI (optional)**

```bash
# Install Render CLI from https://render.com/docs/cli
render deploy
```

(Most people use the Render dashboard for the first setup.)

---

## 5. CORS

The API uses permissive CORS for browser calls from your Netlify domain. If you tighten CORS later, allow your Netlify URL (e.g. `https://yoursite.netlify.app`).

---

## 6. Local vs production

| File | Used by | Committed? |
|------|---------|------------|
| **`.env`** (project root) | Local `npm run dev`, `db:init` | **No** (gitignored) |
| **Netlify env** | Netlify builds only | Dashboard |
| **Render env** | Render API at runtime | Dashboard |

Keep **secrets** (DB password, `JWT_SECRET`, `ADMIN_PASSWORD`) only in Render / local `.env`, never in the repo.

---

## 7. Troubleshooting: `401` on `/api/admin/login`

The API returns **401** when the username/password do **not** match a row in Postgres table `admin_users` (wrong password, wrong username, or no row).

**Why env vars alone might not fix it**

- Variables must be on the **Web Service** that runs the Node API, not only on the Postgres add-on.
- After the first boot, the server runs `INSERT ... ON CONFLICT (username) DO NOTHING`. So if `admin` already exists with an **old** hash, changing `ADMIN_PASSWORD` in the dashboard does **not** update the database until you either:
  - set **`ADMIN_SYNC_PASSWORD_FROM_ENV=true`**, redeploy once (see env table above), then turn it off if you use in-app password changes, or
  - delete/update the row in `admin_users`, or reset the password via **Super Admin**.
- Log in with **exact** `ADMIN_USERNAME` (case-insensitive) and that user’s password — not the Super Admin password unless you are using the Super Admin flow (`SUPER_ADMIN_*` and username matching your configured super admin).
