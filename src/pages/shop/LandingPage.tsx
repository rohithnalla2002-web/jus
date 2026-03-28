import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { useAppDemo } from "@/context/AppDemoContext";
import { getProductImageUrl, getShopCategory, shortDescription } from "@/lib/shopUtils";
import { useShopCart } from "@/context/ShopCartContext";

const fadeUp = { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 } };

const categoryChips = ["Rings", "Necklaces", "Earrings", "Bracelets", "Bridal"];

export default function LandingPage() {
  const { inventory } = useAppDemo();
  const { addToCart } = useShopCart();
  const featured = [...inventory].filter((i) => i.highSelling).slice(0, 4);
  const displayFeatured = featured.length >= 4 ? featured : inventory.slice(0, 4);

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-br from-[#fffef9] via-[#faf6ef] to-[#f3e8d8]">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=1920&q=80)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#fefdfb] via-[#fefdfb]/95 to-[#fefdfb]/70" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(251,191,36,0.2),transparent_55%)]" />

        <div className="relative mx-auto flex min-h-[78vh] max-w-7xl flex-col justify-center px-4 py-16 sm:px-6 sm:py-20">
          <motion.div {...fadeUp} transition={{ duration: 0.6 }} className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/80 bg-amber-100/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-amber-900">
              <Sparkles className="h-3.5 w-3.5 text-amber-600" /> Since 1987
            </span>
            <h1 className="mt-6 font-serif text-4xl font-bold leading-tight text-zinc-900 sm:text-5xl md:text-6xl">
              Timeless <span className="gold-text-shop">Gold</span> for Every Moment
            </h1>
            <p className="mt-6 text-lg text-zinc-600">
              Handcrafted hallmarked jewellery — from bridal sets to everyday elegance. Discover pieces that shine for generations.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                to="/products"
                className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 px-8 py-4 text-sm font-bold text-black shadow-lg shadow-amber-300/50 transition-all hover:scale-[1.02] hover:shadow-amber-400/40"
              >
                Shop Now
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to="/about"
                className="rounded-full border-2 border-amber-300/80 bg-white/60 px-8 py-4 text-sm font-semibold text-zinc-800 backdrop-blur-sm transition-all hover:border-amber-500 hover:bg-amber-50"
              >
                Our Story
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="categories" className="border-y border-amber-200/60 bg-white/70 py-16 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <motion.div {...fadeUp} viewport={{ once: true }} initial="initial" whileInView="animate" className="text-center">
            <h2 className="font-serif text-3xl font-bold text-zinc-900 sm:text-4xl">Shop by Category</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-zinc-600">Explore curated collections — tap a category to browse.</p>
          </motion.div>
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
            {categoryChips.map((cat, i) => (
              <motion.div
                key={cat}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
              >
                <Link
                  to={`/products?category=${encodeURIComponent(cat)}`}
                  className="group flex flex-col items-center rounded-2xl border border-amber-200/80 bg-white p-6 shadow-sm transition-all hover:border-amber-400 hover:shadow-lg hover:shadow-amber-200/40"
                >
                  <span className="text-3xl text-amber-600 transition-transform group-hover:scale-110">✦</span>
                  <span className="mt-3 text-sm font-semibold text-zinc-800 group-hover:text-amber-900">{cat}</span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 className="font-serif text-3xl font-bold text-zinc-900">Featured Pieces</h2>
              <p className="mt-2 text-sm text-zinc-600">Hand-picked from our showroom — limited stock.</p>
            </div>
            <Link to="/products" className="text-sm font-semibold text-amber-800 hover:text-amber-950">
              View all →
            </Link>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {displayFeatured.map((item, i) => (
              <motion.article
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="group overflow-hidden rounded-2xl border border-amber-200/70 bg-white shadow-md transition-all hover:border-amber-300 hover:shadow-xl hover:shadow-amber-200/30"
              >
                <Link to={`/product/${item.id}`} className="block overflow-hidden">
                  <div className="aspect-[4/5] overflow-hidden bg-amber-50">
                    <img
                      src={getProductImageUrl(item)}
                      alt={item.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                </Link>
                <div className="p-5">
                  <p className="text-xs font-medium uppercase tracking-wider text-amber-800">{getShopCategory(item)}</p>
                  <h3 className="mt-1 font-serif text-lg font-semibold text-zinc-900">{item.name}</h3>
                  <p className="mt-2 line-clamp-2 text-xs text-zinc-600">{shortDescription(item)}</p>
                  <p className="mt-3 text-lg font-bold text-amber-800">{item.price}</p>
                  <div className="mt-4 flex gap-2">
                    <Link
                      to={`/product/${item.id}`}
                      className="flex-1 rounded-xl border border-amber-200 py-2.5 text-center text-xs font-semibold text-zinc-800 transition-colors hover:border-amber-400 hover:bg-amber-50"
                    >
                      View Details
                    </Link>
                    <button
                      type="button"
                      onClick={() => addToCart(item.id, 1)}
                      className="flex-1 rounded-xl bg-gradient-to-r from-amber-500 to-amber-700 py-2.5 text-xs font-bold text-white shadow-md"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
