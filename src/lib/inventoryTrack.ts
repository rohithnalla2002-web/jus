import type { InventoryItem } from "@/lib/api";

/** What kind of stock this row represents (for rollups & filters). */
export const INVENTORY_TRACKS = [
  { value: "jewellery", label: "Finished jewellery" },
  { value: "raw_gold", label: "Raw gold" },
  { value: "raw_silver", label: "Raw silver" },
  { value: "raw_platinum", label: "Raw platinum" },
  { value: "diamond", label: "Diamonds" },
  { value: "other", label: "Other (cards, etc.)" },
] as const;

export type InventoryTrack = (typeof INVENTORY_TRACKS)[number]["value"];

export const QUANTITY_UNITS = [
  { value: "g", label: "Grams (g)" },
  { value: "ct", label: "Carats (ct)" },
  { value: "pcs", label: "Pieces (pcs)" },
] as const;

export type QuantityUnit = (typeof QUANTITY_UNITS)[number]["value"];

export function normalizeInventoryTrack(raw: string | undefined | null): InventoryTrack {
  const s = String(raw ?? "").trim();
  if (s === "raw_gold" || s === "raw_silver" || s === "raw_platinum" || s === "diamond" || s === "other" || s === "jewellery") {
    return s;
  }
  return "jewellery";
}

export function normalizeQuantityUnit(raw: string | undefined | null): QuantityUnit {
  const s = String(raw ?? "").trim();
  if (s === "ct" || s === "pcs") return s;
  return "g";
}

/** Parse numeric part from weight string (e.g. "45.2g" → 45.2). */
export function parseWeightNumber(weight: string): number {
  const n = Number.parseFloat(String(weight).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export type RawStockTotals = {
  rawGoldG: number;
  rawSilverG: number;
  rawPlatinumG: number;
  diamondCt: number;
  otherPcs: number;
  jewellerySkus: number;
  jewelleryStockUnits: number;
};

export function computeRawStockTotals(items: InventoryItem[]): RawStockTotals {
  const acc: RawStockTotals = {
    rawGoldG: 0,
    rawSilverG: 0,
    rawPlatinumG: 0,
    diamondCt: 0,
    otherPcs: 0,
    jewellerySkus: 0,
    jewelleryStockUnits: 0,
  };

  for (const item of items) {
    const track = normalizeInventoryTrack(item.inventoryTrack);
    const unit = normalizeQuantityUnit(item.quantityUnit);
    const stock = Math.max(0, Number(item.stock) || 0);
    const w = parseWeightNumber(item.weight);

    if (track === "jewellery") {
      acc.jewellerySkus += 1;
      acc.jewelleryStockUnits += stock;
      continue;
    }

    if (track === "raw_gold") acc.rawGoldG += w * stock;
    else if (track === "raw_silver") acc.rawSilverG += w * stock;
    else if (track === "raw_platinum") acc.rawPlatinumG += w * stock;
    else if (track === "diamond") acc.diamondCt += w * stock;
    else if (track === "other") acc.otherPcs += unit === "pcs" ? stock : w * stock;
  }

  return acc;
}

export function labelForTrack(track: InventoryTrack): string {
  return INVENTORY_TRACKS.find((t) => t.value === track)?.label ?? track;
}
