import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  Smartphone,
  ShieldCheck,
  FileCheck2,
  Palette,
  BarChart3,
  DatabaseBackup,
  MessageCircle,
  Phone,
  Mail,
  CheckCircle2,
  TrendingUp,
  Gem,
  Clock3,
  Bot,
  BrainCircuit,
  WandSparkles,
  Quote,
  HelpCircle,
  ChevronDown,
} from "lucide-react";
import { GOLDMIND_APP_NAME } from "@/lib/company";
import { GoldMindLogoMark } from "@/components/shared/GoldMindBrandLogo";

const fadeUp = { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 } };

const whyFeatures = [
  {
    icon: Smartphone,
    title: "Access anywhere",
    desc: "Cloud-based architecture gives you access on web and mobile while on the move.",
  },
  {
    icon: ShieldCheck,
    title: "Best-in-class security",
    desc: "Business data is protected with strong encryption and secure workflows.",
  },
  {
    icon: FileCheck2,
    title: "GST Ready",
    desc: "Create and share GST-compliant invoices quickly with fewer billing errors.",
  },
  {
    icon: Palette,
    title: "Pleasing UI",
    desc: "Simple, clean interface designed for quick daily operations in jewellery stores.",
  },
  {
    icon: BarChart3,
    title: "Dynamic Reports",
    desc: "Track business performance with dashboards, summaries, and detailed reports.",
  },
  {
    icon: DatabaseBackup,
    title: "Automatic backup",
    desc: "Transactions are continuously backed up to reduce risk of data loss.",
  },
];

const testimonials = [
  {
    quote: "Very user-friendly and quick accounting app for jewellers.",
    name: "Mihir Soni",
    rating: "★★★★☆",
  },
  {
    quote: "Best cross-platform ERP so far, data sync is very fast.",
    name: "Manish Dholakia",
    rating: "★★★★★",
  },
  {
    quote: "Great for sales, purchase, and inventory management.",
    name: "Himanshu Tomar",
    rating: "★★★★★",
  },
];

const faqs = [
  {
    q: "What is the use of jewellery ERP software?",
    a: "ERP combines billing, inventory, accounting, and reports into one platform to simplify operations.",
  },
  {
    q: "Is my data backed up?",
    a: "Yes, data can be automatically backed up so business records remain safe.",
  },
  {
    q: "Can I try it for free?",
    a: "A free trial period can be offered so you can evaluate features before purchasing.",
  },
  {
    q: "How do I get support?",
    a: "Support is available during business hours through phone, WhatsApp, and email.",
  },
];

const analyticsShots = [
  {
    title: "Live Sales Dashboard",
    img: "/1.jpg",
  },
  {
    title: "Inventory Intelligence",
    img: "/2.jpg",
  },
  {
    title: "Mobile Business Insights",
    img: "/3.jpg",
  },
];

const heroStats = [
  { label: "Orders Processed", value: "22K+" },
  { label: "Invoice Accuracy", value: "99.9%" },
  { label: "Avg. Billing Time", value: "45s" },
];

const aiShots = [
  {
    title: "AI Demand Forecasting",
    img: "/4.jpg",
    desc: "Predict fast-moving designs and optimize replenishment before stock-outs.",
  },
  {
    title: "AI Sales Co-Pilot",
    img: "/5.jpg",
    desc: "Suggest upsell bundles, follow-ups, and next best actions for staff.",
  },
];

export default function LandingPage() {
  return (
    <>
      <section id="home" className="relative overflow-hidden bg-gradient-to-br from-[#fffef9] via-[#faf6ef] to-[#f3e8d8]">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25"
          style={{
            backgroundImage: "url(/4.jpg)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#fefdfb] via-[#fefdfb]/95 to-[#fefdfb]/70" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(251,191,36,0.2),transparent_55%)]" />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -left-16 top-16 h-48 w-48 rounded-full bg-amber-300/30 blur-3xl"
          animate={{ y: [0, -16, 0], x: [0, 10, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -right-10 bottom-10 h-56 w-56 rounded-full bg-violet-300/20 blur-3xl"
          animate={{ y: [0, 18, 0], x: [0, -12, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="relative mx-auto grid min-h-[78vh] max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-2">
          <motion.div {...fadeUp} transition={{ duration: 0.6 }} className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-200/80 bg-white/90 px-4 py-1.5 text-sm font-medium text-amber-900 shadow-sm">
              <Sparkles className="h-4 w-4 shrink-0 text-amber-600" />
              <GoldMindLogoMark size="xs" />
              {GOLDMIND_APP_NAME}
            </span>
            <h1 className="mt-6 font-serif text-4xl font-bold leading-tight text-zinc-900 sm:text-5xl md:text-6xl">
              AI-Driven ERP for <span className="gold-text-shop">Jewellery Retail & Workshop</span>
            </h1>
            <p className="mt-6 text-lg text-zinc-600">
              Manage billing, inventory, karigar workflow, and customer engagement in one beautiful platform with built-in AI insights.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                to="/#visual-analytics"
                className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 px-8 py-4 text-sm font-bold text-black shadow-lg shadow-amber-300/50 transition-all hover:scale-[1.02] hover:shadow-amber-400/40"
              >
                Explore Platform
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center rounded-full border border-zinc-300 bg-white/90 px-6 py-4 text-sm font-semibold text-zinc-800 transition hover:border-amber-400 hover:bg-amber-50"
              >
                Book Demo
              </Link>
            </div>
            <div className="mt-8 grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-3">
              {heroStats.map((stat, idx) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.08 }}
                  className="rounded-xl border border-amber-200/80 bg-white/85 px-4 py-3 text-left shadow-sm backdrop-blur"
                >
                  <p className="text-lg font-bold text-zinc-900">{stat.value}</p>
                  <p className="text-[11px] uppercase tracking-wide text-zinc-500">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7 }}
            className="relative mx-auto w-full max-w-xl"
          >
            <div className="absolute -left-6 -top-6 h-24 w-24 rounded-2xl bg-amber-300/40 blur-2xl" />
            <div className="absolute -bottom-8 right-0 h-28 w-28 rounded-full bg-violet-300/30 blur-2xl" />
            <div className="relative overflow-hidden rounded-3xl border border-amber-200/70 bg-white/90 p-4 shadow-2xl backdrop-blur">
              <img
                src="/1.jpg"
                alt="GoldMind analytics dashboard"
                className="h-64 w-full rounded-2xl object-cover sm:h-72"
              />
              <div className="mt-4 grid grid-cols-3 gap-2">
                {[
                  { k: "Today Sales", v: "₹4.8L" },
                  { k: "Orders", v: "126" },
                  { k: "AI Alerts", v: "18" },
                ].map((m) => (
                  <div key={m.k} className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-center">
                    <p className="text-xs text-zinc-500">{m.k}</p>
                    <p className="text-sm font-bold text-zinc-900">{m.v}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="visual-analytics" className="relative overflow-hidden py-16">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-50/70 to-white" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">Visual Analytics</p>
              <h2 className="mt-2 font-serif text-3xl font-bold text-zinc-900 sm:text-4xl">
                Beautiful dashboards with actionable insights
              </h2>
            </div>
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="inline-flex items-center gap-2 rounded-full border border-amber-300/70 bg-white px-4 py-2 text-xs font-medium text-zinc-700 shadow-sm"
            >
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              Real-time growth tracking
            </motion.div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-12">
            <motion.article
              whileHover={{ y: -4, scale: 1.005 }}
              transition={{ type: "spring", stiffness: 180, damping: 16 }}
              className="group relative overflow-hidden rounded-3xl border border-amber-200/70 bg-white shadow-lg md:col-span-7"
            >
              <img src={analyticsShots[0].img} alt={analyticsShots[0].title} className="h-64 w-full object-cover md:h-80" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <h3 className="text-xl font-semibold text-white">{analyticsShots[0].title}</h3>
                <p className="mt-1 text-sm text-white/90">Revenue, order count, and category performance in one screen.</p>
              </div>
            </motion.article>

            <div className="space-y-5 md:col-span-5">
              {analyticsShots.slice(1).map((shot) => (
                <motion.article
                  key={shot.title}
                  whileHover={{ y: -4 }}
                  transition={{ type: "spring", stiffness: 180, damping: 16 }}
                  className="group relative overflow-hidden rounded-3xl border border-amber-200/70 bg-white shadow-md"
                >
                  <img src={shot.img} alt={shot.title} className="h-36 w-full object-cover sm:h-44" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
                  <p className="absolute bottom-3 left-4 text-sm font-semibold text-white">{shot.title}</p>
                </motion.article>
              ))}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { icon: Gem, title: "Metal-wise margins", note: "Gold, silver, diamond margin bands" },
              { icon: Clock3, title: "Instant invoicing", note: "Reduce counter billing queue time" },
              { icon: BarChart3, title: "Forecast trends", note: "Smart reorder + fast-moving SKUs" },
            ].map((item) => (
              <motion.div
                key={item.title}
                whileHover={{ y: -3 }}
                className="rounded-2xl border border-amber-200/70 bg-white/90 p-4 shadow-sm"
              >
                <item.icon className="h-5 w-5 text-amber-700" />
                <p className="mt-2 text-sm font-semibold text-zinc-900">{item.title}</p>
                <p className="text-xs text-zinc-600">{item.note}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="ai-integration" className="relative overflow-hidden border-y border-violet-200/40 bg-gradient-to-br from-violet-50/70 via-white to-cyan-50/60 py-16">
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -right-20 top-0 h-64 w-64 rounded-full bg-violet-300/25 blur-3xl"
          animate={{ y: [0, 20, 0], x: [0, -12, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-violet-700">
                <Bot className="h-3.5 w-3.5" />
                AI Integration
              </p>
              <h2 className="mt-3 font-serif text-3xl font-bold text-zinc-900 sm:text-4xl">
                Built-in AI for smarter jewellery operations
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-zinc-600">
                From forecasting and reminders to customer outreach, AI helps your team take faster and better decisions every day.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white px-4 py-2 text-xs font-medium text-zinc-700 shadow-sm">
              <BrainCircuit className="h-4 w-4 text-violet-700" />
              AI suggestions update in real time
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {aiShots.map((item) => (
              <motion.article
                key={item.title}
                whileHover={{ y: -5 }}
                transition={{ type: "spring", stiffness: 180, damping: 16 }}
                className="group overflow-hidden rounded-3xl border border-violet-200/60 bg-white shadow-md"
              >
                <div className="relative">
                  <img src={item.img} alt={item.title} className="h-56 w-full object-cover md:h-64" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                  <p className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-violet-700">
                    <WandSparkles className="h-3.5 w-3.5" />
                    AI Powered
                  </p>
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-zinc-900">{item.title}</h3>
                  <p className="mt-2 text-sm text-zinc-600">{item.desc}</p>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section id="why-us" className="border-y border-amber-200/60 bg-white/80 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-serif text-3xl font-bold text-zinc-900 sm:text-4xl">Why {GOLDMIND_APP_NAME}?</h2>
            <p className="mt-3 text-sm text-zinc-600">
              Built for jewellery retailers, wholesalers, and workshops to run daily business with confidence.
            </p>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {whyFeatures.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                whileHover={{ y: -4, boxShadow: "0 20px 36px rgba(180, 130, 20, 0.12)" }}
                className="rounded-2xl border border-amber-200/70 bg-white p-5 shadow-sm"
              >
                <feature.icon className="h-5 w-5 text-amber-700" />
                <h3 className="mt-3 text-base font-semibold text-zinc-900">{feature.title}</h3>
                <p className="mt-1 text-sm text-zinc-600">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="core-features" className="py-16">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 md:grid-cols-2">
          <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-white to-amber-50 p-6">
            <h3 className="font-serif text-2xl font-bold text-zinc-900">Business analytics at your fingertips</h3>
            <p className="mt-2 text-sm text-zinc-600">
              Live dashboard cards and trend indicators help you monitor sales, stock, and collections at a glance.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-zinc-700">
              {["Live dashboard KPIs", "Branch-wise performance", "Quick drill-down reports"].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-white to-amber-50 p-6">
            <h3 className="font-serif text-2xl font-bold text-zinc-900">GST compliant invoices</h3>
            <p className="mt-2 text-sm text-zinc-600">
              Generate, share, and print GST-ready invoices quickly from both desktop and mobile workflows.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-zinc-700">
              {["GST-ready formats", "Fast invoice creation", "Share and print instantly"].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section id="testimonials" className="relative overflow-hidden py-16">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50/70 via-white to-violet-50/50" />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -left-12 top-10 h-44 w-44 rounded-full bg-amber-300/30 blur-3xl"
          animate={{ y: [0, 16, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">Testimonials</p>
            <h2 className="mt-2 font-serif text-3xl font-bold text-zinc-900 sm:text-4xl">What our users say</h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-zinc-600">
              Real feedback from jewellers using the platform daily for billing, stock, and operations.
            </p>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <motion.article
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -6, scale: 1.01 }}
                className="group relative overflow-hidden rounded-3xl border border-amber-200/80 bg-white p-6 shadow-md"
              >
                <div className="absolute right-4 top-4 rounded-full bg-amber-100 p-2 text-amber-700">
                  <Quote className="h-4 w-4" />
                </div>
                <p className="text-sm tracking-wide text-amber-700">{t.rating}</p>
                <p className="mt-3 text-sm leading-relaxed text-zinc-700">"{t.quote}"</p>
                <div className="mt-5 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 text-xs font-bold text-white">
                    {t.name
                      .split(" ")
                      .map((part) => part[0])
                      .join("")
                      .slice(0, 2)}
                  </div>
                  <p className="text-sm font-semibold text-zinc-900">{t.name}</p>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="border-y border-amber-200/60 bg-amber-50/60 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="text-center font-serif text-3xl font-bold text-zinc-900">Simple pricing</h2>
          <p className="mt-2 text-center text-sm text-zinc-600">One powerful website plan with everything your jewellery business needs.</p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            whileHover={{ y: -6 }}
            className="relative mx-auto mt-8 max-w-4xl overflow-hidden rounded-3xl border border-amber-300/80 bg-white shadow-xl"
          >
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-amber-300/30 blur-2xl" />
            <div className="absolute -bottom-12 left-6 h-40 w-40 rounded-full bg-violet-300/20 blur-3xl" />
            <div className="relative grid gap-6 p-7 md:grid-cols-[1.1fr,1fr] md:p-8">
              <div>
                <p className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-amber-800">
                  Website Plan
                </p>
                <p className="mt-4 text-4xl font-bold text-zinc-900">Contact for pricing</p>
                <p className="mt-2 text-sm text-zinc-600">
                  Get complete ERP + AI capabilities in one web platform with onboarding and support.
                </p>
                <div className="mt-6">
                  <Link
                    to="/contact"
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-700 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:scale-[1.02]"
                  >
                    Book Demo
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
              <div className="rounded-2xl border border-amber-200/80 bg-amber-50/40 p-5">
                <p className="text-sm font-semibold text-zinc-900">Everything included</p>
                <ul className="mt-3 grid grid-cols-1 gap-2 text-sm text-zinc-700">
                  {[
                    "Sales, billing, and GST invoice workflows",
                    "Inventory with live stock and purity tracking",
                    "Karigar workflow and job movement tracking",
                    "Customers, suppliers, and CRM touchpoints",
                    "Accounting dashboard and business reports",
                    "AI insights, reminders, and growth suggestions",
                    "Admin controls, roles, and secure access",
                    "Cloud backup and multi-device web access",
                  ].map((item) => (
                    <motion.li
                      key={item}
                      initial={{ opacity: 0, x: 8 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      className="flex items-start gap-2"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <span>{item}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="faqs" className="relative overflow-hidden py-16">
        <div className="absolute inset-0 bg-gradient-to-b from-white to-amber-50/50" />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -right-16 top-12 h-48 w-48 rounded-full bg-amber-300/25 blur-3xl"
          animate={{ y: [0, 16, 0], x: [0, -8, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
          <div className="text-center">
            <p className="inline-flex items-center gap-2 rounded-full border border-amber-300/70 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">
              <HelpCircle className="h-3.5 w-3.5" />
              FAQs
            </p>
            <h2 className="mt-3 font-serif text-3xl font-bold text-zinc-900 sm:text-4xl">Frequently asked questions</h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-zinc-600">
              Everything you need to know about setup, billing, support, and data safety.
            </p>
          </div>

          <div className="mt-8 space-y-4">
            {faqs.map((item, idx) => (
              <motion.details
                key={item.q}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.06 }}
                className="group rounded-2xl border border-amber-200/80 bg-white/95 p-5 shadow-sm transition-all open:shadow-md hover:border-amber-300"
              >
                <summary className="flex cursor-pointer list-none items-start justify-between gap-3">
                  <span className="text-sm font-semibold text-zinc-900">{item.q}</span>
                  <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500 transition-transform duration-300 group-open:rotate-180" />
                </summary>
                <p className="mt-3 border-t border-amber-100 pt-3 text-sm leading-relaxed text-zinc-600">{item.a}</p>
              </motion.details>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="border-t border-amber-200/70 bg-white py-16">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 md:grid-cols-2">
          <div>
            <h2 className="font-serif text-3xl font-bold text-zinc-900">Get in touch</h2>
            <p className="mt-2 text-sm text-zinc-600">
              Questions about setup, pricing, or migration? Our team can help you choose the right plan.
            </p>
            <div className="mt-5 space-y-2 text-sm text-zinc-700">
              <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-amber-700" /> support@goldminderp.com</p>
              <p className="flex items-center gap-2"><MessageCircle className="h-4 w-4 text-amber-700" /> WhatsApp: +91 95022 01143</p>
              <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-amber-700" /> Phone: +91 95022 01143</p>
            </div>
          </div>
          <div className="rounded-2xl border border-amber-200/70 bg-amber-50/60 p-6">
            <h3 className="text-sm font-semibold text-zinc-900">Quick enquiry</h3>
            <p className="mt-1 text-xs text-zinc-600">Share your details and we will get back shortly.</p>
            <div className="mt-4 grid grid-cols-1 gap-2">
              <input className="rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm" placeholder="Your Name" />
              <input className="rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm" placeholder="Mobile Number" />
              <input className="rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm" placeholder="Email" />
              <textarea className="min-h-[90px] rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm" placeholder="Message" />
              <button type="button" className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700">
                Submit
              </button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
