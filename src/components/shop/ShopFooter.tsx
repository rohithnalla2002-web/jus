import { Link } from "react-router-dom";
import { Facebook, Instagram, Gem, Twitter, Youtube } from "lucide-react";

export default function ShopFooter() {
  return (
    <footer className="border-t border-amber-200/70 bg-white/90 text-zinc-600 shadow-[0_-4px_24px_-8px_rgba(180,83,9,0.08)]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 text-zinc-900">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-yellow-700">
                <Gem className="h-4 w-4 text-black" />
              </div>
              <span className="font-serif text-lg font-semibold">Gilded Gem</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-zinc-600">
              Heritage gold craftsmanship. BIS hallmarked pieces for weddings, celebrations, and everyday luxury.
            </p>
            <div className="mt-4 flex gap-3">
              {[Instagram, Facebook, Twitter, Youtube].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-amber-200 text-zinc-500 transition-all hover:border-amber-400 hover:bg-amber-50 hover:text-amber-800"
                  aria-label="Social"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
          <div>
            <p className="font-semibold text-zinc-900">Quick links</p>
            <ul className="mt-4 space-y-2 text-sm">
              {[
                ["/", "Home"],
                ["/products", "Products"],
                ["/about", "About Us"],
                ["/contact", "Contact"],
                ["/cart", "Your Cart"],
              ].map(([to, label]) => (
                <li key={to}>
                  <Link to={to} className="text-zinc-600 hover:text-amber-800 transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-semibold text-zinc-900">Collections</p>
            <ul className="mt-4 space-y-2 text-sm">
              {["Rings", "Necklaces", "Earrings", "Bridal"].map((c) => (
                <li key={c}>
                  <Link to={`/products?category=${encodeURIComponent(c)}`} className="text-zinc-600 hover:text-amber-800 transition-colors">
                    {c}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-semibold text-zinc-900">Visit</p>
            <p className="mt-4 text-sm leading-relaxed text-zinc-600">
              12 Jubilee Hills Road
              <br />
              Hyderabad, Telangana 500033
              <br />
              <span className="font-medium text-amber-800">+91 40 1234 5678</span>
              <br />
              care@gildedgem.in
            </p>
          </div>
        </div>
        <div className="mt-10 border-t border-amber-200/60 pt-8 text-center text-xs text-zinc-500">
          © {new Date().getFullYear()} Gilded Gem Jewellers. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
