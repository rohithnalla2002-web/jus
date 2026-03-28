import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, MapPin, Phone, Send } from "lucide-react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Name is required";
    if (!email.trim()) next.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "Invalid email";
    if (!message.trim()) next.message = "Message is required";
    else if (message.trim().length < 10) next.message = "Please write at least 10 characters";
    setErrors(next);
    if (Object.keys(next).length) return;
    setSent(true);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <div className="grid gap-12 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="font-serif text-4xl font-bold text-zinc-900">Contact Us</h1>
          <p className="mt-4 text-zinc-600">We’d love to hear from you — appointments, custom design, or general enquiries.</p>
          <ul className="mt-10 space-y-6 text-sm text-zinc-700">
            <li className="flex gap-4">
              <MapPin className="h-5 w-5 shrink-0 text-amber-600" />
              <span>12 Jubilee Hills Road, Hyderabad, Telangana 500033</span>
            </li>
            <li className="flex gap-4">
              <Phone className="h-5 w-5 shrink-0 text-amber-600" />
              <span>+91 40 1234 5678</span>
            </li>
            <li className="flex gap-4">
              <Mail className="h-5 w-5 shrink-0 text-amber-600" />
              <span>care@gildedgem.in</span>
            </li>
          </ul>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          onSubmit={submit}
          className="rounded-2xl border border-amber-200/80 bg-white p-6 shadow-lg sm:p-8"
        >
          {sent ? (
            <p className="py-8 text-center font-medium text-amber-800">Thank you! We’ll get back to you shortly.</p>
          ) : (
            <>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-600">Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-amber-200 bg-[#fefdfb] px-4 py-3 text-sm text-zinc-900 focus:border-amber-500 focus:outline-none"
                />
                {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
              </div>
              <div className="mt-4">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-600">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-amber-200 bg-[#fefdfb] px-4 py-3 text-sm text-zinc-900 focus:border-amber-500 focus:outline-none"
                />
                {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
              </div>
              <div className="mt-4">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-600">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  className="mt-2 w-full rounded-xl border border-amber-200 bg-[#fefdfb] px-4 py-3 text-sm text-zinc-900 focus:border-amber-500 focus:outline-none"
                />
                {errors.message && <p className="mt-1 text-xs text-red-600">{errors.message}</p>}
              </div>
              <button
                type="submit"
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-700 py-4 text-sm font-bold text-white shadow-md"
              >
                <Send className="h-4 w-4" /> Send message
              </button>
            </>
          )}
        </motion.form>
      </div>
    </div>
  );
}
