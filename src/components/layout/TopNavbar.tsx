import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, CheckCheck, Menu, Search, TrendingUp, User, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useAppDemo } from "@/context/AppDemoContext";
import { useAdminAuth } from "@/context/AdminAuthContext";

export default function TopNavbar({ onOpenMobileNav }: { onOpenMobileNav: () => void }) {
  const navigate = useNavigate();
  const { logout, username } = useAdminAuth();
  const {
    globalSearch,
    setGlobalSearch,
    notifications,
    unreadNotifications,
    markNotificationRead,
    markAllNotificationsRead,
  } = useAppDemo();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  return (
    <header className="h-16 border-b border-border glass sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileNav}
          className="md:hidden p-2 rounded-lg hover:bg-secondary transition-colors"
          aria-label="Open navigation"
        >
          <Menu className="w-5 h-5 text-muted-foreground" />
        </button>

        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search jewellery, orders, customers..."
            value={globalSearch}
            onChange={(event) => setGlobalSearch(event.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-secondary/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
          />
          {globalSearch && (
            <button
              type="button"
              onClick={() => setGlobalSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <motion.div
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20"
        >
          <TrendingUp className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-medium text-primary">Gold 24K: ₹7,245/g</span>
        </motion.div>

        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowNotifications((current) => !current);
              setShowProfile(false);
            }}
            className="relative p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            <Bell className="w-5 h-5 text-muted-foreground" />
            {unreadNotifications > 0 && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary animate-pulse-gold" />}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                className="absolute right-0 mt-3 w-[calc(100vw-2rem)] sm:w-80 glass rounded-2xl p-4 gold-glow max-h-[80vh] overflow-hidden"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Notifications</p>
                    <p className="text-xs text-muted-foreground">{unreadNotifications} unread updates</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void markAllNotificationsRead().catch(() => {})}
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                  </button>
                </div>

                <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
                  {notifications.map((notification) => (
                    <button
                      key={notification.id}
                      type="button"
                      onClick={() => void markNotificationRead(notification.id).catch(() => {})}
                      className={`w-full rounded-xl border px-3 py-2 text-left transition-colors ${
                        notification.read
                          ? "border-border/60 bg-card/40"
                          : "border-primary/30 bg-primary/10"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-foreground">{notification.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">{notification.detail}</p>
                        </div>
                        <span className="text-[11px] text-muted-foreground whitespace-nowrap">{notification.time}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="relative pl-3 border-l border-border">
          <button
            type="button"
            onClick={() => {
              setShowProfile((current) => !current);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2"
          >
            <div className="w-8 h-8 rounded-full gold-gradient flex items-center justify-center">
              <User className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-foreground">{username ?? "Admin"}</p>
              <p className="text-xs text-muted-foreground">RatnaERP</p>
            </div>
          </button>

          <AnimatePresence>
            {showProfile && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                className="absolute right-0 mt-3 w-[calc(100vw-2rem)] sm:w-64 glass rounded-2xl p-4 max-h-[80vh] overflow-hidden"
              >
                <p className="text-sm font-semibold text-foreground">Luxury Admin Workspace</p>
                <p className="text-xs text-muted-foreground mt-1">All demo controls are now live across the dashboard.</p>

                <div className="mt-4 rounded-xl bg-secondary/70 p-3 overflow-y-auto max-h-[42vh] pr-1">
                  <p className="text-xs text-muted-foreground">Active search</p>
                  <p className="text-sm font-medium text-foreground mt-1">
                    {globalSearch ? globalSearch : "No active search filter"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setGlobalSearch("");
                    setShowProfile(false);
                  }}
                  className="mt-4 w-full rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                >
                  Clear global search
                </button>
                <Link
                  to="/"
                  onClick={() => setShowProfile(false)}
                  className="mt-2 flex w-full items-center justify-center rounded-xl border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary"
                >
                  View public shop
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setShowProfile(false);
                    navigate("/");
                  }}
                  className="mt-2 w-full rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive"
                >
                  Log out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
