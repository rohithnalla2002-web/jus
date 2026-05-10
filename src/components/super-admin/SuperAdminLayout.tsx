import { ReactNode, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useLocation } from "react-router-dom";
import SuperAdminSidebar from "./SuperAdminSidebar";
import SuperAdminTopbar from "./SuperAdminTopbar";

export default function SuperAdminLayout({
  children,
  search = "",
  onSearchChange = () => {},
}: {
  children: ReactNode;
  search?: string;
  onSearchChange?: (value: string) => void;
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <SuperAdminSidebar />
      <div className="flex min-h-screen min-w-0 max-w-full flex-col overflow-x-hidden bg-background transition-all duration-300 md:min-h-0 md:h-[100dvh] md:max-h-[100dvh] md:overflow-hidden md:pl-[270px]">
        <SuperAdminTopbar search={search} onSearchChange={onSearchChange} onOpenMobileNav={() => setMobileNavOpen(true)} />
        <main className="relative min-w-0 flex-1 overflow-x-hidden px-3 py-4 sm:px-5 sm:py-6 md:min-h-0 md:basis-0 md:overflow-y-auto md:overscroll-y-contain">
          {children}
        </main>
      </div>

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
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                className="absolute right-3 top-3 z-[60] rounded-lg p-2 glass transition-colors hover:bg-secondary"
                aria-label="Close navigation"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
              <SuperAdminSidebar variant="mobile" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
