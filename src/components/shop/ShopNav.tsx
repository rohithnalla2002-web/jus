import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Gem, Menu, ShoppingBag, X } from "lucide-react";
import { useShopCart } from "@/context/ShopCartContext";

const links = [
  { to: "/", label: "Home" },
  { to: "/products", label: "Products" },
  { to: "/products#categories", label: "Categories" },
  { to: "/about", label: "About Us" },
  { to: "/contact", label: "Contact" },
];

export default function ShopNav() {
  const [open, setOpen] = useState(false);
  const { getLineCount } = useShopCart();
  const navigate = useNavigate();
  const count = getLineCount();

  return (
    <header className="sticky top-0 z-50 border-b border-amber-200/60 bg-white/85 backdrop-blur-xl shadow-sm shadow-amber-900/5">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 via-yellow-600 to-amber-800 shadow-lg shadow-amber-500/30 transition-transform group-hover:scale-105">
            <Gem className="h-5 w-5 text-black" />
          </div>
          <div>
            <p className="font-serif text-lg font-bold tracking-tight text-zinc-900">Gilded Gem</p>
            <p className="text-[10px] uppercase tracking-[0.2em] text-amber-700">Fine Jewelry</p>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "text-amber-900 bg-amber-100/80"
                    : "text-zinc-600 hover:text-amber-800 hover:bg-amber-50"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
          <button
            type="button"
            onClick={() => navigate("/admin/login")}
            className="ml-2 rounded-full border border-amber-600/40 px-4 py-2 text-sm font-semibold text-amber-900 transition-all hover:bg-amber-100 hover:border-amber-500 hover:shadow-md hover:shadow-amber-200/50"
          >
            Login (Admin)
          </button>
          <Link
            to="/cart"
            className="relative ml-2 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-amber-700 text-black shadow-md shadow-amber-300/60 transition-transform hover:scale-105"
          >
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-zinc-900 px-1 text-[10px] font-bold text-amber-300 ring-2 ring-amber-400">
                {count > 99 ? "99+" : count}
              </span>
            )}
          </Link>
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <Link to="/cart" className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-yellow-700 text-black">
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 h-4 min-w-4 rounded-full bg-zinc-900 px-1 text-[9px] font-bold text-amber-300">
                {count}
              </span>
            )}
          </Link>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="rounded-lg p-2 text-zinc-700 hover:bg-amber-50"
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
            className="overflow-hidden border-t border-amber-200/60 bg-white md:hidden"
          >
            <div className="flex flex-col gap-1 p-4">
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-3 text-zinc-700 hover:bg-amber-50 hover:text-amber-900"
                >
                  {link.label}
                </NavLink>
              ))}
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  navigate("/admin/login");
                }}
                className="mt-2 rounded-xl border border-amber-300 py-3 text-center font-semibold text-amber-900"
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
