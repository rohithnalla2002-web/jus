import type { Customer, KarigarJob, Order } from "@/lib/api";

/** Karigar job row belongs to CRM customer (phone match preferred, else same normalized name). */
export function karigarJobBelongsToCustomer(job: KarigarJob, customer: Customer): boolean {
  const custDigits = normalizePhoneDigits(customer.phone);
  const jobDigits = normalizePhoneDigits(job.customerMobile ?? "");
  if (custDigits.length >= 10 && jobDigits.length >= 10 && phonesMatch(job.customerMobile, customer.phone)) {
    return true;
  }
  return normCustomerKey(job.customerName) === normCustomerKey(customer.name);
}

export function normalizePhoneDigits(s: string): string {
  return s.replace(/\D/g, "");
}

/** Normalize customer display name for matching orders ↔ CRM. */
export function normCustomerKey(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

function last10FromPhone(s: string) {
  const d = normalizePhoneDigits(s);
  return d.length >= 10 ? d.slice(-10) : "";
}

/** Same person: order.customer name matches, or order snapshot phone matches customer phone (last 10 digits). */
export function orderBelongsToCustomer(order: Order, customer: { name: string; phone: string }): boolean {
  if (normCustomerKey(order.customer) === normCustomerKey(customer.name)) return true;
  const ot = last10FromPhone(order.customerPhone ?? "");
  const ct = last10FromPhone(customer.phone);
  return ct.length >= 10 && ot.length >= 10 && ot === ct;
}

/** True if typed phone matches stored (full digits or same last 10). */
export function phonesMatch(input: string, stored: string): boolean {
  const a = normalizePhoneDigits(input);
  const b = normalizePhoneDigits(stored);
  if (a.length < 10) return false;
  if (b.length === 0) return false;
  if (a === b) return true;
  if (a.length >= 10 && b.length >= 10 && last10FromPhone(input) === last10FromPhone(stored)) return true;
  return false;
}

export type ResolvedContact = {
  name: string;
  phone: string;
  email: string;
  address: string;
  source: "customer" | "order" | "karigar";
};

/**
 * Resolve contact: CRM customers first, then most recent order with same mobile snapshot.
 */
export function lookupContactByPhone(phone: string, customers: Customer[], orders: Order[]): ResolvedContact | null {
  const digits = normalizePhoneDigits(phone);
  if (digits.length < 10) return null;

  const customerHit = customers.find((c) => {
    const cn = normalizePhoneDigits(c.phone);
    if (cn.length === 0) return false;
    return phonesMatch(phone, c.phone);
  });
  if (customerHit) {
    return {
      name: customerHit.name,
      phone: customerHit.phone.trim() || phone,
      email: customerHit.email,
      address: customerHit.address,
      source: "customer",
    };
  }

  const withPhone = orders.filter((o) => {
    const p = o.customerPhone ?? "";
    return normalizePhoneDigits(p).length >= 10 && phonesMatch(phone, p);
  });
  if (withPhone.length === 0) return null;

  withPhone.sort((a, b) => {
    const ta = Date.parse(a.date);
    const tb = Date.parse(b.date);
    return (Number.isFinite(tb) ? tb : 0) - (Number.isFinite(ta) ? ta : 0);
  });
  const o = withPhone[0]!;
  return {
    name: o.customer.trim(),
    phone: (o.customerPhone ?? "").trim() || phone,
    email: (o.customerEmail ?? "").trim(),
    address: (o.customerAddress ?? "").trim(),
    source: "order",
  };
}

/** Match karigar jobs by customer mobile (most recent job first). */
function lookupContactFromKarigarJobs(phone: string, jobs: KarigarJob[]): ResolvedContact | null {
  const matches = jobs.filter((j) => {
    const m = j.customerMobile ?? "";
    return normalizePhoneDigits(m).length >= 10 && phonesMatch(phone, m);
  });
  if (matches.length === 0) return null;
  matches.sort((a, b) => b.id - a.id);
  const j = matches[0]!;
  return {
    name: j.customerName.trim(),
    phone: (j.customerMobile ?? "").trim() || phone,
    email: "",
    address: "",
    source: "karigar",
  };
}

/**
 * For Assign Item: CRM first, then orders, then prior karigar jobs with same mobile.
 */
export function lookupContactForKarigarAssign(
  phone: string,
  customers: Customer[],
  orders: Order[],
  karigarJobs: KarigarJob[],
): ResolvedContact | null {
  const fromCrmOrOrder = lookupContactByPhone(phone, customers, orders);
  if (fromCrmOrOrder) return fromCrmOrOrder;
  return lookupContactFromKarigarJobs(phone, karigarJobs);
}
