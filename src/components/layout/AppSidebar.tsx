import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Package, ShoppingCart, Users, UserCog,
  Wallet, BarChart3, ChevronLeft, ChevronRight, Hammer, LogOut,
  Scale, PiggyBank, BookOpen,
} from "lucide-react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { GOLDMIND_AI_LOGO_SRC, GOLDMIND_APP_NAME } from "@/lib/company";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/inventory", label: "Inventory", icon: Package },
  { path: "/sales", label: "Sales & Billing", icon: ShoppingCart },
  { path: "/karigar", label: "Karigar Workflow", icon: Hammer },
  { path: "/customers", label: "Customers", icon: Users },
  { path: "/employees", label: "Employees", icon: UserCog },
  { path: "/accounting", label: "Accounting", icon: Wallet },
  { path: "/day-book", label: "Day Book", icon: BookOpen },
  { path: "/reports", label: "Reports", icon: BarChart3 },
  { path: "/old-gold-exchange", label: "Old Gold Exchange", icon: Scale },
  { path: "/gold-schemes", label: "Gold Schemes", icon: PiggyBank },
];

type SidebarVariant = "desktop" | "mobile";

export default function AppSidebar({
  collapsed,
  onCollapsedChange,
  variant = "desktop",
}: {
  collapsed: boolean;
  onCollapsedChange: (next: boolean) => void;
  variant?: SidebarVariant;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAdminAuth();
  const width = collapsed ? 72 : 260;

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <motion.aside
      animate={{ width }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className={cn(
        "flex flex-col overflow-hidden border-r border-violet-500/25 bg-gradient-to-b from-[#160828] via-[#1f0f3a] to-[#120622] shadow-[4px_0_36px_-8px_rgba(76,29,149,0.55),inset_0_1px_0_rgba(192,132,252,0.09)]",
        /* Never mix `relative` with `fixed` — Tailwind order can leave `relative` winning so the bar stays in-flow and shoves main content down. */
        variant === "desktop"
          ? "fixed left-0 top-0 z-40 max-md:hidden h-[100dvh]"
          : "relative h-screen",
      )}
    >
      <div
        className="pointer-events-none absolute -right-20 top-0 h-56 w-56 rounded-full bg-fuchsia-600/25 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-16 bottom-24 h-44 w-44 rounded-full bg-violet-600/20 blur-3xl"
        aria-hidden
      />
      {/* Logo */}
      <NavLink
        to="/dashboard"
        className="relative z-10 flex h-[4.25rem] shrink-0 items-center border-b border-violet-400/15 bg-gradient-to-r from-violet-950/90 via-purple-950/50 to-transparent px-0 transition-colors hover:from-violet-900/95 hover:via-purple-900/55"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={collapsed ? "collapsed-brand-text" : "expanded-brand-text"}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="flex h-full w-full items-center justify-center px-2"
          >
            {collapsed ? (
              <img
                src={GOLDMIND_AI_LOGO_SRC}
                alt={`${GOLDMIND_APP_NAME} logo`}
                className="h-10 w-10 rounded-xl object-contain ring-1 ring-violet-400/25 drop-shadow-[0_0_14px_rgba(167,139,250,0.35)]"
                width={512}
                height={512}
                decoding="async"
              />
            ) : (
              <div className="flex items-center gap-2.5">
                <img
                  src={GOLDMIND_AI_LOGO_SRC}
                  alt={`${GOLDMIND_APP_NAME} logo`}
                  className="h-10 w-10 rounded-xl object-contain ring-1 ring-violet-400/25 drop-shadow-[0_0_14px_rgba(167,139,250,0.35)]"
                  width={512}
                  height={512}
                  decoding="async"
                />
                <div className="text-center leading-none">
                  <div className="text-[22px] font-bold tracking-tight">
                    <span className="bg-gradient-to-r from-violet-200 via-fuchsia-200 to-purple-300 bg-clip-text text-transparent">
                      Gold
                    </span>
                    <span className="bg-gradient-to-r from-fuchsia-300 via-purple-400 to-violet-400 bg-clip-text text-transparent">
                      Mind
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-violet-300/75">AI Driven ERP for Jewellery RTL/WS</p>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </NavLink>

      {/* Nav */}
      <nav className="app-sidebar-nav-scroll relative z-10 flex-1 space-y-1 overflow-y-auto px-2 py-4">
        {navItems.map((item) => {
          const isActive =
            item.path === "/dashboard"
              ? location.pathname === "/dashboard"
              : location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className="block"
            >
              <motion.div
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.97 }}
                className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-300 ${
                  isActive
                    ? "bg-gradient-to-r from-fuchsia-600/35 via-violet-600/25 to-purple-900/20 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.07)] ring-1 ring-white/10"
                    : "text-violet-200/90 hover:bg-white/[0.06] hover:text-white"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-fuchsia-400 via-purple-400 to-violet-500 shadow-[0_0_12px_rgba(217,70,239,0.55)]"
                  />
                )}
                <item.icon
                  className={`h-5 w-5 flex-shrink-0 ${
                    isActive ? "text-fuchsia-200" : "text-violet-400/80 group-hover:text-violet-100"
                  }`}
                />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="whitespace-nowrap text-sm font-medium"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </NavLink>
          );
        })}
      </nav>

      <div className="relative z-10 border-t border-violet-400/15 bg-violet-950/25 p-2 backdrop-blur-[2px]">
        <button
          type="button"
          onClick={handleLogout}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-violet-200/90 transition-colors hover:bg-rose-500/15 hover:text-rose-100 ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <LogOut className="h-5 w-5 flex-shrink-0 text-violet-400/90" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="whitespace-nowrap text-sm font-medium"
              >
                Log out
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Collapse */}
      {variant === "desktop" && (
        <div className="relative z-10 border-t border-violet-400/15 p-2">
          <button
            type="button"
            onClick={() => onCollapsedChange(!collapsed)}
            className="flex w-full items-center justify-center rounded-xl py-2.5 text-violet-400 transition-colors hover:bg-white/[0.07] hover:text-violet-100"
          >
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>
      )}
    </motion.aside>
  );
}
