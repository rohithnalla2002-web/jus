import { formatCurrency } from "@/lib/demo";

const jsonHeaders = { "Content-Type": "application/json" };

/** Use VITE_API_URL when the UI is served without a dev proxy (e.g. static hosting + separate API). */
function normalizeApiOrigin(): string {
  const raw = String(import.meta.env.VITE_API_URL ?? "").trim();
  return raw.replace(/\/+$/, "");
}

const apiUrl = (path: string) => {
  const base = normalizeApiOrigin();
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
};

async function parseError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    if (body && typeof body.error === "string") return body.error;
  } catch {
    /* ignore */
  }
  return res.statusText || `HTTP ${res.status}`;
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(apiUrl(path));
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<T>;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(apiUrl(path), { method: "POST", headers: jsonHeaders, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<T>;
}

export async function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(apiUrl(path), {
    method: "PATCH",
    headers: jsonHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<T>;
}

export async function apiDelete(path: string): Promise<void> {
  const res = await fetch(apiUrl(path), { method: "DELETE" });
  if (!res.ok) throw new Error(await parseError(res));
}

export type BootstrapPayload = {
  inventory: InventoryItem[];
  customerList: Customer[];
  employeeList: Employee[];
  salesOrders: Order[];
  karigarBoard: KarigarBoard;
  recentActivities: RecentActivityItem[];
  notifications: NotificationDto[];
};

export type NotificationDto = { id: number; title: string; detail: string; time: string; read: boolean };

export type InventoryItem = {
  id: number;
  name: string;
  category: string;
  /** jewellery | raw gold/silver/platinum | diamond | other - drives raw-stock dashboard. */
  inventoryTrack?: string;
  /** g = grams (metals), ct = carats (diamonds), pcs = pieces (gift cards, packs). */
  quantityUnit?: string;
  weight: string;
  purity: string;
  price: string;
  hallmark: boolean;
  hallmarkNumber: string;
  size: string;
  providerName: string;
  storageBoxNumber: string;
  image?: string;
  stock: number;
  highSelling?: boolean;
};

export type Customer = {
  id: number;
  name: string;
  phone: string;
  email: string;
  address: string;
  totalPurchases: string;
  visits: number;
  lastVisit: string;
};

export type Employee = {
  id: number;
  name: string;
  role: "Admin" | "Salesman" | "Karigar";
  department: string;
  salary: string;
  status: "active" | "on-leave";
  joinDate: string;
  phone: string;
  email: string;
  address: string;
};

export type SalaryPayment = {
  id: number;
  employeeId: number;
  amount: string;
  amountRupees: number;
  monthPeriod: string;
  paymentMethod: string;
  createdAt: string;
};

export type EmployeeDetailPayload = {
  employee: Employee;
  payments: SalaryPayment[];
};

export type Order = {
  id: string;
  customer: string;
  /** Contact snapshot on the order (filled at checkout). */
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  /** cash | card | upi | bank | credit_note */
  paymentMode?: string;
  items: string;
  total: string;
  status: string;
  date: string;
};

/** Normalize API / bootstrap order rows (camelCase + legacy snake_case). */
export function normalizeOrderFromApi(raw: Order & Record<string, unknown>): Order {
  return {
    id: String(raw.id ?? ""),
    customer: String(raw.customer ?? ""),
    customerPhone: String(raw.customerPhone ?? raw.customer_phone ?? ""),
    customerEmail: String(raw.customerEmail ?? raw.customer_email ?? ""),
    customerAddress: String(raw.customerAddress ?? raw.customer_address ?? ""),
    paymentMode: String(raw.paymentMode ?? raw.payment_mode ?? "cash").toLowerCase(),
    items: String(raw.items ?? ""),
    total: String(raw.total ?? ""),
    status: String(raw.status ?? ""),
    date: String(raw.date ?? "").slice(0, 10),
  };
}

export type KarigarColumnKey = "assigned" | "inProgress" | "completed";

export type KarigarJob = {
  id: number;
  title: string;
  karigar: string;
  material: string;
  deadline: string;
  priority: string;
  customerName: string;
  customerMobile: string;
  instructions: string;
  size: string;
  referenceImage: string;
  /** Formatted ₹ string from API */
  price?: string;
  /** Workflow column from API (GET single job / fresh bootstrap rows) */
  columnKey?: KarigarColumnKey;
};

const KARIGAR_COLUMN_KEYS: KarigarColumnKey[] = ["assigned", "inProgress", "completed"];

export function normalizeKarigarJobFromApi(raw: KarigarJob & Record<string, unknown>): KarigarJob {
  const ck = String(raw.columnKey ?? raw.column_key ?? "");
  const columnKey = (KARIGAR_COLUMN_KEYS.includes(ck as KarigarColumnKey) ? ck : "assigned") as KarigarColumnKey;
  const priceFromApi = String(raw.price ?? "").trim();
  const rupeesRaw = raw.price_rupees ?? raw.priceRupees;
  const rupees =
    rupeesRaw !== undefined && rupeesRaw !== null && String(rupeesRaw).trim() !== ""
      ? Number(rupeesRaw)
      : NaN;
  const price =
    priceFromApi.length > 0
      ? priceFromApi
      : Number.isFinite(rupees) && rupees >= 0
        ? formatCurrency(rupees)
        : "";

  return {
    id: Number(raw.id),
    title: String(raw.title ?? ""),
    karigar: String(raw.karigar ?? ""),
    material: String(raw.material ?? ""),
    deadline: String(raw.deadline ?? ""),
    priority: String(raw.priority ?? "medium"),
    customerName: String(raw.customerName ?? raw.customer_name ?? ""),
    customerMobile: String(raw.customerMobile ?? raw.customer_mobile ?? ""),
    instructions: String(raw.instructions ?? ""),
    size: String(raw.size ?? ""),
    referenceImage: String(raw.referenceImage ?? raw.reference_image ?? ""),
    price,
    columnKey,
  };
}

export type KarigarBoard = {
  assigned: KarigarJob[];
  inProgress: KarigarJob[];
  completed: KarigarJob[];
};

export type RecentActivityItem = {
  id: number;
  action: string;
  detail: string;
  time: string;
  type: "sale" | "inventory" | "delivery" | "karigar" | "payment";
  date: string;
  read: boolean;
};

export function fetchBootstrap(): Promise<BootstrapPayload> {
  return apiGet<BootstrapPayload>("/api/bootstrap");
}

export function fetchOrderById(orderId: string): Promise<Order> {
  return apiGet<Order>(`/api/orders/${encodeURIComponent(orderId)}`);
}

export function fetchKarigarJobById(jobId: number): Promise<KarigarJob> {
  return apiGet<KarigarJob>(`/api/karigar-jobs/${jobId}`).then((r) =>
    normalizeKarigarJobFromApi(r as KarigarJob & Record<string, unknown>),
  );
}

export function fetchEmployeeDetail(employeeId: number): Promise<EmployeeDetailPayload> {
  return apiGet<EmployeeDetailPayload>(`/api/employees/${employeeId}`);
}

export function recordSalaryPayment(
  employeeId: number,
  body: { amount: string; monthPeriod: string; paymentMethod: string },
): Promise<SalaryPayment> {
  return apiPost<SalaryPayment>(`/api/employees/${employeeId}/payments`, body);
}

export type AccountingMonthlyResponse = {
  income: { month: string; amount: number }[];
  expenses: { month: string; amount: number }[];
};

export function fetchAccountingMonthly(): Promise<AccountingMonthlyResponse> {
  return apiGet<AccountingMonthlyResponse>("/api/accounting/monthly");
}

export type AdminLoginResponse = {
  token: string;
  username: string;
  name?: string;
  /** Present when Super Admin credentials were sent to this endpoint (compat). */
  loginAs?: "admin" | "super_admin";
};

export async function adminLogin(username: string, password: string): Promise<AdminLoginResponse> {
  return apiPost<AdminLoginResponse>("/api/admin/login", { username, password });
}

export async function adminSession(token: string): Promise<{ username: string; name?: string }> {
  const res = await fetch(apiUrl("/api/admin/session"), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<{ username: string; name?: string }>;
}

const authHeaders = (token: string) => ({ ...jsonHeaders, Authorization: `Bearer ${token}` });

export type SuperAdminLoginResponse = { token: string; username: string; name: string };

export type AdminPermissionKey =
  | "dashboard"
  | "inventory"
  | "sales"
  | "karigar"
  | "customers"
  | "employees"
  | "accounting"
  | "reports"
  | "goldSchemes"
  | "oldGoldExchange";

export type AdminPermissions = Record<AdminPermissionKey, boolean>;

export type SuperAdminUser = {
  id: number;
  username: string;
  name: string;
  email: string;
  phone: string;
  roleLabel: string;
  status: "active" | "inactive";
  permissions: AdminPermissions;
  lockedUntil: string | null;
  forcePasswordReset: boolean;
  failedLoginCount: number;
  lastFailedLoginAt: string | null;
  lastLoginAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type SuperAdminAuditLog = {
  id: number;
  actor: string;
  action: string;
  detail: string;
  adminId: number | null;
  createdAt: string | null;
};

export type SuperAdminOverview = {
  stats: {
    totalAdmins: number;
    activeAdmins: number;
    inactiveAdmins: number;
    adminsWithLogins: number;
    lockedAdmins: number;
    forceResetAdmins: number;
  };
  recentAdmins: SuperAdminUser[];
  recentAuditLogs: SuperAdminAuditLog[];
};

export type SuperAdminDetailResponse = {
  admin: SuperAdminUser;
  auditLogs: SuperAdminAuditLog[];
};

export type SuperAdminCreateAdminBody = {
  username: string;
  password: string;
  name: string;
  email: string;
  phone: string;
  roleLabel: string;
  permissions?: AdminPermissions;
};

export type SuperAdminUpdateAdminBody = Partial<Omit<SuperAdminCreateAdminBody, "username" | "password">> & {
  status?: "active" | "inactive";
  forcePasswordReset?: boolean;
};

export type SuperAdminBusinessOverview = {
  sales: {
    totalOrders: number;
    pendingOrders: number;
    deliveredOrders: number;
    totalRevenueRupees: number;
    revenue30dRupees: number;
  };
  inventory: {
    totalItems: number;
    lowStockItems: number;
    inventoryValueRupees: number;
    totalStock: number;
  };
  people: {
    totalCustomers: number;
    customerValueRupees: number;
    totalEmployees: number;
    activeEmployees: number;
  };
  schemes: {
    totalSchemes: number;
    activeSchemes: number;
  };
  recentActivities: { action: string; detail: string; createdAt: string | null }[];
};

export type SuperAdminSystemHealth = {
  api: { status: string; checkedAt: string; responseMs: number };
  database: { status: string; serverTime?: string | null };
  tableCounts?: {
    inventoryItems: number;
    customers: number;
    orders: number;
    admins: number;
    auditLogs: number;
  };
  latestActivityAt?: string | null;
  error?: string;
};

export type SuperAdminTicketStatus = "open" | "in_progress" | "resolved" | "closed";
export type SuperAdminTicketPriority = "low" | "medium" | "high" | "urgent";

export type SuperAdminTicket = {
  id: number;
  title: string;
  description: string;
  requesterName: string;
  requesterEmail: string;
  priority: SuperAdminTicketPriority;
  status: SuperAdminTicketStatus;
  assignedAdminId: number | null;
  assignedAdminName: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type SuperAdminTicketBody = {
  title: string;
  description: string;
  requesterName: string;
  requesterEmail: string;
  priority: SuperAdminTicketPriority;
  assignedAdminId?: number | null;
};

export type SuperAdminTicketUpdateBody = Partial<SuperAdminTicketBody> & {
  status?: SuperAdminTicketStatus;
};

export type SuperAdminFaqStatus = "draft" | "published";

export type SuperAdminFaq = {
  id: number;
  question: string;
  answer: string;
  status: SuperAdminFaqStatus;
  displayOrder: number;
  createdAt: string | null;
  updatedAt: string | null;
};

export type SuperAdminFaqBody = {
  question: string;
  answer: string;
  status: SuperAdminFaqStatus;
  displayOrder: number;
};

export async function superAdminLogin(username: string, password: string): Promise<SuperAdminLoginResponse> {
  return apiPost<SuperAdminLoginResponse>("/api/super-admin/login", { username, password });
}

export async function superAdminSession(token: string): Promise<{ username: string; name: string }> {
  const res = await fetch(apiUrl("/api/super-admin/session"), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<{ username: string; name: string }>;
}

export async function fetchSuperAdminOverview(token: string): Promise<SuperAdminOverview> {
  const res = await fetch(apiUrl("/api/super-admin/overview"), { headers: authHeaders(token) });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<SuperAdminOverview>;
}

export async function fetchSuperAdminUsers(token: string): Promise<SuperAdminUser[]> {
  const res = await fetch(apiUrl("/api/super-admin/admins"), { headers: authHeaders(token) });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<SuperAdminUser[]>;
}

export async function fetchSuperAdminUserDetail(token: string, id: number): Promise<SuperAdminDetailResponse> {
  const res = await fetch(apiUrl(`/api/super-admin/admins/${id}`), { headers: authHeaders(token) });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<SuperAdminDetailResponse>;
}

export async function createSuperAdminUser(token: string, body: SuperAdminCreateAdminBody): Promise<SuperAdminUser> {
  const res = await fetch(apiUrl("/api/super-admin/admins"), {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<SuperAdminUser>;
}

export async function updateSuperAdminUser(token: string, id: number, body: SuperAdminUpdateAdminBody): Promise<SuperAdminUser> {
  const res = await fetch(apiUrl(`/api/super-admin/admins/${id}`), {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<SuperAdminUser>;
}

export async function updateSuperAdminUserPermissions(token: string, id: number, permissions: AdminPermissions): Promise<SuperAdminUser> {
  const res = await fetch(apiUrl(`/api/super-admin/admins/${id}/permissions`), {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify({ permissions }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<SuperAdminUser>;
}

export async function setSuperAdminUserLock(
  token: string,
  id: number,
  locked: boolean,
  minutes = 15,
): Promise<SuperAdminUser> {
  const res = await fetch(apiUrl(`/api/super-admin/admins/${id}/lock`), {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify({ locked, minutes }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<SuperAdminUser>;
}

export async function setSuperAdminUserForceReset(
  token: string,
  id: number,
  forcePasswordReset: boolean,
): Promise<SuperAdminUser> {
  const res = await fetch(apiUrl(`/api/super-admin/admins/${id}/force-reset`), {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify({ forcePasswordReset }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<SuperAdminUser>;
}

export async function resetSuperAdminUserPassword(token: string, id: number, password: string): Promise<SuperAdminUser> {
  const res = await fetch(apiUrl(`/api/super-admin/admins/${id}/password`), {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify({ password }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<SuperAdminUser>;
}

export async function deactivateSuperAdminUser(token: string, id: number): Promise<SuperAdminUser> {
  const res = await fetch(apiUrl(`/api/super-admin/admins/${id}`), {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<SuperAdminUser>;
}

export async function fetchSuperAdminAuditLogs(token: string, adminId?: number): Promise<SuperAdminAuditLog[]> {
  const suffix = adminId ? `?adminId=${encodeURIComponent(String(adminId))}` : "";
  const res = await fetch(apiUrl(`/api/super-admin/audit-logs${suffix}`), { headers: authHeaders(token) });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<SuperAdminAuditLog[]>;
}

export async function fetchSuperAdminBusinessOverview(token: string): Promise<SuperAdminBusinessOverview> {
  const res = await fetch(apiUrl("/api/super-admin/business-overview"), { headers: authHeaders(token) });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<SuperAdminBusinessOverview>;
}

export async function fetchSuperAdminSystemHealth(token: string): Promise<SuperAdminSystemHealth> {
  const res = await fetch(apiUrl("/api/super-admin/system-health"), { headers: authHeaders(token) });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<SuperAdminSystemHealth>;
}

export async function fetchSuperAdminTickets(token: string, status?: SuperAdminTicketStatus): Promise<SuperAdminTicket[]> {
  const suffix = status ? `?status=${encodeURIComponent(status)}` : "";
  const res = await fetch(apiUrl(`/api/super-admin/tickets${suffix}`), { headers: authHeaders(token) });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<SuperAdminTicket[]>;
}

export async function createSuperAdminTicket(token: string, body: SuperAdminTicketBody): Promise<SuperAdminTicket> {
  const res = await fetch(apiUrl("/api/super-admin/tickets"), {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<SuperAdminTicket>;
}

export async function updateSuperAdminTicket(
  token: string,
  id: number,
  body: SuperAdminTicketUpdateBody,
): Promise<SuperAdminTicket> {
  const res = await fetch(apiUrl(`/api/super-admin/tickets/${id}`), {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<SuperAdminTicket>;
}

export async function fetchSuperAdminFaqs(token: string): Promise<SuperAdminFaq[]> {
  const res = await fetch(apiUrl("/api/super-admin/faqs"), { headers: authHeaders(token) });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<SuperAdminFaq[]>;
}

export async function createSuperAdminFaq(token: string, body: SuperAdminFaqBody): Promise<SuperAdminFaq> {
  const res = await fetch(apiUrl("/api/super-admin/faqs"), {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<SuperAdminFaq>;
}

export async function updateSuperAdminFaq(token: string, id: number, body: Partial<SuperAdminFaqBody>): Promise<SuperAdminFaq> {
  const res = await fetch(apiUrl(`/api/super-admin/faqs/${id}`), {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<SuperAdminFaq>;
}

export async function deleteSuperAdminFaq(token: string, id: number): Promise<void> {
  const res = await fetch(apiUrl(`/api/super-admin/faqs/${id}`), {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error(await parseError(res));
}

export type CashBookLineSource = "order" | "scheme_payment" | "salary";

export type CashBookLine = {
  id: string;
  dayId: number | null;
  direction: "in" | "out";
  category: string;
  amountRupees: number;
  amount: string;
  memo: string;
  createdAt: string | null;
  source: CashBookLineSource;
  /** Order id, payment row id, or salary payment id depending on source */
  sourceId: string;
  schemeId?: number;
  employeeId?: number;
  paymentMode?: string;
};

export type CashBookDayPayload = {
  bookDate: string;
  dayExists: boolean;
  dayId: number | null;
  openingRupees: number;
  opening: string;
  openingNote: string;
  totalInRupees: number;
  totalIn: string;
  totalOutRupees: number;
  totalOut: string;
  closingRupees: number;
  closing: string;
  isClosed: boolean;
  notes: string;
  lines: CashBookLine[];
  linesIn: CashBookLine[];
  linesOut: CashBookLine[];
  sourcesSummary: {
    ordersInCount: number;
    schemePaymentsInCount: number;
    salaryCashOutCount: number;
  };
};

export function fetchCashBookDay(date: string): Promise<CashBookDayPayload> {
  return apiGet<CashBookDayPayload>(`/api/cash-book/day/${encodeURIComponent(date)}`);
}

export function patchCashBookDay(
  date: string,
  body: Partial<{ notes: string; isClosed: boolean }>,
): Promise<CashBookDayPayload> {
  return apiPatch<CashBookDayPayload>(`/api/cash-book/day/${encodeURIComponent(date)}`, body);
}
