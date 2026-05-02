import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import {
  Plus,
  Filter,
  Grid3X3,
  List,
  Star,
  Shield,
  QrCode,
  X,
  Loader2,
  Gem,
  Coins,
  CircleDot,
  Cuboid,
} from "lucide-react";
import { useAppDemo } from "@/context/AppDemoContext";
import { toast } from "@/hooks/use-toast";
import { useSubmitLock } from "@/hooks/useSubmitLock";
import { ProductQrDialog } from "@/components/shared/ProductQrDialog";
import { InventoryItemDetailDialog } from "@/components/inventory/InventoryItemDetailDialog";
import type { InventoryItem } from "@/lib/api";
import {
  computeRawStockTotals,
  INVENTORY_TRACKS,
  labelForTrack,
  normalizeInventoryTrack,
  normalizeQuantityUnit,
  parseWeightNumber,
  type InventoryTrack,
  type QuantityUnit,
} from "@/lib/inventoryTrack";
import { formatProductId } from "@/lib/productQr";

const categories = ["All", "Gold", "Silver", "Diamond", "Bridal", "Platinum"];
const purities = ["All", "22K (916)", "18K (750)", "925 Sterling", "950 Pt"];

const initialForm = {
  name: "",
  category: "Gold",
  inventoryTrack: "jewellery" as InventoryTrack,
  quantityUnit: "g" as QuantityUnit,
  weight: "",
  purity: "22K (916)",
  price: "",
  hallmark: true,
  size: "",
  providerName: "",
  hallmarkNumber: "",
  image: "",
  storageBoxNumber: "",
  stock: 1,
};

const Inventory = () => {
  const { pending: addingItem, runExclusive } = useSubmitLock();
  const { inventory, addInventoryItem, updateInventoryItem, deleteInventoryItem, globalSearch } = useAppDemo();
  const [category, setCategory] = useState("All");
  const [stockKind, setStockKind] = useState<string>("All");
  const [purity, setPurity] = useState("All");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [detailItem, setDetailItem] = useState<InventoryItem | null>(null);
  const [qrItem, setQrItem] = useState<InventoryItem | null>(null);
  const [qrCelebrate, setQrCelebrate] = useState(false);

  const stockTotals = useMemo(() => computeRawStockTotals(inventory), [inventory]);

  const filtered = useMemo(() => {
    const query = globalSearch.trim().toLowerCase();

    return inventory.filter((item) => {
      const track = normalizeInventoryTrack(item.inventoryTrack);
      const stockOk =
        stockKind === "All" ||
        (stockKind !== "All" && track === stockKind);
      return (
        stockOk &&
        (category === "All" || item.category === category) &&
        (purity === "All" || item.purity === purity) &&
        (!query ||
          item.name.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query) ||
          item.purity.toLowerCase().includes(query) ||
          labelForTrack(track).toLowerCase().includes(query))
      );
    });
  }, [inventory, category, stockKind, purity, globalSearch]);

  const updateForm = <K extends keyof typeof initialForm>(key: K, value: (typeof initialForm)[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleImageUpload = (file: File | null) => {
    if (!file) {
      updateForm("image", "");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      updateForm("image", result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    const track = normalizeInventoryTrack(form.inventoryTrack);
    const unit = normalizeQuantityUnit(form.quantityUnit);
    const w = parseWeightNumber(form.weight);

    if (!form.name.trim() || !form.price.trim() || !form.storageBoxNumber.trim()) {
      toast({
        title: "Missing item details",
        description: "Please fill in name, price, and storage box number.",
      });
      return;
    }

    if (track === "jewellery" && (!form.size.trim() || !form.providerName.trim())) {
      toast({
        title: "Missing item details",
        description: "Finished jewellery needs size and provider.",
      });
      return;
    }

    if (track !== "other" && w <= 0) {
      toast({
        title: "Quantity needed",
        description: "Enter a positive weight / carat amount (or switch stock type to Other for piece-only SKUs).",
      });
      return;
    }

    if (track === "other" && unit === "pcs" && (!form.stock || form.stock < 1)) {
      toast({ title: "Stock needed", description: "Set at least 1 piece in stock." });
      return;
    }

    if (form.hallmark && track === "jewellery" && !form.hallmarkNumber.trim()) {
      toast({
        title: "Hallmark number required",
        description: "Please enter the hallmark number for hallmark-certified jewellery.",
      });
      return;
    }

    const nameForToast = form.name.trim();
    await runExclusive(async () => {
      try {
        const created = await addInventoryItem(form);
        setForm(initialForm);
        setShowModal(false);
        setQrCelebrate(true);
        setQrItem(created);
        toast({
          title: "Inventory updated",
          description: `${nameForToast} has been added to inventory.`,
        });
      } catch {
        toast({ title: "Could not save", description: "Check that the API server is running and try again." });
      }
    });
  };

  return (
    <AppLayout>
      <PageHeader
        title="Inventory"
        subtitle="Track raw gold, silver, platinum, and diamonds - totals update live."
        action={
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowModal(true)}
            disabled={addingItem}
            className="flex items-center gap-2 px-4 py-2 rounded-lg gold-gradient text-primary-foreground font-medium text-sm btn-ripple disabled:opacity-60"
          >
            <Plus className="w-4 h-4" /> Add Item
          </motion.button>
        }
      />

      {/* Raw & material stock summary */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            key: "au",
            label: "Raw gold",
            value: `${stockTotals.rawGoldG.toFixed(2)} g`,
            icon: Coins,
            tint: "from-amber-500/15 to-amber-600/5 border-amber-500/20",
          },
          {
            key: "ag",
            label: "Raw silver",
            value: `${stockTotals.rawSilverG.toFixed(2)} g`,
            icon: Coins,
            tint: "from-slate-400/20 to-slate-500/10 border-slate-400/25",
          },
          {
            key: "pt",
            label: "Raw platinum",
            value: `${stockTotals.rawPlatinumG.toFixed(2)} g`,
            icon: CircleDot,
            tint: "from-violet-500/15 to-primary/10 border-violet-400/25",
          },
          {
            key: "di",
            label: "Diamonds",
            value: `${stockTotals.diamondCt.toFixed(3)} ct`,
            icon: Gem,
            tint: "from-sky-400/15 to-cyan-500/10 border-sky-400/25",
          },
        ].map((c) => (
          <div
            key={c.key}
            className={`relative overflow-hidden rounded-xl border bg-gradient-to-br p-4 shadow-sm ${c.tint}`}
          >
            <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <c.icon className="h-3.5 w-3.5 text-primary" />
              {c.label}
            </div>
            <p className="font-serif text-lg font-bold text-foreground sm:text-xl">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Cuboid className="w-4 h-4 text-muted-foreground shrink-0" />
        <span className="text-xs font-medium text-muted-foreground mr-1">Stock type</span>
        {(["All", ...INVENTORY_TRACKS.map((t) => t.value)] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setStockKind(k)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              stockKind === k
                ? "gold-gradient text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            {k === "All" ? "All" : labelForTrack(k as InventoryTrack)}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                category === c
                  ? "gold-gradient text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <select
            value={purity}
            onChange={(e) => setPurity(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:border-primary/50"
          >
            {purities.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <button onClick={() => setView("grid")} className={`p-2 rounded-lg ${view === "grid" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button onClick={() => setView("list")} className={`p-2 rounded-lg ${view === "list" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid */}
      <motion.div layout className={`grid gap-4 ${view === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"}`}>
        <AnimatePresence mode="popLayout">
          {filtered.map((item, i) => (
            <motion.div
              key={item.id}
              layout
              role="button"
              tabIndex={0}
              aria-label={`Open details for ${item.name}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              whileHover={{ y: -4 }}
              className="glass glass-hover card-shine rounded-xl overflow-hidden cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              onClick={() => setDetailItem(item)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setDetailItem(item);
                }
              }}
            >
              {/* Image Placeholder */}
              <div className="relative h-44 bg-gradient-to-br from-gold-muted/40 to-secondary flex items-center justify-center overflow-hidden">
                {typeof item.image === "string" && item.image.startsWith("data:") ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="absolute inset-0 w-full h-full object-cover opacity-90"
                  />
                ) : (
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 2 }}
                  transition={{ duration: 0.4 }}
                  className="text-4xl"
                >
                  💎
                </motion.div>
                )}
                {item.highSelling && (
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-primary/90 text-primary-foreground text-xs font-medium flex items-center gap-1">
                    <Star className="w-3 h-3" /> Top Seller
                  </span>
                )}
                {item.hallmark && (
                  <span className="absolute top-2 right-2 p-1.5 rounded-full bg-green-500/20">
                    <Shield className="w-3.5 h-3.5 text-green-400" />
                  </span>
                )}
              </div>

              <div className="p-4">
                <div className="mb-2 flex flex-wrap gap-1">
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                    {labelForTrack(normalizeInventoryTrack(item.inventoryTrack))}
                  </span>
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {item.category}
                  </span>
                </div>
                <h3 className="font-serif font-semibold text-foreground text-sm mb-1">{item.name}</h3>
                <p className="text-[11px] font-mono text-muted-foreground mb-2">{formatProductId(item.id)}</p>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{item.purity}</span>
                  <span className="text-xs text-muted-foreground">{item.weight}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold gold-text">{item.price}</span>
                  <span className="text-xs text-muted-foreground">Stock: {item.stock}</span>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Storage Box: <span className="text-foreground font-medium">{item.storageBoxNumber}</span>
                </div>
                <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => setDetailItem(item)}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-secondary/80 py-2 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
                  >
                    <QrCode className="h-3.5 w-3.5" /> View details &amp; QR
                  </button>
                </div>
              </div>
            </motion.div>
          ))}

          {filtered.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass rounded-xl p-8 text-center text-muted-foreground"
            >
              No items match the current filters or search.
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 overflow-y-auto overscroll-y-contain bg-background/80 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          >
            <div className="flex min-h-full items-center justify-center p-4 py-8 sm:py-10">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative glass rounded-2xl p-6 w-full max-w-lg max-h-[min(90dvh,calc(100dvh-2rem))] overflow-y-auto overscroll-contain gold-glow my-auto"
            >
              {addingItem && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-background/55 backdrop-blur-[1px]">
                  <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Loader2 className="w-5 h-5 animate-spin" /> Adding…
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-serif font-bold gold-text">Add New Item</h2>
                <button
                  type="button"
                  disabled={addingItem}
                  onClick={() => setShowModal(false)}
                  className="p-1 rounded-lg hover:bg-secondary text-muted-foreground disabled:opacity-40"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Item Name</label>
                  <input
                    value={form.name}
                    onChange={(event) => updateForm("name", event.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:border-primary/50 transition-colors"
                    placeholder="Item Name"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Stock type</label>
                    <select
                      value={form.inventoryTrack}
                      onChange={(event) => {
                        const v = event.target.value as InventoryTrack;
                        const u = v === "diamond" ? "ct" : v === "other" ? "pcs" : "g";
                        setForm((cur) => ({ ...cur, inventoryTrack: v, quantityUnit: u }));
                      }}
                      className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:border-primary/50 transition-colors"
                    >
                      {INVENTORY_TRACKS.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Quantity unit</label>
                    <select
                      value={form.quantityUnit}
                      onChange={(event) => updateForm("quantityUnit", event.target.value as QuantityUnit)}
                      className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:border-primary/50 transition-colors"
                    >
                      <option value="g">Grams (g)</option>
                      <option value="ct">Carats (ct)</option>
                      <option value="pcs">Pieces (pcs)</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Category</label>
                    <select
                      value={form.category}
                      onChange={(event) => updateForm("category", event.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:border-primary/50 transition-colors"
                    >
                      {categories.filter((item) => item !== "All").map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Purity</label>
                    <select
                      value={form.purity}
                      onChange={(event) => updateForm("purity", event.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:border-primary/50 transition-colors"
                    >
                      {purities.filter((item) => item !== "All").map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">
                      {form.inventoryTrack === "diamond"
                        ? "Carats (numeric × stock)"
                        : form.inventoryTrack === "other" && form.quantityUnit === "pcs"
                          ? "Label / batch ref"
                          : form.inventoryTrack.startsWith("raw")
                            ? "Weight (g)"
                            : "Weight (grams)"}
                    </label>
                    <input
                      value={form.weight}
                      onChange={(event) => updateForm("weight", event.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:border-primary/50 transition-colors"
                      placeholder={
                        form.inventoryTrack === "diamond"
                          ? "e.g. 1.25"
                          : form.inventoryTrack === "other" && form.quantityUnit === "pcs"
                            ? "e.g. Gift card ₹5000"
                            : "45.2 or 45.2g"
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Stock</label>
                    <input
                      type="number"
                      min={1}
                      value={form.stock}
                      onChange={(event) => updateForm("stock", Math.max(1, Number(event.target.value) || 1))}
                      className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:border-primary/50 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Storage Box Number</label>
                    <input
                      value={form.storageBoxNumber}
                      onChange={(event) => updateForm("storageBoxNumber", event.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:border-primary/50 transition-colors"
                      placeholder="e.g. Box-7 / SB-012"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Size</label>
                    <input
                      value={form.size}
                      onChange={(event) => updateForm("size", event.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:border-primary/50 transition-colors"
                      placeholder="e.g. 45cm / Ring Size 8"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Provider Name</label>
                    <input
                      value={form.providerName}
                      onChange={(event) => updateForm("providerName", event.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:border-primary/50 transition-colors"
                      placeholder="e.g. GoldMind ERP Suppliers"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Price (₹)</label>
                  <input
                    value={form.price}
                    onChange={(event) => updateForm("price", event.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:border-primary/50 transition-colors"
                    placeholder="327200"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-1">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={form.hallmark}
                        onChange={(event) => {
                          const next = event.target.checked;
                          updateForm("hallmark", next);
                          if (!next) updateForm("hallmarkNumber", "");
                        }}
                        className="w-4 h-4 accent-primary"
                      />
                      <span className="text-sm text-foreground">Hallmark Certified</span>
                    </div>
                  </div>
                  {form.hallmark && (
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">Hallmark Number</label>
                      <input
                        value={form.hallmarkNumber}
                        onChange={(event) => updateForm("hallmarkNumber", event.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:border-primary/50 transition-colors"
                        placeholder="e.g. HC-1029"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Upload Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e.target.files?.[0] ?? null)}
                    className="w-full px-2.5 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:border-primary/50 transition-colors"
                  />
                  {form.image && (
                    <img
                      src={form.image}
                      alt="Item preview"
                      className="mt-3 w-full h-32 object-cover rounded-lg border border-border"
                    />
                  )}
                </div>
                <motion.button
                  whileHover={{ scale: addingItem ? 1 : 1.02 }}
                  whileTap={{ scale: addingItem ? 1 : 0.98 }}
                  type="button"
                  disabled={addingItem}
                  onClick={() => void handleSubmit()}
                  className="w-full py-3 rounded-lg gold-gradient text-primary-foreground font-semibold text-sm btn-ripple inline-flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {addingItem ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Adding…
                    </>
                  ) : (
                    "Add to Inventory"
                  )}
                </motion.button>
              </div>
            </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {detailItem && (
        <InventoryItemDetailDialog
          key={detailItem.id}
          item={detailItem}
          onClose={() => setDetailItem(null)}
          onUpdate={async (id, payload) => {
            const updated = await updateInventoryItem(id, payload);
            setDetailItem(updated);
            return updated;
          }}
          onDelete={deleteInventoryItem}
        />
      )}

      <ProductQrDialog
        item={qrItem}
        open={qrCelebrate && qrItem !== null}
        celebrate={qrCelebrate}
        onOpenChange={(next) => {
          if (!next) {
            setQrItem(null);
            setQrCelebrate(false);
          }
        }}
      />
    </AppLayout>
  );
};

export default Inventory;
