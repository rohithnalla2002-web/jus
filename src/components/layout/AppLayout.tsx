import { ReactNode, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useAppDemo } from "@/context/AppDemoContext";
import AppSidebar from "./AppSidebar";
import TopNavbar from "./TopNavbar";
import AiInsightsSection, { aiInsightRenderedInPageBody } from "./AiInsightsSection";

export default function AppLayout({ children }: { children: ReactNode }) {
  const { dataLoading, dataError } = useAppDemo();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const location = useLocation();

  // Close the mobile drawer after navigation.
  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-background">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <AppSidebar
          collapsed={collapsed}
          onCollapsedChange={setCollapsed}
          variant="desktop"
        />
      </div>

      <div className={`flex-1 flex flex-col transition-all duration-300 min-w-0 ${collapsed ? "md:ml-[72px]" : "md:ml-[260px]"}`}>
        <TopNavbar onOpenMobileNav={() => setMobileNavOpen(true)} />
        {dataError && (
          <div className="mx-4 sm:mx-6 mt-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
            Data API error: {dataError}. Run <code className="text-xs">npm run dev --prefix server</code> and ensure PostgreSQL is up, then refresh.
          </div>
        )}
        <motion.main
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex-1 p-4 sm:p-6 relative"
        >
          {dataLoading && !dataError && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/70 backdrop-blur-sm rounded-lg">
              <p className="text-sm text-muted-foreground">Loading data…</p>
            </div>
          )}

          {!aiInsightRenderedInPageBody(location.pathname) && <AiInsightsSection />}

          {children}
        </motion.main>
      </div>

      {/* Mobile sidebar drawer */}
      <AnimatePresence>
        {mobileNavOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 md:hidden"
            onClick={() => setMobileNavOpen(false)}
          >
            <div className="absolute inset-0 bg-background/75 backdrop-blur-sm" />

            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                className="absolute top-3 right-3 z-[60] p-2 rounded-lg glass hover:bg-secondary transition-colors"
                aria-label="Close navigation"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>

              <AppSidebar
                collapsed={false}
                onCollapsedChange={() => {}}
                variant="mobile"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
