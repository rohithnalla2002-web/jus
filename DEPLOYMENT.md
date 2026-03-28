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

- Use your **Render web service URL**, e.g. `https://jewelcraft-api.onrender.com`
- **No trailing slash**
- **Redeploy** the Netlify site after changing it (Vite bakes this in at **build** time)

---

## 2. Render (backend API) — env vars to set

In Render: your **Web Service** → **Environment** → add:

| Variable | Required | Notes |
|----------|----------|--------|
| `DATABASE_URL` | Yes | Use Render’s **Internal Database URL** for the Postgres instance (same region as the web service). |
| `JWT_SECRET` | Yes | Long random string (e.g. `openssl rand -hex 32`). |
| `ADMIN_USERNAME` | Yes | Admin login user for `/admin/login`. |
| `ADMIN_PASSWORD` | Yes | Strong password. |
| `NODE_ENV` | Recommended | `production` |
| `PORT` | No | Render sets this automatically; the app already uses `process.env.PORT`. |

You do **not** put `VITE_API_URL` on Render unless you also build the frontend there (this project builds the UI on Netlify).

**First deploy / empty DB:** from your machine (with `DATABASE_URL` pointing at that DB), run once:

```bash
npm run db:init --prefix server
```

(Uses `DATABASE_URL` from your local `.env`.)

---

## 3. Netlify (frontend) — env vars to set

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

### Render (Web Service — API)

Create a **Web Service** connected to this Git repo, then:

| Setting | Value |
|---------|--------|
| **Root directory** | `server` |
| **Runtime** | **Node** (not Bun) |
| **Build command** | `npm install` |
| **Start command** | `node src/index.js` *(recommended — avoids quote typos)* or `npm start` |

Add the environment variables from section 2.

**If deploy fails with** `unexpected EOF while looking for matching` **quotes:** your **Start Command** in the dashboard has a **wrong character** (often a backtick `` ` `` instead of a quote). Delete the field and re-type **exactly**:

```text
node src/index.js
```

(no smart quotes, no backticks).

Optional: use the repo’s **`render.yaml`** (Blueprint) so Render picks **Node 20**, `rootDir: server`, and the start command from Git — no manual typing.

**Bun vs Node:** If logs say “Using Bun”, the service runtime is wrong — switch the service to **Node** in Settings, or redeploy from the Blueprint.

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
