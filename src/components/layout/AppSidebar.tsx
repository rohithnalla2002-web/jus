import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Package, ShoppingCart, Users, UserCog,
  Wallet, BarChart3, ChevronLeft, ChevronRight, Hammer, LogOut,
} from "lucide-react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { GoldMindLogoMark } from "@/components/shared/GoldMindBrandLogo";
import { GOLDMIND_APP_NAME } from "@/lib/company";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/inventory", label: "Inventory", icon: Package },
  { path: "/sales", label: "Sales & Billing", icon: ShoppingCart },
  { path: "/karigar", label: "Karigar Workflow", icon: Hammer },
  { path: "/customers", label: "Customers", icon: Users },
  { path: "/employees", label: "Employees", icon: UserCog },
  { path: "/accounting", label: "Accounting", icon: Wallet },
  { path: "/reports", label: "Reports", icon: BarChart3 },
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
      className={`flex flex-col border-r border-border bg-sidebar ${variant === "desktop" ? "fixed left-0 top-0 h-screen z-40" : "relative h-screen"}`}
    >
      {/* Logo */}
      <NavLink
        to="/dashboard"
        className={`flex h-16 items-center gap-3 border-b border-border px-4 transition-colors hover:bg-sidebar-accent/60 ${collapsed ? "justify-center" : ""}`}
      >
        <AnimatePresence mode="wait">
          {collapsed ? (
            <motion.div
              key="collapsed-logo"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <GoldMindLogoMark size="sm" />
            </motion.div>
          ) : (
            <motion.div
              key="expanded-brand"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="flex min-w-0 items-center gap-2 overflow-hidden"
            >
              <GoldMindLogoMark size="sm" />
              <motion.span
                layout
                className="truncate font-serif text-lg font-bold tracking-tight gold-text"
              >
                {GOLDMIND_APP_NAME}
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>
      </NavLink>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
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
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 group relative ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full gold-gradient"
                  />
                )}
                <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`} />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-sm font-medium whitespace-nowrap"
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

      <div className="p-2 border-t border-border">
        <button
          type="button"
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm font-medium whitespace-nowrap"
              >
                Log out
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Collapse */}
      {variant === "desktop" && (
        <div className="p-2 border-t border-border">
          <button
            onClick={() => onCollapsedChange(!collapsed)}
            className="w-full flex items-center justify-center py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
          >
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>
      )}
    </motion.aside>
  );
}
