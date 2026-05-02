import { motion } from "framer-motion";
import {
  Brain,
  MonitorX,
  Puzzle,
  Eye,
  Radio,
  FileQuestion,
  Check,
  Minus,
  X,
  Sparkles,
} from "lucide-react";
import { GOLDMIND_APP_NAME } from "@/lib/company";
import { cn } from "@/lib/utils";

const matrixFeatures = [
  { name: "GST-ready invoicing", cells: ["y", "y", "p", "y", "n", "y"] as const },
  { name: "Karigar / job workflow", cells: ["p", "y", "n", "n", "n", "y"] as const },
  { name: "Gold / metal weight inventory", cells: ["y", "y", "n", "n", "n", "y"] as const },
  { name: "Customer CRM + loyalty", cells: ["n", "p", "p", "n", "p", "y"] as const },
  { name: "Old gold / exchange module", cells: ["p", "p", "n", "n", "n", "y"] as const },
  { name: "Gold scheme management", cells: ["n", "p", "n", "n", "n", "y"] as const },
  { name: "Cloud / mobile access", cells: ["n", "p", "p", "n", "y", "y"] as const },
  { name: "AI demand forecasting", cells: ["n", "n", "n", "n", "n", "y"] as const },
  { name: "AI reorder suggestions", cells: ["n", "n", "n", "n", "n", "y"] as const },
  { name: "AI customer outreach (WA / Email)", cells: ["n", "n", "n", "n", "n", "y"] as const },
  { name: "AI Copilot on every screen", cells: ["n", "n", "n", "n", "n", "y"] as const },
  { name: "Modern, pleasant UI", cells: ["n", "p", "n", "n", "y", "y"] as const },
] as const;

/** Last column is always {GOLDMIND_APP_NAME}; preceding columns are anonymized (no third-party names). */
const ANONYMIZED_VENDOR_COLS = 5;

function MatrixSymbol({ v }: { v: "y" | "n" | "p" }) {
  if (v === "y")
    return <Check className="mx-auto h-4 w-4 text-emerald-600" strokeWidth={2.5} aria-label="Full support" />;
  if (v === "p") return <Minus className="mx-auto h-4 w-4 text-amber-600" strokeWidth={2.5} aria-label="Partial" />;
  return <X className="mx-auto h-4 w-4 text-zinc-300" strokeWidth={2.5} aria-label="Not available" />;
}

const painPoints = [
  {
    icon: Brain,
    title: "No AI intelligence",
    body: "Legacy tools record data but never suggest the next action - reorders, calls, and slow movers are all manual guesses.",
  },
  {
    icon: MonitorX,
    title: "Desktop-locked software",
    body: "Owners cannot check stock or sales on mobile at trade shows, vendor meetings, or a second location.",
  },
  {
    icon: Puzzle,
    title: "Fragmented toolset",
    body: "Billing in one app, inventory in Excel, karigar on paper, CRM in WhatsApp - no single source of truth.",
  },
  {
    icon: Eye,
    title: "Painful UI design",
    body: "1990s interfaces mean long training, billing errors, and staff who dread the software they use daily.",
  },
  {
    icon: Radio,
    title: "No outreach automation",
    body: "Anniversary reminders and festive offers are manual - or skipped - because nothing identifies who to contact when.",
  },
  {
    icon: FileQuestion,
    title: "Reports without insight",
    body: 'Reports show "gold chain sales −12%" but never explain why or what to do next.',
  },
];

const voiceContrast = [
  {
    old: "Here is your inventory report.",
    gm: "Bridal Choker Set has 3 pcs left. Anita Desai should reorder today. [Send WhatsApp]",
  },
  {
    old: "4 karigar jobs are marked overdue.",
    gm: "Reassign 1 high-priority job to protect delivery dates. Suresh Soni has capacity. [Reassign Now]",
  },
  {
    old: "Gold chain sales down 12% vs last month.",
    gm: "Bundle chain + earrings & ring - upsell potential ₹24,800. Suggest to customer? [Yes / Later]",
  },
];

/** Feature matrix, pain points, and sales-language contrast - placed after Copilot on the landing page */
export default function LandingStoryContinued() {
  return (
    <>
      <section id="compare" className="border-b border-violet-200/60 bg-white py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-6 max-w-3xl">
            <h2 className="font-serif text-3xl font-bold text-zinc-900 sm:text-4xl">Feature gap matrix</h2>
            <p className="mt-2 text-sm text-zinc-600">
              How {GOLDMIND_APP_NAME} stacks up on what jewellers actually need. Full support · partial · absent. Other columns
              are typical market categories - vendor names intentionally withheld.
            </p>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-violet-200/80 shadow-sm">
            <table className="w-full min-w-[720px] border-collapse text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-violet-200 bg-violet-50/90">
                  <th className="sticky left-0 z-10 min-w-[200px] bg-violet-50/95 px-3 py-3 font-semibold text-zinc-900 shadow-[2px_0_8px_-2px_rgba(0,0,0,0.06)]">
                    Feature
                  </th>
                  {Array.from({ length: ANONYMIZED_VENDOR_COLS + 1 }, (_, idx) => {
                    const isGoldMind = idx === ANONYMIZED_VENDOR_COLS;
                    return (
                      <th
                        key={idx}
                        scope="col"
                        className={cn(
                          "min-w-[100px] px-2 py-3 text-center text-[10px] font-semibold leading-tight sm:text-xs",
                          isGoldMind ? "bg-violet-100/90 text-violet-900" : "text-zinc-600",
                        )}
                      >
                        {isGoldMind ? (
                          GOLDMIND_APP_NAME
                        ) : (
                          <span
                            className="inline-block max-w-[92px] select-none blur-[6px] sm:blur-[7px]"
                            aria-label="Other vendor category (anonymized)"
                          >
                            Typical jewellery software {idx + 1}
                          </span>
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {matrixFeatures.map((row) => (
                  <tr key={row.name} className="border-b border-violet-100 hover:bg-violet-50/30">
                    <td className="sticky left-0 bg-white/95 px-3 py-2.5 text-xs font-medium text-zinc-800 shadow-[2px_0_8px_-2px_rgba(0,0,0,0.04)] sm:text-sm">
                      {row.name}
                    </td>
                    {row.cells.map((cell, idx) => (
                      <td
                        key={idx}
                        className={cn(
                          "px-2 py-2.5 text-center",
                          idx === ANONYMIZED_VENDOR_COLS ? "bg-violet-50/50" : "",
                        )}
                      >
                        <MatrixSymbol v={cell} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 flex flex-wrap items-center gap-4 text-xs text-zinc-500">
            <span className="inline-flex items-center gap-1">
              <Check className="h-3.5 w-3.5 text-emerald-600" /> Full
            </span>
            <span className="inline-flex items-center gap-1">
              <Minus className="h-3.5 w-3.5 text-amber-600" /> Partial
            </span>
            <span className="inline-flex items-center gap-1">
              <X className="h-3.5 w-3.5 text-zinc-300" /> Absent
            </span>
          </p>
        </div>
      </section>

      <section id="pain-points" className="border-b border-violet-200/50 bg-gradient-to-b from-violet-50/30 to-white py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-serif text-3xl font-bold text-zinc-900 sm:text-4xl">Why buyers leave legacy tools</h2>
            <p className="mt-2 text-sm text-zinc-600">
              Real friction jewellery owners face - each one is a reason to switch to an AI-first platform.
            </p>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {painPoints.map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="rounded-2xl border border-violet-200/70 bg-white p-5 shadow-sm"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                  <p.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-3 text-sm font-bold text-zinc-900">{p.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-zinc-600">{p.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="voice-shift" className="bg-zinc-50 py-14 sm:py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="text-center">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-violet-700">
              <Sparkles className="h-3.5 w-3.5" />
              Sales language
            </p>
            <h2 className="mt-2 font-serif text-3xl font-bold text-zinc-900 sm:text-4xl">
              What old software says vs what {GOLDMIND_APP_NAME} says
            </h2>
          </div>
          <div className="mt-8 space-y-4">
            {voiceContrast.map((row, i) => (
              <motion.div
                key={row.old}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="grid gap-3 rounded-2xl border border-violet-200/80 bg-white p-4 shadow-sm md:grid-cols-2 md:gap-4 md:p-5"
              >
                <div className="rounded-xl bg-zinc-100/80 px-3 py-2.5 text-sm text-zinc-600">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-400">Legacy</p>
                  <p className="mt-1">{row.old}</p>
                </div>
                <div className="rounded-xl border border-violet-200 bg-violet-50/50 px-3 py-2.5 text-sm text-violet-950">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-violet-600">{GOLDMIND_APP_NAME}</p>
                  <p className="mt-1 font-medium">{row.gm}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
