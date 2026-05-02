import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { GOLDMIND_APP_NAME } from "@/lib/company";
import { cn } from "@/lib/utils";
import MarketPositioningAiAgent from "@/components/shop/MarketPositioningAiAgent";

const aiLayers = [
  {
    step: "01",
    title: "Predict",
    tag: "Layer 1",
    headline: "AI sees what's coming",
    body: "Demand forecasting, slow-mover detection, and seasonal patterns - with recommended actions before stock-outs hit.",
    example:
      "“Gold Chain 22KT demand is rising. Reorder 120–150 pcs to avoid stockout in 7 days.” One-tap purchase intent on the dashboard.",
    accent: "from-violet-600 to-indigo-700",
  },
  {
    step: "02",
    title: "Act",
    tag: "Layer 2",
    headline: "AI tells you what to do today",
    body: "Contextual Copilot cards on every screen - specific people, tasks, and urgency. Not generic alerts.",
    example:
      "“4 jobs overdue. Ask Suresh & Ramesh to run final QC before dispatch.” WhatsApp from the card.",
    accent: "from-fuchsia-600 to-violet-700",
  },
  {
    step: "03",
    title: "Connect",
    tag: "Layer 3",
    headline: "AI sends the message for you",
    body: "AI Connect fires WhatsApp or email to the right customer at the right time. You approve once - no copy-paste.",
    example:
      "“Anita Desai should raise a purchase request today.” Tap WhatsApp - message sent in seconds.",
    accent: "from-emerald-600 to-teal-700",
  },
];

export default function LandingStorySections() {
  return (
    <>
      {/* Positioning */}
      <section
        id="positioning"
        className="relative overflow-hidden border-b border-violet-200/60 bg-gradient-to-b from-white via-violet-50/40 to-white py-14 sm:py-16"
      >
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-14">
          <div className="order-1 text-center lg:order-1 lg:text-left">
            <p className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-700">
              Market positioning
            </p>
            <blockquote className="mt-6 font-serif text-2xl font-bold leading-snug text-zinc-900 sm:text-3xl md:text-[2rem]">
              {GOLDMIND_APP_NAME} is the only jewellery ERP that doesn&apos;t just record your business - {" "}
              <span className="bg-gradient-to-r from-violet-700 to-fuchsia-600 bg-clip-text text-transparent">it runs it.</span>
            </blockquote>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-zinc-600 lg:mx-0">
              Every screen tells you what to do next, who to contact, and helps you act - in WhatsApp or email - with one approval.
              Built for India: GST, karigar workflow, metal inventory, schemes, and old-gold exchange in one cloud platform.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <Link
                to="/#ai-integration"
                className="inline-flex items-center gap-2 rounded-full bg-violet-700 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-violet-800"
              >
                See GoldMind Copilot
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/#compare"
                className="text-sm font-semibold text-violet-800 underline-offset-4 hover:underline"
              >
                Compare the feature matrix
              </Link>
            </div>
          </div>
          <div className="order-2 flex justify-center lg:order-2 lg:justify-end lg:pl-2">
            <MarketPositioningAiAgent className="w-full max-w-[280px] sm:max-w-[320px]" />
          </div>
        </div>
      </section>

      {/* AI Layers - before Copilot demo */}
      <section id="ai-layers" className="border-b border-violet-200/50 bg-gradient-to-br from-zinc-50 via-white to-violet-50/40 py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-700">AI-first model</p>
            <h2 className="mt-2 font-serif text-3xl font-bold text-zinc-900 sm:text-4xl">Predict · Act · Connect</h2>
            <p className="mt-3 text-sm text-zinc-600">
              Three layers competitors haven&apos;t shipped: forecast what&apos;s next, surface the right task, then send the message for you.
            </p>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {aiLayers.map((layer, i) => (
              <motion.article
                key={layer.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col rounded-3xl border border-violet-200/70 bg-white p-6 shadow-md"
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      "rounded-full bg-gradient-to-r px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white",
                      layer.accent,
                    )}
                  >
                    {layer.tag}
                  </span>
                  <span className="font-mono text-xs text-zinc-400">{layer.step}</span>
                </div>
                <h3 className="mt-4 font-serif text-xl font-bold text-zinc-900">{layer.title}</h3>
                <p className="mt-1 text-sm font-semibold text-violet-800">{layer.headline}</p>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-600">{layer.body}</p>
                <div className="mt-4 rounded-2xl border border-violet-100 bg-violet-50/50 px-3 py-2 text-xs italic leading-relaxed text-zinc-700">
                  {layer.example}
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
