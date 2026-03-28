import { motion } from "framer-motion";
import { TrendingUp, Package, Clock, Gem, LucideIcon } from "lucide-react";

const iconMap: Record<string, LucideIcon> = { TrendingUp, Package, Clock, Gem };

interface StatCardProps {
  label: string;
  value: string;
  change: string;
  positive: boolean;
  icon: string;
  index: number;
}

export default function StatCard({ label, value, change, positive, icon, index }: StatCardProps) {
  const Icon = iconMap[icon] || Gem;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="glass glass-hover card-shine rounded-xl p-5 cursor-default"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${positive ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
          {change}
        </span>
      </div>
      <p className="text-2xl font-bold font-serif text-foreground">{value}</p>
      <p className="text-sm text-muted-foreground mt-1">{label}</p>
    </motion.div>
  );
}
