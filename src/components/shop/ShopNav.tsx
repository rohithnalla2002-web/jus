import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { GoldMindNavbarWordmark } from "@/components/shared/GoldMindBrandLogo";
import { GOLDMIND_APP_NAME } from "@/lib/company";

const links = [
  { to: "/#home", label: "Home" },
  { to: "/#visual-analytics", label: "Analytics" },
  { to: "/#ai-integration", label: "Copilot" },
  { to: "/#why-us", label: "Why Us" },
  { to: "/#core-features", label: "Features" },
  { to: "/#testimonials", label: "Reviews" },
  { to: "/#pricing", label: "Pricing" },
  { to: "/#faqs", label: "FAQs" },
  { to: "/#contact", label: "Contact" },
];

export default function ShopNav() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [activeHash, setActiveHash] = useState(location.hash || "#home");
  const sectionIds = links.map((link) => link.to.split("#")[1]).filter(Boolean);

  useEffect(() => {
    setActiveHash(location.hash || "#home");
  }, [location.hash, location.pathname]);

  useEffect(() => {
    if (location.pathname !== "/") return;

    const updateActiveSection = () => {
      const scrollMarker = window.scrollY + 130;
      let current = "#home";

      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (scrollMarker >= el.offsetTop) current = `#${id}`;
      }

      setActiveHash((prev) => (prev === current ? prev : current));
      if (window.location.hash !== current) {
        window.history.replaceState(null, "", `${location.pathname}${current}`);
      }
    };

    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    return () => window.removeEventListener("scroll", updateActiveSection);
  }, [location.pathname, sectionIds]);

  return (
    <header className="sticky top-0 z-50 border-b border-violet-200/60 bg-white/80 backdrop-blur-2xl shadow-[0_8px_28px_-16px_rgba(91,33,182,0.35)]">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link
          to="/#home"
          className="group flex min-w-0 items-center rounded-xl outline-none ring-violet-400/30 transition-all hover:opacity-95 focus-visible:ring-2"
          aria-label={GOLDMIND_APP_NAME}
        >
          <GoldMindNavbarWordmark className="transition-transform duration-300 group-hover:scale-[1.02]" />
        </Link>

        <nav className="hidden md:flex items-center gap-1 rounded-2xl border border-violet-200/70 bg-white/85 p-1.5 shadow-sm">
          {links.map((link) => (
            <motion.div key={link.to} className="relative">
              {activeHash === link.to.replace("/", "") ? (
                <motion.span
                  layoutId="shop-nav-active-pill"
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-violet-100 to-fuchsia-100"
                  transition={{ type: "spring", stiffness: 330, damping: 30 }}
                />
              ) : null}
              <Link
                to={link.to}
                className={`relative z-10 block rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                  activeHash === link.to.replace("/", "")
                    ? "text-violet-900"
                    : "text-zinc-600 hover:text-violet-800"
                }`}
              >
                {link.label}
              </Link>
            </motion.div>
          ))}
          <button
            type="button"
            onClick={() => navigate("/admin/login")}
            className="ml-2 inline-flex items-center rounded-xl border border-violet-500/40 bg-gradient-to-r from-violet-100 to-fuchsia-100 px-4 py-2 text-xs font-semibold text-violet-900 transition-all hover:shadow-md hover:shadow-violet-200/60"
          >
            Login (Admin)
          </button>
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="rounded-xl border border-violet-200/80 bg-white p-2 text-zinc-700 shadow-sm hover:bg-violet-50"
            aria-label="Menu"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden border-t border-violet-200/60 bg-white/95 backdrop-blur md:hidden"
          >
            <div className="flex flex-col gap-1 p-4">
              {links.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-3 py-3 text-zinc-700 hover:bg-violet-50 hover:text-violet-900"
                >
                  {link.label}
                </Link>
              ))}
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  navigate("/admin/login");
                }}
                className="mt-2 inline-flex items-center justify-center rounded-xl border border-violet-300 bg-violet-50 py-3 text-center font-semibold text-violet-900"
              >
                Login (Admin)
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
