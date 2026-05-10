/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  /** Mirror SUPER_ADMIN_USERNAME for local dev; must match server if you change super admin name. */
  readonly VITE_LOGIN_HINT_SUPER_USERNAME?: string;
  readonly VITE_LOGIN_HINT_SUPER_PASSWORD?: string;
  /** Mirror ADMIN_USERNAME / ADMIN_PASSWORD for local dev hints only. */
  readonly VITE_LOGIN_HINT_ADMIN_USERNAME?: string;
  readonly VITE_LOGIN_HINT_ADMIN_PASSWORD?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
