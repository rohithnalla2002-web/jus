import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import { Plus, Filter, Grid3X3, List, Star, Shield, QrCode, X, Loader2 } from "lucide-react";
import { useAppDemo } from "@/context/AppDemoContext";
import { toast } from "@/hooks/use-toast";
import { useSubmitLock } from "@/hooks/useSubmitLock";
import { ProductQrDialog } from "@/components/shared/ProductQrDialog";
import { InventoryItemDetailDialog } from "@/components/inventory/InventoryItemDetailDialog";
import type { InventoryItem } from "@/lib/api";
import { formatProductId } from "@/lib/productQr";

const categories = ["All", "Gold", "Silver", "Diamond", "Bridal", "Platinum"];
const purities = ["All", "22K (916)", "18K (750)", "925 Sterling", "950 Pt"];

const initialForm = {
  name: "",
  category: "Gold",
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
  const [purity, setPurity] = useState("All");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [detailItem, setDetailItem] = useState<InventoryItem | null>(null);
  const [qrItem, setQrItem] = useState<InventoryItem | null>(null);
  const [qrCelebrate, setQrCelebrate] = useState(false);

  const filtered = useMemo(() => {
    const query = globalSearch.trim().toLowerCase();

    return inventory.filter(
      (item) =>
        (category === "All" || item.category === category) &&
        (purity === "All" || item.purity === purity) &&
        (!query ||
          item.name.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query) ||
          item.purity.toLowerCase().includes(query)),
    );
  }, [inventory, category, purity, globalSearch]);

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
    if (!form.name.trim() || !form.weight.trim() || !form.price.trim() || !form.size.trim() || !form.providerName.trim() || !form.storageBoxNumber.trim()) {
      toast({
        title: "Missing item details",
        description: "Please fill in name, weight, price, size, provider name, and storage box number before adding the item.",
      });
      return;
    }

    if (form.hallmark && !form.hallmarkNumber.trim()) {
      toast({
        title: "Hallmark number required",
        description: "Please enter the hallmark number for hallmark-certified items.",
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
        subtitle="Manage your jewellery collection"
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

      {/* Filters */}
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
                    <label className="text-sm text-muted-foreground mb-1 block">Weight (grams)</label>
                    <input
                      value={form.weight}
                      onChange={(event) => updateForm("weight", event.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:border-primary/50 transition-colors"
                      placeholder="45.2g"
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
                      placeholder="e.g. JewelCraft Suppliers"
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
