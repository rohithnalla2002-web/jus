import { useEffect, useState } from "react";
import { Copy, Download } from "lucide-react";
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
import { downloadDataUrlPng, formatProductId, generateQrDataUrl } from "@/lib/productQr";

type Props = {
  item: InventoryItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Shown after creating a new item */
  celebrate?: boolean;
};

export function ProductQrDialog({ item, open, onOpenChange, celebrate }: Props) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  const publicId = item ? formatProductId(item.id) : "";

  useEffect(() => {
    if (!open || !item) {
      setDataUrl(null);
      return;
    }
    let cancelled = false;
    void generateQrDataUrl(publicId).then((url) => {
      if (!cancelled) setDataUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [open, item, publicId]);

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(publicId);
      toast({ title: "Copied", description: `${publicId} copied to clipboard.` });
    } catch {
      toast({ title: "Copy failed", description: "Could not access clipboard." });
    }
  };

  const download = () => {
    if (!dataUrl || !item) return;
    const safeName = item.name.replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").slice(0, 40) || "product";
    downloadDataUrlPng(dataUrl, `goldmind-erp-${publicId}-${safeName}`);
    toast({ title: "Download started", description: "QR code PNG saved." });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif">{celebrate ? "Product saved" : "Product QR & ID"}</DialogTitle>
          <DialogDescription>
            {celebrate
              ? "Download or print this label. The same code is available anytime from Inventory."
              : "Scan at checkout or share this ID. QR encodes the product code below."}
          </DialogDescription>
        </DialogHeader>

        {item && (
          <div className="space-y-4">
            <p className="text-sm font-medium text-foreground">{item.name}</p>
            <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card/50 p-4">
              {dataUrl ? (
                <img src={dataUrl} alt={`QR for ${publicId}`} className="h-48 w-48 rounded-lg border border-border bg-white p-2" />
              ) : (
                <div className="flex h-48 w-48 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
                  Generating QR…
                </div>
              )}
              <div className="flex w-full items-center justify-center gap-2 rounded-lg bg-secondary/80 px-3 py-2 font-mono text-lg font-semibold tracking-wide text-foreground">
                {publicId}
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          <button
            type="button"
            onClick={copyId}
            disabled={!item}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-secondary px-4 py-2 text-sm font-medium hover:bg-secondary/80 disabled:opacity-50"
          >
            <Copy className="h-4 w-4" /> Copy ID
          </button>
          <button
            type="button"
            onClick={download}
            disabled={!dataUrl || !item}
            className="inline-flex items-center justify-center gap-2 rounded-lg gold-gradient px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            <Download className="h-4 w-4" /> Download QR (PNG)
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
