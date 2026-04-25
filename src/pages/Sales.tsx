import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import { Plus, FileText, Download } from "lucide-react";
import { useAppDemo } from "@/context/AppDemoContext";
import { formatShortDate } from "@/lib/demo";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { downloadInvoiceHtml } from "@/lib/invoiceHtml";
import { labelForPaymentMode } from "@/lib/paymentMode";
import { CreateOrderWizard } from "@/components/sales/CreateOrderWizard";
import { whatsappHref } from "@/lib/aiReachOutUtils";
import { GmailLogoMark, WhatsAppLogoMark } from "@/components/layout/AiReachOutBrandIcons";

const Sales = () => {
  const { salesOrders, addOrder, globalSearch, customerList, inventory } = useAppDemo();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  const visibleOrders = useMemo(() => {
    const query = globalSearch.trim().toLowerCase();

    if (!query) {
      return salesOrders;
    }

    return salesOrders.filter(
      (order) =>
        order.id.toLowerCase().includes(query) ||
        order.customer.toLowerCase().includes(query) ||
        order.items.toLowerCase().includes(query),
    );
  }, [salesOrders, globalSearch]);

  const downloadInvoice = (orderId: string) => {
    const order = salesOrders.find((item) => item.id === orderId);
    if (!order) return;

    const customer = customerList.find((c) => c.name === order.customer) ?? {
      name: order.customer,
      phone: "",
      email: "",
      address: "",
    };

    downloadInvoiceHtml({
      filename: order.id.toLowerCase(),
      order,
      customer,
      inventory,
      goldRatePerGram: "₹7,245/g",
      paymentMethod: labelForPaymentMode(order.paymentMode),
    });

    toast({ title: "Invoice downloaded", description: `${order.id} invoice has been downloaded (HTML).` });
  };

  const openOrderWhatsApp = (orderId: string) => {
    const order = salesOrders.find((item) => item.id === orderId);
    if (!order) return;

    const customer = customerList.find((c) => c.name === order.customer);
    const href = whatsappHref(
      customer?.phone ?? "",
      `Hi ${order.customer}, gentle reminder for order ${order.id} from GoldMind ERP.`,
    );

    if (!href) {
      toast({
        title: "WhatsApp unavailable",
        description: `Add a valid mobile number for ${order.customer} to send WhatsApp reminders.`,
      });
      return;
    }

    window.open(href, "_blank", "noopener,noreferrer");
  };

  const sendReminder = (orderId: string) => {
    const order = salesOrders.find((item) => item.id === orderId);
    if (!order) return;
    toast({
      title: "Reminder sent",
      description: `Payment reminder sent for ${order.id} (${order.customer}).`,
    });
  };

  return (
    <AppLayout>
      <PageHeader
        title="Sales & Billing"
        subtitle="Manage orders, invoices, and billing"
        action={
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg gold-gradient text-primary-foreground font-medium text-sm btn-ripple"
          >
            <Plus className="w-4 h-4" /> New Order
          </motion.button>
        }
      />

      {/* Orders Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {["Order ID", "Customer", "Items", "Total", "Date", "Actions"].map((h) => (
                  <th
                    key={h}
                    className={`px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider ${h === "Actions" ? "text-center" : "text-left"}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleOrders.map((order, i) => {
                return (
                  <motion.tr
                    key={order.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 + i * 0.08 }}
                    className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
                    onClick={() => navigate(`/orders/${order.id}`)}
                  >
                    <td className="px-4 py-3 text-sm font-medium text-primary">{order.id}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{order.customer}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{order.items}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-foreground">{order.total}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{formatShortDate(order.date)}</td>
                    <td className="px-4 py-3 align-middle">
                      <div className="flex w-full items-center justify-center gap-2">
                         <button
                           type="button"
                           onClick={(e) => {
                             e.stopPropagation();
                             navigate(`/orders/${order.id}`);
                           }}
                           className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                           aria-label="View order"
                           title="View order"
                         >
                           <FileText className="w-4 h-4" />
                         </button>
                         <button
                           type="button"
                           onClick={(e) => {
                             e.stopPropagation();
                             downloadInvoice(order.id);
                           }}
                           className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                           aria-label="Download invoice"
                           title="Download invoice"
                         >
                           <Download className="w-4 h-4" />
                         </button>
                         <button
                           type="button"
                           onClick={(e) => {
                             e.stopPropagation();
                             openOrderWhatsApp(order.id);
                           }}
                           className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 transition-colors"
                           aria-label="WhatsApp customer"
                           title="WhatsApp customer"
                         >
                           <WhatsAppLogoMark className="h-4 w-4" />
                         </button>
                         <button
                           type="button"
                           onClick={(e) => {
                             e.stopPropagation();
                             sendReminder(order.id);
                           }}
                           className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 transition-colors"
                           aria-label="Send reminder"
                           title="Send reminder"
                         >
                           <GmailLogoMark className="h-4 w-4" />
                         </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
              {visibleOrders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    No orders match the current search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      <CreateOrderWizard
        open={showModal}
        onOpenChange={setShowModal}
        customerList={customerList}
        salesOrders={salesOrders}
        inventory={inventory}
        onCreateOrder={addOrder}
      />
    </AppLayout>
  );
};

export default Sales;
