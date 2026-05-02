import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Check } from "lucide-react";
import { useAppDemo } from "@/context/AppDemoContext";
import { getProductImageUrl, getShopCategory, shortDescription } from "@/lib/shopUtils";
import { useShopCart } from "@/context/ShopCartContext";

export default function ProductDetailPage() {
  const { productId } = useParams<{ productId: string }>();
  const { inventory } = useAppDemo();
  const { addToCart } = useShopCart();
  const [zoomed, setZoomed] = useState(false);
  const id = Number(productId);
  const product = inventory.find((p) => p.id === id);

  const related = useMemo(() => {
    if (!product) return [];
    const cat = getShopCategory(product);
    return inventory.filter((p) => p.id !== product.id && (getShopCategory(p) === cat || p.category === product.category)).slice(0, 4);
  }, [inventory, product]);

  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 text-center text-zinc-600">
        <p>Product not found.</p>
        <Link to="/products" className="mt-4 inline-block font-medium text-violet-800 hover:underline">
          Back to products
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <Link to="/products" className="inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-violet-800">
        <ArrowLeft className="h-4 w-4" /> Back to products
      </Link>

      <div className="mt-8 grid grid-cols-1 gap-12 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`relative overflow-hidden rounded-3xl border border-violet-200 bg-white shadow-lg ${zoomed ? "cursor-zoom-out" : "cursor-zoom-in"}`}
          onClick={() => setZoomed((z) => !z)}
        >
          <img
            src={getProductImageUrl(product)}
            alt={product.name}
            className={`w-full object-cover transition-transform duration-500 ${zoomed ? "scale-125" : "scale-100"}`}
            style={{ maxHeight: zoomed ? "none" : "min(70vh, 640px)" }}
          />
          <p className="absolute bottom-4 left-4 rounded-full bg-white/90 px-3 py-1 text-xs text-zinc-700 shadow-md">
            Tap to {zoomed ? "zoom out" : "zoom"}
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <p className="text-sm font-medium text-violet-800">{getShopCategory(product)}</p>
          <h1 className="mt-2 font-serif text-4xl font-bold text-zinc-900">{product.name}</h1>
          <p className="mt-4 text-2xl font-bold text-violet-800">{product.price}</p>
          <p className="mt-4 text-sm leading-relaxed text-zinc-600">{shortDescription(product)}</p>
          <ul className="mt-6 space-y-2 text-sm text-zinc-700">
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 shrink-0 text-violet-600" /> Weight: {product.weight}
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 shrink-0 text-violet-600" /> Purity: {product.purity}
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 shrink-0 text-violet-600" /> Hallmark: {product.hallmark ? "Yes" : "No"}
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 shrink-0 text-violet-600" /> In stock: {product.stock} units
            </li>
          </ul>
          <button
            type="button"
            onClick={() => addToCart(product.id, 1)}
            className="mt-10 w-full rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-500 to-purple-700 py-4 text-lg font-bold text-white shadow-lg shadow-violet-400/45 transition-transform hover:scale-[1.01]"
          >
            Add to Cart
          </button>
        </motion.div>
      </div>

      {related.length > 0 && (
        <section className="mt-20 border-t border-violet-200/80 pt-16">
          <h2 className="font-serif text-2xl font-bold text-zinc-900">You may also like</h2>
          <div className="mt-8 grid grid-cols-2 gap-6 lg:grid-cols-4">
            {related.map((item) => (
              <Link
                key={item.id}
                to={`/product/${item.id}`}
                className="group overflow-hidden rounded-xl border border-violet-200 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <img src={getProductImageUrl(item)} alt={item.name} className="aspect-square w-full bg-violet-50 object-cover transition-transform group-hover:scale-105" />
                <div className="p-3">
                  <p className="line-clamp-1 font-medium text-zinc-900">{item.name}</p>
                  <p className="text-sm font-semibold text-violet-800">{item.price}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
