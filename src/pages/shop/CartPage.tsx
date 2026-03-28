import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";
import { useAppDemo } from "@/context/AppDemoContext";
import { formatCurrency, parseCurrency } from "@/lib/demo";
import { getProductImageUrl } from "@/lib/shopUtils";
import { useShopCart } from "@/context/ShopCartContext";

export default function CartPage() {
  const { inventory } = useAppDemo();
  const { lines, removeFromCart, setQuantity, getSubtotal, clearCart } = useShopCart();

  const resolvePrice = (id: number) => {
    const item = inventory.find((i) => i.id === id);
    return item ? parseCurrency(item.price) : 0;
  };

  const subtotal = getSubtotal(resolvePrice);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <h1 className="font-serif text-4xl font-bold text-zinc-900">Your Cart</h1>
      <p className="mt-2 text-sm text-zinc-600">Review items before checkout.</p>

      {lines.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-dashed border-amber-300 bg-white/80 p-12 text-center text-zinc-600">
          <p>Your cart is empty.</p>
          <Link to="/products" className="mt-4 inline-block font-semibold text-amber-800 hover:underline">
            Browse products
          </Link>
        </div>
      ) : (
        <div className="mt-10 space-y-4">
          {lines.map((line) => {
            const item = inventory.find((i) => i.id === line.productId);
            if (!item) return null;
            const lineTotal = parseCurrency(item.price) * line.quantity;
            return (
              <motion.div
                key={line.productId}
                layout
                className="flex gap-4 rounded-2xl border border-amber-200/80 bg-white p-4 shadow-md"
              >
                <img src={getProductImageUrl(item)} alt={item.name} className="h-24 w-24 rounded-xl object-cover sm:h-28 sm:w-28" />
                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <Link to={`/product/${item.id}`} className="font-semibold text-zinc-900 hover:text-amber-800">
                      {item.name}
                    </Link>
                    <p className="text-sm text-amber-800">{item.price} each</p>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setQuantity(line.productId, line.quantity - 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-200 text-zinc-800 hover:bg-amber-50"
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-sm font-medium text-zinc-900">{line.quantity}</span>
                      <button
                        type="button"
                        onClick={() => setQuantity(line.productId, line.quantity + 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-200 text-zinc-800 hover:bg-amber-50"
                      >
                        +
                      </button>
                    </div>
                    <p className="text-sm font-semibold text-zinc-900">{formatCurrency(lineTotal)}</p>
                    <button
                      type="button"
                      onClick={() => removeFromCart(line.productId)}
                      className="ml-auto text-zinc-400 hover:text-red-600"
                      aria-label="Remove"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}

          <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-6 shadow-inner">
            <div className="flex items-center justify-between text-lg">
              <span className="text-zinc-600">Total</span>
              <span className="font-serif text-2xl font-bold text-amber-900">{formatCurrency(subtotal)}</span>
            </div>
            <p className="mt-2 text-xs text-zinc-600">Taxes and making charges may apply at checkout (demo).</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={clearCart}
                className="rounded-xl border border-amber-300 px-5 py-3 text-sm font-semibold text-zinc-700 hover:bg-white"
              >
                Clear cart
              </button>
              <Link
                to="/products"
                className="rounded-xl bg-gradient-to-r from-amber-500 to-amber-700 px-6 py-3 text-sm font-bold text-white shadow-md"
              >
                Continue shopping
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
