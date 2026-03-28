import { useState } from "react";
import { motion } from "framer-motion";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import { User, Shield, ShoppingCart, Wrench, Plus, X, Pencil } from "lucide-react";
import { useAppDemo } from "@/context/AppDemoContext";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const roleConfig: Record<string, { color: string; icon: typeof Shield }> = {
  Admin: { color: "bg-primary/10 text-primary", icon: Shield },
  Salesman: { color: "bg-info/10 text-info", icon: ShoppingCart },
  Karigar: { color: "bg-green-500/10 text-green-400", icon: Wrench },
};

type EmployeeForm = {
  name: string;
  role: "Admin" | "Salesman" | "Karigar";
  department: string;
  salary: string;
  joinDate: string;
  phone: string;
  email: string;
  address: string;
};

const initialEmployeeForm: EmployeeForm = {
  name: "",
  role: "Karigar",
  department: "",
  salary: "",
  joinDate: "",
  phone: "",
  email: "",
  address: "",
};

const Employees = () => {
  const navigate = useNavigate();
  const { employeeList, addEmployee, updateEmployee, toggleEmployeeStatus } = useAppDemo();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(initialEmployeeForm);
  const [editingEmployeeId, setEditingEmployeeId] = useState<number | null>(null);

  const handleSaveEmployee = async () => {
    if (!form.name.trim() || !form.department.trim() || !form.salary.trim() || !form.phone.trim() || !form.email.trim()) {
      toast({
        title: "Missing employee details",
        description: "Please fill name, department, salary, phone and email.",
      });
      return;
    }

    try {
      if (editingEmployeeId) {
        const updated = await updateEmployee(editingEmployeeId, form);
        if (!updated) {
          toast({ title: "Update failed", description: "Could not update employee details." });
          return;
        }
        toast({ title: "Employee updated", description: `${form.name} details have been updated.` });
      } else {
        await addEmployee(form);
        toast({ title: "Employee added", description: `${form.name} has been added to your team.` });
      }

      setForm(initialEmployeeForm);
      setEditingEmployeeId(null);
      setShowModal(false);
    } catch {
      toast({ title: "Request failed", description: "Check that the API server is running and try again." });
    }
  };

  return (
    <AppLayout>
      <PageHeader
        title="Employees"
        subtitle="Manage your team"
        action={
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg gold-gradient text-primary-foreground font-medium text-sm btn-ripple"
          >
            <Plus className="w-4 h-4" /> Add Employee
          </motion.button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {employeeList.map((emp, i) => {
          const role = roleConfig[emp.role] ?? roleConfig.Karigar;
          const RoleIcon = role.icon;
          return (
            <motion.div
              key={emp.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4 }}
              className="glass glass-hover card-shine rounded-xl p-5 cursor-pointer"
              onClick={() => navigate(`/employees/${emp.id}`)}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                  <User className="w-6 h-6 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="font-serif font-semibold text-foreground">{emp.name}</h3>
                  <p className="text-xs text-muted-foreground">{emp.department} · Since {emp.joinDate}</p>
                </div>
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${role.color}`}>
                  <RoleIcon className="w-3 h-3" /> {emp.role}
                </span>
              </div>
              <div className="mb-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingEmployeeId(emp.id);
                    setForm({
                      name: emp.name,
                      role: (emp.role as EmployeeForm["role"]) || "Karigar",
                      department: emp.department,
                      salary: emp.salary,
                      joinDate: emp.joinDate,
                      phone: emp.phone,
                      email: emp.email,
                      address: emp.address,
                    });
                    setShowModal(true);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-secondary text-secondary-foreground text-xs"
                >
                  <Pencil className="w-3 h-3" /> Edit
                </button>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <div>
                  <p className="text-lg font-bold text-foreground">{emp.salary}</p>
                  <p className="text-xs text-muted-foreground">Monthly Salary</p>
                </div>
                <button
                  type="button"
                  onClick={async (e) => {
                    e.stopPropagation();
                    try {
                      await toggleEmployeeStatus(emp.id);
                    } catch {
                      toast({ title: "Update failed", description: "Could not change status." });
                    }
                  }}
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    emp.status === "active" ? "bg-green-500/10 text-green-400" : "bg-warning/10 text-warning"
                  }`}
                >
                  {emp.status === "active" ? "Active" : "On Leave"}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto overscroll-y-contain bg-background/80 backdrop-blur-sm">
          <div className="flex min-h-full items-center justify-center p-4 py-8 sm:py-10">
          <div className="glass rounded-2xl p-6 w-full max-w-2xl max-h-[min(90dvh,calc(100dvh-2rem))] overflow-y-auto overscroll-contain my-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-serif font-bold gold-text">{editingEmployeeId ? "Edit Employee" : "Add Employee"}</h2>
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setEditingEmployeeId(null);
                  setForm(initialEmployeeForm);
                }}
                className="p-1 rounded-lg hover:bg-secondary text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input value={form.name} onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground" placeholder="Employee name" />
              <select value={form.role} onChange={(e) => setForm((c) => ({ ...c, role: e.target.value as EmployeeForm["role"] }))} className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground">
                <option value="Admin">Admin</option>
                <option value="Salesman">Salesman</option>
                <option value="Karigar">Karigar</option>
              </select>
              <input value={form.department} onChange={(e) => setForm((c) => ({ ...c, department: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground" placeholder="Department" />
              <input value={form.salary} onChange={(e) => setForm((c) => ({ ...c, salary: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground" placeholder="Salary (e.g. 45000)" />
              <input type="date" value={form.joinDate} onChange={(e) => setForm((c) => ({ ...c, joinDate: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground" />
              <input value={form.phone} onChange={(e) => setForm((c) => ({ ...c, phone: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground" placeholder="Phone number" />
              <input value={form.email} onChange={(e) => setForm((c) => ({ ...c, email: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground sm:col-span-2" placeholder="Email address" />
              <textarea value={form.address} onChange={(e) => setForm((c) => ({ ...c, address: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground sm:col-span-2 min-h-20" placeholder="Address" />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setEditingEmployeeId(null);
                  setForm(initialEmployeeForm);
                }}
                className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium"
              >
                Cancel
              </button>
              <button type="button" onClick={handleSaveEmployee} className="px-4 py-2 rounded-lg gold-gradient text-primary-foreground text-sm font-medium btn-ripple">
                {editingEmployeeId ? "Save Changes" : "Add Employee"}
              </button>
            </div>
          </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default Employees;
