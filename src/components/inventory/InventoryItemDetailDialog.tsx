import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Copy, Download, Pencil, QrCode, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import type { InventoryItem } from "@/lib/api";
import {
  INVENTORY_TRACKS,
  labelForTrack,
  normalizeInventoryTrack,
  normalizeQuantityUnit,
  parseWeightNumber,
  type InventoryTrack,
  type QuantityUnit,
} from "@/lib/inventoryTrack";
import { formatCurrency, parseCurrency } from "@/lib/demo";
import { downloadDataUrlPng, formatProductId, generateQrDataUrl } from "@/lib/productQr";

const categories = ["Gold", "Silver", "Diamond", "Bridal", "Platinum"];
const purities = ["22K (916)", "18K (750)", "925 Sterling", "950 Pt"];

type Draft = {
  name: string;
  category: string;
  inventoryTrack: InventoryTrack;
  quantityUnit: QuantityUnit;
  weight: string;
  purity: string;
  price: string;
  hallmark: boolean;
  hallmarkNumber: string;
  size: string;
  providerName: string;
  storageBoxNumber: string;
  image: string;
  stock: number;
  highSelling: boolean;
};

function itemToDraft(item: InventoryItem): Draft {
  return {
    name: item.name,
    category: item.category,
    inventoryTrack: normalizeInventoryTrack(item.inventoryTrack),
    quantityUnit: normalizeQuantityUnit(item.quantityUnit),
    weight: item.weight,
    purity: item.purity,
    price: String(parseCurrency(item.price) || 0),
    hallmark: item.hallmark,
    hallmarkNumber: item.hallmarkNumber,
    size: item.size,
    providerName: item.providerName,
    storageBoxNumber: item.storageBoxNumber,
    image: typeof item.image === "string" ? item.image : "",
    stock: item.stock,
    highSelling: Boolean(item.highSelling),
  };
}

function draftToInventoryPayload(d: Draft) {
  return {
    name: d.name.trim(),
    category: d.category,
    inventoryTrack: d.inventoryTrack,
    quantityUnit: d.quantityUnit,
    weight: d.weight.trim(),
    purity: d.purity,
    price: d.price,
    hallmark: d.hallmark,
    hallmarkNumber: d.hallmarkNumber.trim(),
    size: d.size.trim(),
    providerName: d.providerName.trim(),
    storageBoxNumber: d.storageBoxNumber.trim(),
    image: d.image.trim(),
    stock: d.stock,
    highSelling: d.highSelling,
  };
}

type Props = {
  item: InventoryItem;
  onClose: () => void;
  onUpdate: (id: number, payload: ReturnType<typeof draftToInventoryPayload>) => Promise<InventoryItem>;
  onDelete?: (id: number) => Promise<void>;
};

export function InventoryItemDetailDialog({ item, onClose, onUpdate, onDelete }: Props) {
  const [draft, setDraft] = useState(() => itemToDraft(item));
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const publicId = formatProductId(item.id);

  useEffect(() => {
    if (!editing) setDraft(itemToDraft(item));
  }, [item, editing]);

  useEffect(() => {
    let cancelled = false;
    void generateQrDataUrl(publicId).then((url) => {
      if (!cancelled) setDataUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [publicId]);

  const updateDraft = useCallback(<K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
  }, []);

  const handleImageUpload = (file: File | null) => {
    if (!file) {
      updateDraft("image", "");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      updateDraft("image", result);
    };
    reader.readAsDataURL(file);
  };

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(publicId);
      toast({ title: "Copied", description: `${publicId} copied.` });
    } catch {
      toast({ title: "Copy failed", description: "Could not access clipboard." });
    }
  };

  const downloadQr = () => {
    if (!dataUrl) return;
    const safeName = item.name.replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").slice(0, 40) || "product";
    downloadDataUrlPng(dataUrl, `goldmind-erp-${publicId}-${safeName}`);
    toast({ title: "Download started", description: "QR code PNG saved." });
  };

  const validate = (d: Draft) => {
    const track = d.inventoryTrack;
    const w = parseWeightNumber(d.weight);
    if (!d.name.trim() || !d.price.trim() || !d.storageBoxNumber.trim()) {
      toast({
        title: "Missing details",
        description: "Fill name, price, and storage box.",
      });
      return false;
    }
    if (track === "jewellery" && (!d.size.trim() || !d.providerName.trim())) {
      toast({ title: "Missing details", description: "Finished jewellery needs size and provider." });
      return false;
    }
    if (track !== "other" && w <= 0) {
      toast({ title: "Quantity needed", description: "Enter a positive weight or carat amount." });
      return false;
    }
    if (track === "other" && d.quantityUnit === "pcs" && d.stock < 1) {
      toast({ title: "Stock needed", description: "Set at least 1 piece in stock." });
      return false;
    }
    if (d.hallmark && track === "jewellery" && !d.hallmarkNumber.trim()) {
      toast({ title: "Hallmark number required", description: "Enter hallmark number or turn off hallmark." });
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate(draft)) return;
    setSaving(true);
    try {
      const updated = await onUpdate(item.id, draftToInventoryPayload(draft));
      setDraft(itemToDraft(updated));
      setEditing(false);
      toast({ title: "Saved", description: "Inventory item updated." });
    } catch {
      toast({ title: "Save failed", description: "Check the API and try again." });
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setDraft(itemToDraft(item));
    setEditing(false);
  };

  const handleConfirmDelete = async () => {
    if (!onDelete) return;
    setDeleting(true);
    try {
      await onDelete(item.id);
      setDeleteOpen(false);
      onClose();
      toast({ title: "Item deleted", description: `${item.name} was removed from inventory.` });
    } catch {
      toast({ title: "Delete failed", description: "Check the API server and try again." });
    } finally {
      setDeleting(false);
    }
  };

  const Row = ({ label, children }: { label: string; children: ReactNode }) => (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-2 border-b border-border/60 last:border-0">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground sm:w-36 shrink-0">{label}</span>
      <div className="text-sm text-foreground flex-1 min-w-0">{children}</div>
    </div>
  );

  return (
    <>
    <Dialog open={true} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-2xl max-h-[min(90vh,880px)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-left pr-8">{editing ? "Edit product" : item.name}</DialogTitle>
          <DialogDescription className="text-left font-mono text-xs">{publicId}</DialogDescription>
        </DialogHeader>

        {!editing ? (
          <div className="space-y-4">
            <div className="relative h-48 rounded-xl overflow-hidden bg-gradient-to-br from-gold-muted/40 to-secondary flex items-center justify-center">
              {typeof item.image === "string" && item.image.startsWith("data:") ? (
                <img src={item.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <span className="text-5xl opacity-80">💎</span>
              )}
            </div>

            <div className="rounded-xl border border-border bg-card/40 px-3">
              <Row label="Stock type">{labelForTrack(normalizeInventoryTrack(item.inventoryTrack))}</Row>
              <Row label="Unit">{normalizeQuantityUnit(item.quantityUnit).toUpperCase()}</Row>
              <Row label="Category">{item.category}</Row>
              <Row label="Purity">{item.purity}</Row>
              <Row label="Weight">{item.weight}</Row>
              <Row label="Size">{item.size}</Row>
              <Row label="Provider">{item.providerName}</Row>
              <Row label="Storage box">{item.storageBoxNumber}</Row>
              <Row label="Stock">{item.stock}</Row>
              <Row label="Price">{item.price}</Row>
              <Row label="Hallmark">{item.hallmark ? `Yes · ${item.hallmarkNumber || "—"}` : "No"}</Row>
              <Row label="Top seller">{item.highSelling ? "Yes" : "No"}</Row>
            </div>

            <div className="rounded-xl border border-border bg-card/50 p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <QrCode className="h-4 w-4" /> QR &amp; product ID
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                {dataUrl ? (
                  <img src={dataUrl} alt="" className="h-36 w-36 rounded-lg border border-border bg-white p-2 shrink-0" />
                ) : (
                  <div className="h-36 w-36 rounded-lg border border-dashed border-border flex items-center justify-center text-xs text-muted-foreground">
                    Generating…
                  </div>
                )}
                <div className="flex flex-col gap-2 w-full">
                  <div className="font-mono text-lg font-semibold text-center sm:text-left">{publicId}</div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={copyId}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-secondary px-3 py-2 text-sm font-medium hover:bg-secondary/80"
                    >
                      <Copy className="h-4 w-4" /> Copy ID
                    </button>
                    <button
                      type="button"
                      onClick={downloadQr}
                      disabled={!dataUrl}
                      className="inline-flex items-center justify-center gap-2 rounded-lg gold-gradient px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                    >
                      <Download className="h-4 w-4" /> Download QR
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">Item name</label>
              <input
                value={draft.name}
                onChange={(e) => updateDraft("name", e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Stock type</label>
                <select
                  value={draft.inventoryTrack}
                  onChange={(e) => {
                    const v = e.target.value as InventoryTrack;
                    const u = v === "diamond" ? "ct" : v === "other" ? "pcs" : "g";
                    setDraft((d) => ({ ...d, inventoryTrack: v, quantityUnit: u }));
                  }}
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm"
                >
                  {INVENTORY_TRACKS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Quantity unit</label>
                <select
                  value={draft.quantityUnit}
                  onChange={(e) => updateDraft("quantityUnit", e.target.value as QuantityUnit)}
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm"
                >
                  <option value="g">Grams (g)</option>
                  <option value="ct">Carats (ct)</option>
                  <option value="pcs">Pieces (pcs)</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Category</label>
                <select
                  value={draft.category}
                  onChange={(e) => updateDraft("category", e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Purity</label>
                <select
                  value={draft.purity}
                  onChange={(e) => updateDraft("purity", e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm"
                >
                  {purities.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Weight / amount</label>
                <input
                  value={draft.weight}
                  onChange={(e) => updateDraft("weight", e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Stock</label>
                <input
                  type="number"
                  min={0}
                  value={draft.stock}
                  onChange={(e) => updateDraft("stock", Math.max(0, Number(e.target.value) || 0))}
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Storage box number</label>
              <input
                value={draft.storageBoxNumber}
                onChange={(e) => updateDraft("storageBoxNumber", e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Size</label>
                <input
                  value={draft.size}
                  onChange={(e) => updateDraft("size", e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Provider name</label>
                <input
                  value={draft.providerName}
                  onChange={(e) => updateDraft("providerName", e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Price (₹, digits)</label>
              <input
                value={draft.price}
                onChange={(e) => updateDraft("price", e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm"
              />
              <p className="text-[11px] text-muted-foreground mt-1">Preview: {formatCurrency(parseCurrency(draft.price) || 0)}</p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={draft.hallmark}
                  onChange={(e) => {
                    const next = e.target.checked;
                    updateDraft("hallmark", next);
                    if (!next) updateDraft("hallmarkNumber", "");
                  }}
                  className="w-4 h-4 accent-primary"
                />
                Hallmark certified
              </label>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={draft.highSelling}
                  onChange={(e) => updateDraft("highSelling", e.target.checked)}
                  className="w-4 h-4 accent-primary"
                />
                Top seller
              </label>
            </div>
            {draft.hallmark && (
              <div>
                <label className="text-xs text-muted-foreground">Hallmark number</label>
                <input
                  value={draft.hallmarkNumber}
                  onChange={(e) => updateDraft("hallmarkNumber", e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm"
                />
              </div>
            )}
            <div>
              <label className="text-xs text-muted-foreground">Replace image</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e.target.files?.[0] ?? null)}
                className="mt-1 w-full text-sm"
              />
            </div>
          </div>
        )}

        <DialogFooter className="flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-2">
          {!editing ? (
            <>
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                {onDelete && (
                  <button
                    type="button"
                    onClick={() => setDeleteOpen(true)}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-destructive/60 bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/15"
                  >
                    <Trash2 className="h-4 w-4" /> Delete
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2 w-full sm:w-auto sm:justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-border bg-secondary px-4 py-2 text-sm font-medium flex-1 sm:flex-none"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="inline-flex flex-1 sm:flex-none items-center justify-center gap-2 rounded-lg gold-gradient px-4 py-2 text-sm font-medium text-primary-foreground"
                >
                  <Pencil className="h-4 w-4" /> Edit
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={saving}
                className="rounded-lg border border-border bg-secondary px-4 py-2 text-sm font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg gold-gradient px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this product?</AlertDialogTitle>
            <AlertDialogDescription>
              {item.name} ({publicId}) will be permanently removed from inventory. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <button
              type="button"
              disabled={deleting}
              onClick={() => void handleConfirmDelete()}
              className="inline-flex items-center justify-center rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
            >
              {deleting ? "Deleting…" : "Delete"}
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
