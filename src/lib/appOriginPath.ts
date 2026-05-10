/** Full URL for an in-app path (supports Vite `base`, e.g. deployed under a subpath). */
export function appOriginPath(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const baseRaw = import.meta.env.BASE_URL ?? "/";
  const base = baseRaw === "/" ? "" : baseRaw.replace(/\/+$/, "");
  return `${window.location.origin}${base}${normalized}`;
}
