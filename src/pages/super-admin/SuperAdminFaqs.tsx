import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { HelpCircle, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import SuperAdminLayout from "@/components/super-admin/SuperAdminLayout";
import PageHeader from "@/components/shared/PageHeader";
import { useSuperAdminAuth } from "@/context/SuperAdminAuthContext";
import {
  createSuperAdminFaq,
  deleteSuperAdminFaq,
  fetchSuperAdminFaqs,
  updateSuperAdminFaq,
  type SuperAdminFaq,
  type SuperAdminFaqBody,
} from "@/lib/api";
import { toast } from "@/hooks/use-toast";

const emptyFaq: SuperAdminFaqBody = {
  question: "",
  answer: "",
  status: "published",
  displayOrder: 0,
};

export default function SuperAdminFaqs() {
  const { token } = useSuperAdminAuth();
  const [faqs, setFaqs] = useState<SuperAdminFaq[]>([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<SuperAdminFaqBody>(emptyFaq);
  const [editing, setEditing] = useState<SuperAdminFaq | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const loadFaqs = useCallback(async () => {
    if (!token) return;
    const data = await fetchSuperAdminFaqs(token);
    setFaqs(data);
  }, [token]);

  useEffect(() => {
    void loadFaqs().catch((e) => toast({ title: "Could not load FAQs", description: e instanceof Error ? e.message : "Try again." }));
  }, [loadFaqs]);

  const filteredFaqs = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return faqs;
    return faqs.filter((faq) => [faq.question, faq.answer, faq.status].some((value) => value.toLowerCase().includes(q)));
  }, [faqs, search]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyFaq, displayOrder: faqs.length + 1 });
    setModalOpen(true);
  };

  const openEdit = (faq: SuperAdminFaq) => {
    setEditing(faq);
    setForm({
      question: faq.question,
      answer: faq.answer,
      status: faq.status,
      displayOrder: faq.displayOrder,
    });
    setModalOpen(true);
  };

  const saveFaq = async () => {
    if (!token) return;
    if (!form.question.trim() || !form.answer.trim()) {
      toast({ title: "Missing FAQ details", description: "Question and answer are required." });
      return;
    }

    setBusy(true);
    try {
      if (editing) {
        await updateSuperAdminFaq(token, editing.id, form);
        toast({ title: "FAQ updated", description: "The FAQ has been saved." });
      } else {
        await createSuperAdminFaq(token, form);
        toast({ title: "FAQ added", description: "The FAQ is now available in Super Admin." });
      }
      await loadFaqs();
      setModalOpen(false);
      setEditing(null);
      setForm(emptyFaq);
    } catch (e) {
      toast({ title: "Save failed", description: e instanceof Error ? e.message : "Try again." });
    } finally {
      setBusy(false);
    }
  };

  const removeFaq = async (faq: SuperAdminFaq) => {
    if (!token) return;
    setBusy(true);
    try {
      await deleteSuperAdminFaq(token, faq.id);
      toast({ title: "FAQ deleted", description: faq.question });
      await loadFaqs();
    } catch (e) {
      toast({ title: "Delete failed", description: e instanceof Error ? e.message : "Try again." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <SuperAdminLayout search={search} onSearchChange={setSearch}>
      <PageHeader
        title="FAQ Management"
        subtitle="Add and manage FAQs for setup, support, billing, and product questions"
        action={
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={openCreate}
            className="flex items-center gap-2 rounded-lg gold-gradient px-4 py-2 text-sm font-medium text-primary-foreground btn-ripple"
          >
            <Plus className="h-4 w-4" />
            Add FAQ
          </motion.button>
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {filteredFaqs.map((faq, index) => (
          <motion.article
            key={faq.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            className="glass glass-hover card-shine rounded-2xl p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-primary" />
                  <h2 className="font-serif text-xl font-bold text-foreground">{faq.question}</h2>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{faq.answer}</p>
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${faq.status === "published" ? "bg-emerald-500/10 text-emerald-700" : "bg-amber-500/10 text-amber-700"}`}>
                {faq.status}
              </span>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
              <p className="text-xs text-muted-foreground">Display order: {faq.displayOrder}</p>
              <div className="flex gap-2">
                <button type="button" onClick={() => openEdit(faq)} className="inline-flex items-center gap-1 rounded-lg bg-secondary px-3 py-2 text-xs font-medium text-secondary-foreground">
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </button>
                <button type="button" disabled={busy} onClick={() => void removeFaq(faq)} className="inline-flex items-center gap-1 rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive disabled:opacity-50">
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
            </div>
          </motion.article>
        ))}
      </div>

      {!filteredFaqs.length ? <div className="glass rounded-2xl p-6 text-center text-sm text-muted-foreground">No FAQs found.</div> : null}

      {modalOpen ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-background/80 p-4 backdrop-blur-sm">
          <div className="mx-auto my-8 w-full max-w-2xl rounded-2xl p-6 glass">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-serif text-2xl font-bold gold-text">{editing ? "Edit FAQ" : "Add FAQ"}</h2>
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg p-1 text-muted-foreground hover:bg-secondary">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <input value={form.question} onChange={(e) => setForm((c) => ({ ...c, question: e.target.value }))} className="rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm sm:col-span-2" placeholder="Question" />
              <select value={form.status} onChange={(e) => setForm((c) => ({ ...c, status: e.target.value as SuperAdminFaqBody["status"] }))} className="rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm">
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
              <input type="number" value={form.displayOrder} onChange={(e) => setForm((c) => ({ ...c, displayOrder: Number(e.target.value) || 0 }))} className="rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm" placeholder="Display order" />
              <textarea value={form.answer} onChange={(e) => setForm((c) => ({ ...c, answer: e.target.value }))} className="min-h-32 rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm sm:col-span-2" placeholder="Answer" />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium">Cancel</button>
              <button type="button" disabled={busy} onClick={() => void saveFaq()} className="inline-flex items-center gap-2 rounded-lg gold-gradient px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {editing ? "Save FAQ" : "Add FAQ"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </SuperAdminLayout>
  );
}
