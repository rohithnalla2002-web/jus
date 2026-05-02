import { motion } from "framer-motion";
import { Award, Shield, Sparkles } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-serif text-4xl font-bold text-zinc-900">Our Story</h1>
        <p className="mt-6 text-lg leading-relaxed text-zinc-600">
          GoldMind ERP is the jewellery retail and workshop platform from Appera Private Limited. We focus on transparent inventory,
          hallmark-ready catalogue data, karigar workflow, and billing — so your team can serve customers with confidence from showroom to
          workshop.
        </p>
      </motion.div>

      <div className="mt-12 grid gap-6 sm:grid-cols-3">
        {[
          { icon: Shield, title: "Trust", desc: "Hallmarking & transparent pricing" },
          { icon: Award, title: "Craft", desc: "Master artisans, fine finishing" },
          { icon: Sparkles, title: "Service", desc: "Custom orders & lifetime care" },
        ].map(({ icon: Icon, title, desc }, i) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-2xl border border-violet-200/80 bg-white p-6 text-center shadow-md"
          >
            <Icon className="mx-auto h-8 w-8 text-violet-600" />
            <h3 className="mt-4 font-serif text-lg font-semibold text-zinc-900">{title}</h3>
            <p className="mt-2 text-sm text-zinc-600">{desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
