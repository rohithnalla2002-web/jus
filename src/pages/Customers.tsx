import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import { Search, Phone, Mail, ShoppingBag, Calendar, User } from "lucide-react";
import { useAppDemo } from "@/context/AppDemoContext";
import { useNavigate } from "react-router-dom";

const Customers = () => {
  const { customerList, globalSearch } = useAppDemo();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const filteredCustomers = useMemo(() => {
    const query = `${search} ${globalSearch}`.trim().toLowerCase();

    if (!query) {
      return customerList;
    }

    return customerList.filter(
      (customer) =>
        customer.name.toLowerCase().includes(query) ||
        customer.phone.toLowerCase().includes(query) ||
        customer.email.toLowerCase().includes(query),
    );
  }, [customerList, globalSearch, search]);

  return (
    <AppLayout>
      <PageHeader title="Customers" subtitle="Manage your customer relationships" />

      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={(event) => setSearch(event.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" placeholder="Search customers..." />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredCustomers.map((customer, i) => (
          <motion.div
            key={customer.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -4 }}
            className="glass glass-hover card-shine rounded-xl p-5 cursor-pointer"
            onClick={() => navigate(`/customers/${customer.id}`)}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full gold-gradient flex items-center justify-center">
                <User className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-serif font-semibold text-foreground">{customer.name}</h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" /> Last visit: {customer.lastVisit}</p>
              </div>
            </div>
            <div className="space-y-2 mb-4">
              <p className="text-xs text-muted-foreground flex items-center gap-2"><Phone className="w-3 h-3" /> {customer.phone}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-2"><Mail className="w-3 h-3" /> {customer.email}</p>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <div>
                <p className="text-lg font-bold gold-text">{customer.totalPurchases}</p>
                <p className="text-xs text-muted-foreground">Total Purchases</p>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <ShoppingBag className="w-3 h-3" /> {customer.visits} visits
              </div>
            </div>
          </motion.div>
        ))}

        {filteredCustomers.length === 0 && (
          <div className="glass rounded-xl p-8 text-center text-muted-foreground md:col-span-2 xl:col-span-3">
            No customers match your current search.
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Customers;
