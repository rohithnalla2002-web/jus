import { formatCurrency } from "@/lib/demo";

const jsonHeaders = { "Content-Type": "application/json" };

/** Use VITE_API_URL when the UI is served without a dev proxy (e.g. static hosting + separate API). */
const apiUrl = (path: string) => `${import.meta.env.VITE_API_URL ?? ""}${path}`;

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

export type AdminLoginResponse = { token: string; username: string };

export async function adminLogin(username: string, password: string): Promise<AdminLoginResponse> {
  return apiPost<AdminLoginResponse>("/api/admin/login", { username, password });
}

export async function adminSession(token: string): Promise<{ username: string }> {
  const res = await fetch(apiUrl("/api/admin/session"), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<{ username: string }>;
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
