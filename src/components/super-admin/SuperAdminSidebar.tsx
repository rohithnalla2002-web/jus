import { NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Activity, BarChart3, HelpCircle, LayoutDashboard, LifeBuoy, LogOut, Settings, Users } from "lucide-react";
import { GoldMindLogoMark } from "@/components/shared/GoldMindBrandLogo";
import { useSuperAdminAuth } from "@/context/SuperAdminAuthContext";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/super-admin", label: "Command Center", icon: LayoutDashboard, end: true },
  { path: "/super-admin/admins", label: "Admins", icon: Users },
  { path: "/super-admin/tickets", label: "Tickets", icon: LifeBuoy },
  { path: "/super-admin/faqs", label: "FAQs", icon: HelpCircle },
  { path: "/super-admin/monitoring", label: "Monitoring", icon: BarChart3 },
  { path: "/super-admin/audit", label: "Audit Logs", icon: Activity },
  { path: "/super-admin/settings", label: "Settings", icon: Settings },
];

export default function SuperAdminSidebar({ variant = "desktop" }: { variant?: "desktop" | "mobile" }) {
  const navigate = useNavigate();
  const { logout } = useSuperAdminAuth();

  const handleLogout = () => {
    logout();
    navigate("/super-admin/login", { replace: true });
  };

  return (
    <motion.aside
      initial={false}
      className={cn(
        "flex w-[270px] flex-col overflow-hidden border-r border-violet-500/25 bg-gradient-to-b from-[#12051f] via-[#241046] to-[#10051f] shadow-[4px_0_36px_-8px_rgba(76,29,149,0.55)]",
        variant === "desktop" ? "fixed left-0 top-0 z-40 h-[100dvh] max-md:hidden" : "relative h-screen",
      )}
    >
      <div className="pointer-events-none absolute -right-20 top-4 h-56 w-56 rounded-full bg-fuchsia-500/25 blur-3xl" />
      <div className="pointer-events-none absolute -left-16 bottom-24 h-44 w-44 rounded-full bg-cyan-400/10 blur-3xl" />

      <NavLink
        to="/super-admin"
        className="relative z-10 flex h-[4.75rem] items-center gap-3 border-b border-violet-400/15 px-5"
      >
        <GoldMindLogoMark size="md" />
        <div className="min-w-0">
          <p className="bg-gradient-to-r from-violet-100 via-fuchsia-200 to-cyan-100 bg-clip-text text-lg font-bold text-transparent">
            Super Admin
          </p>
          <p className="text-[11px] text-violet-200/70">Platform control suite</p>
        </div>
      </NavLink>

      <nav className="app-sidebar-nav-scroll relative z-10 flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => (
          <NavLink key={item.path} to={item.path} end={item.end} className="block">
            {({ isActive }) => (
              <motion.div
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all",
                  isActive
                    ? "bg-gradient-to-r from-fuchsia-600/35 via-violet-600/25 to-purple-900/20 text-white ring-1 ring-white/10"
                    : "text-violet-200/90 hover:bg-white/[0.06] hover:text-white",
                )}
              >
                {isActive ? <span className="absolute left-0 h-7 w-1 rounded-r-full bg-fuchsia-300" /> : null}
                <item.icon className={cn("h-5 w-5 shrink-0", isActive ? "text-fuchsia-100" : "text-violet-400/90")} />
                <span>{item.label}</span>
              </motion.div>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="relative z-10 border-t border-violet-400/15 p-3">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-violet-200/90 transition-colors hover:bg-rose-500/15 hover:text-rose-100"
        >
          <LogOut className="h-5 w-5 text-violet-300" />
          Log out
        </button>
      </div>
    </motion.aside>
  );
}
