import type { Customer, Employee } from "@/lib/api";
import { normCustomerKey, normalizePhoneDigits } from "@/lib/customerPhoneLookup";
import { GOLDMIND_APP_NAME } from "@/lib/company";

export function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function resolvePersonContact(
  name: string,
  customers: Customer[],
  employees: Employee[],
): { email: string; phone: string } | null {
  const key = normCustomerKey(name);
  const customer = customers.find((c) => normCustomerKey(c.name) === key);
  if (customer) {
    return { email: customer.email?.trim() ?? "", phone: customer.phone?.trim() ?? "" };
  }
  const employee = employees.find((e) => normCustomerKey(e.name) === key);
  if (employee) {
    return { email: employee.email?.trim() ?? "", phone: employee.phone?.trim() ?? "" };
  }
  return null;
}

export function buildReachOutMessage(recipientName: string, insightTitle: string, narrative: string) {
  return `Hi ${recipientName},

${GOLDMIND_APP_NAME} — ${insightTitle}

${narrative}

Please let me know if you have any questions.

Thank you.`;
}

/** One message addressed to every name in the suggestion (comma-separated greeting). */
export function buildReachOutMessageGroup(recipientNames: string[], insightTitle: string, narrative: string) {
  const greeting =
    recipientNames.length === 0 ? "Hi," : recipientNames.length === 1 ? `Hi ${recipientNames[0]},` : `Hi ${recipientNames.join(", ")},`;

  return `${greeting}

${GOLDMIND_APP_NAME} — ${insightTitle}

${narrative}

Please coordinate as needed.

Thank you.`;
}

export function mailtoHref(email: string, subject: string, body: string) {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/** Comma-separated To: addresses (common mail client support). */
export function mailtoHrefMany(emails: string[], subject: string, body: string): string | null {
  const clean = [...new Set(emails.map((e) => e.trim()).filter(Boolean))];
  if (clean.length === 0) return null;
  const to = clean.join(",");
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/** WhatsApp click-to-chat; returns null if phone is unusable. */
export function whatsappHref(phone: string, text: string): string | null {
  let d = normalizePhoneDigits(phone);
  if (d.length < 10) return null;
  if (d.length === 10) d = `91${d}`;
  return `https://wa.me/${d}?text=${encodeURIComponent(text)}`;
}
