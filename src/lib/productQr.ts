import QRCode from "qrcode";
import type { InventoryItem } from "@/lib/api";

/** Public product id encoded in QR labels (matches DB `inventory_items.id`). */
export const PRODUCT_QR_PREFIX = "JC";

export function formatProductId(dbId: number): string {
  return `${PRODUCT_QR_PREFIX}-${dbId}`;
}

/** Parse payload from QR scan or manual entry: `JC-12`, `jc-12`, or `12`. */
export function parseProductIdInput(raw: string): number | null {
  const t = raw.trim();
  const prefixed = t.match(/^jc-(\d+)$/i);
  if (prefixed) return Number(prefixed[1]);
  const digits = t.match(/^\d+$/);
  if (digits) return Number(t);
  return null;
}

export async function generateQrDataUrl(payload: string): Promise<string> {
  return QRCode.toDataURL(payload, {
    width: 280,
    margin: 2,
    errorCorrectionLevel: "M",
    color: { dark: "#1a1a1a", light: "#ffffff" },
  });
}

/** One block of text for the Sales “Items” field after scan / ID lookup. */
export function formatInventoryItemForOrderLine(item: InventoryItem): string {
  const lines = [
    item.name,
    `Product ID: ${formatProductId(item.id)}`,
    `Category: ${item.category} · Purity: ${item.purity} · Weight: ${item.weight}`,
    `Size: ${item.size} · Box: ${item.storageBoxNumber} · Stock: ${item.stock}`,
    `Hallmark: ${item.hallmark ? `Yes (${item.hallmarkNumber || "-"})` : "No"}`,
    `Unit price: ${item.price}`,
  ];
  return lines.join("\n");
}

export function downloadDataUrlPng(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename.endsWith(".png") ? filename : `${filename}.png`;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
}
