import { useMemo, useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal } from "lucide-react";
import { useAppDemo } from "@/context/AppDemoContext";
import { parseCurrency } from "@/lib/demo";
import { getProductImageUrl, getShopCategory, shortDescription, popularityScore, SHOP_CATEGORIES } from "@/lib/shopUtils";
import { useShopCart } from "@/context/ShopCartContext";

export default function ProductsPage() {
  const { inventory } = useAppDemo();
  const { addToCart } = useShopCart();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("All");
  const [sort, setSort] = useState<"popular" | "price-asc" | "price-desc" | "name">("popular");
  const [priceMax, setPriceMax] = useState<number>(20000000);

  useEffect(() => {
    const c = searchParams.get("category");
    if (c) setCategory(c);
  }, [searchParams]);

  const filtered = useMemo(() => {
    let list = [...inventory];
    if (category !== "All") {
      list = list.filter((item) => {
        const shopCat = getShopCategory(item);
        return shopCat === category || item.category === category;
      });
    }
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          getShopCategory(item).toLowerCase().includes(q),
      );
    }
    list = list.filter((item) => parseCurrency(item.price) <= priceMax);
    if (sort === "price-asc") list.sort((a, b) => parseCurrency(a.price) - parseCurrency(b.price));
    else if (sort === "price-desc") list.sort((a, b) => parseCurrency(b.price) - parseCurrency(a.price));
    else if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name));
    else list.sort((a, b) => popularityScore(b) - popularityScore(a));
    return list;
  }, [inventory, category, search, sort, priceMax]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <h1 className="font-serif text-4xl font-bold text-zinc-900">All Products</h1>
        <p className="mt-2 text-sm text-zinc-600">Filter by category, price, and popularity.</p>
      </motion.div>

      <div id="categories" className="mt-10 rounded-2xl border border-amber-200/80 bg-white/90 p-4 shadow-md shadow-amber-100/40 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or category..."
              className="w-full rounded-xl border border-amber-200 bg-white py-3 pl-10 pr-4 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-amber-500 focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-zinc-600">
              <SlidersHorizontal className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wider">Sort</span>
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
              className="rounded-xl border border-amber-200 bg-white px-3 py-2.5 text-sm text-zinc-900 focus:border-amber-500 focus:outline-none"
            >
              <option value="popular">Popularity</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name">Name A–Z</option>
            </select>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-600">Category</span>
          <div className="flex flex-wrap gap-2">
            {SHOP_CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  setCategory(c);
                  if (c === "All") searchParams.delete("category");
                  else searchParams.set("category", c);
                  setSearchParams(searchParams, { replace: true });
                }}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                  category === c
                    ? "bg-gradient-to-r from-amber-500 to-amber-700 text-white shadow-md"
                    : "border border-amber-200 text-zinc-700 hover:border-amber-400 hover:bg-amber-50"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-600">Max price (₹)</label>
          <input
            type="range"
            min={50000}
            max={10000000}
            step={50000}
            value={Math.min(priceMax, 10000000)}
            onChange={(e) => setPriceMax(Number(e.target.value))}
            className="mt-2 w-full accent-amber-500"
          />
          <p className="mt-1 text-xs text-zinc-600">Up to ₹{(priceMax / 100000).toFixed(1)}L</p>
        </div>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((item, i) => (
          <motion.article
            key={item.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.04, 0.4) }}
            className="group overflow-hidden rounded-2xl border border-amber-200/80 bg-white shadow-md transition-all hover:border-amber-300 hover:shadow-xl hover:shadow-amber-200/30"
          >
            <Link to={`/product/${item.id}`} className="block overflow-hidden">
              <div className="aspect-square overflow-hidden bg-amber-50">
                <img
                  src={getProductImageUrl(item)}
                  alt={item.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
            </Link>
            <div className="p-5">
              <p className="text-xs font-medium text-amber-800">{getShopCategory(item)}</p>
              <h2 className="mt-1 font-serif text-xl font-semibold text-zinc-900">{item.name}</h2>
              <p className="mt-2 line-clamp-2 text-sm text-zinc-600">{shortDescription(item)}</p>
              <p className="mt-3 text-lg font-bold text-amber-800">{item.price}</p>
              <div className="mt-4 flex gap-2">
                <Link
                  to={`/product/${item.id}`}
                  className="flex-1 rounded-xl border border-amber-200 py-2.5 text-center text-sm font-semibold text-zinc-800 hover:border-amber-400 hover:bg-amber-50"
                >
                  View Details
                </Link>
                <button
                  type="button"
                  onClick={() => addToCart(item.id, 1)}
                  className="flex-1 rounded-xl bg-gradient-to-r from-amber-500 to-amber-700 py-2.5 text-sm font-bold text-white shadow-md"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          </motion.article>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="mt-16 text-center text-zinc-500">No products match your filters. Try adjusting category or price.</p>
      )}
    </div>
  );
}
