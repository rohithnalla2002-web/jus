import { parseCurrency } from "@/lib/demo";

export type InventoryLike = {
  id: number;
  name: string;
  category: string;
  weight: string;
  purity: string;
  price: string;
  image?: string;
  stock: number;
  highSelling?: boolean;
};

export function getShopCategory(item: InventoryLike): string {
  const n = item.name.toLowerCase();
  if (n.includes("ring") || n.includes("band")) return "Rings";
  if (n.includes("necklace") || n.includes("choker") || n.includes("chain")) return "Necklaces";
  if (n.includes("earring")) return "Earrings";
  if (n.includes("bangle") || n.includes("anklet") || n.includes("bracelet")) return "Bracelets";
  if (item.category === "Bridal") return "Bridal";
  return item.category;
}

export function shortDescription(item: InventoryLike): string {
  return `${item.purity} · ${item.weight} · Hallmark certified craftsmanship.`;
}

export function popularityScore(item: InventoryLike): number {
  const base = parseCurrency(item.price) / 100000;
  return (item.highSelling ? 50 : 0) + Math.min(30, base);
}

export const PRODUCT_IMAGE_BY_KEY: Record<string, string> = {
  necklace: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&q=80",
  ring: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&q=80",
  choker: "https://images.unsplash.com/photo-1535632066927-ab7ce9a7d5a8?w=800&q=80",
  anklet: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&q=80",
  bangles: "https://images.unsplash.com/photo-1610374792793-f016b6683ac2?w=800&q=80",
  earrings: "https://images.unsplash.com/photo-1535632787350-4e68ef0ac58c?w=800&q=80",
  band: "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=800&q=80",
  temple: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&q=80",
};

export function getProductImageUrl(item: InventoryLike): string {
  const key = typeof item.image === "string" ? item.image.toLowerCase() : "";
  if (key.startsWith("data:") || key.startsWith("http")) return item.image as string;
  return PRODUCT_IMAGE_BY_KEY[key] ?? PRODUCT_IMAGE_BY_KEY.necklace;
}

export const SHOP_CATEGORIES = [
  "All",
  "Rings",
  "Necklaces",
  "Earrings",
  "Bracelets",
  "Bridal",
  "Gold",
  "Diamond",
  "Platinum",
  "Silver",
] as const;
