import { ReactNode, createContext, useContext, useEffect, useMemo, useState } from "react";
import { parseCurrency } from "@/lib/demo";
import type { InventoryLike } from "@/lib/shopUtils";

export type CartLine = { productId: number; quantity: number };

type ShopCartContextValue = {
  lines: CartLine[];
  addToCart: (productId: number, quantity?: number) => void;
  removeFromCart: (productId: number) => void;
  setQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  getLineCount: () => number;
  getSubtotal: (resolvePrice: (id: number) => number) => number;
};

const STORAGE_KEY = "jewelcraft-shop-cart";
const ShopCartContext = createContext<ShopCartContextValue | undefined>(undefined);

export function ShopCartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setLines(JSON.parse(raw) as CartLine[]);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines]);

  const value = useMemo<ShopCartContextValue>(
    () => ({
      lines,
      addToCart: (productId, quantity = 1) => {
        setLines((current) => {
          const idx = current.findIndex((l) => l.productId === productId);
          if (idx === -1) return [...current, { productId, quantity }];
          const next = [...current];
          next[idx] = { ...next[idx], quantity: next[idx].quantity + quantity };
          return next;
        });
      },
      removeFromCart: (productId) => setLines((c) => c.filter((l) => l.productId !== productId)),
      setQuantity: (productId, quantity) => {
        if (quantity < 1) {
          setLines((c) => c.filter((l) => l.productId !== productId));
          return;
        }
        setLines((c) => c.map((l) => (l.productId === productId ? { ...l, quantity } : l)));
      },
      clearCart: () => setLines([]),
      getLineCount: () => lines.reduce((s, l) => s + l.quantity, 0),
      getSubtotal: (resolvePrice) =>
        lines.reduce((sum, l) => sum + resolvePrice(l.productId) * l.quantity, 0),
    }),
    [lines],
  );

  return <ShopCartContext.Provider value={value}>{children}</ShopCartContext.Provider>;
}

export function useShopCart() {
  const ctx = useContext(ShopCartContext);
  if (!ctx) throw new Error("useShopCart must be used within ShopCartProvider");
  return ctx;
}

export function priceFromInventory(item: InventoryLike | undefined): number {
  if (!item) return 0;
  return parseCurrency(item.price);
}
