import { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { formatCurrency, parseCurrency } from "@/lib/demo";
import {
  fetchBootstrap,
  apiPost,
  apiPatch,
  apiDelete,
  type BootstrapPayload,
  type Customer,
  type Employee,
  type InventoryItem,
  type KarigarBoard,
  type KarigarJob,
  type Order,
  type RecentActivityItem,
  normalizeOrderFromApi,
  normalizeKarigarJobFromApi,
} from "@/lib/api";

export type { InventoryItem, Customer, Employee, Order, RecentActivityItem, KarigarJob };

type OrderStatus = "ordered" | "in-production" | "ready" | "delivered";
type JobColumn = keyof KarigarBoard;

type NotificationItem = {
  id: number;
  title: string;
  detail: string;
  time: string;
  read: boolean;
};

type NewInventoryItem = {
  name: string;
  category: string;
  inventoryTrack?: string;
  quantityUnit?: string;
  weight: string;
  purity: string;
  price: string;
  hallmark: boolean;
  size: string;
  providerName: string;
  hallmarkNumber: string;
  image?: string;
  storageBoxNumber: string;
  stock: number;
};

type UpdateInventoryItemInput = NewInventoryItem & { highSelling?: boolean };

type NewOrderInput = {
  customer: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  paymentMode?: string;
  items: string;
  total: string;
  status: OrderStatus;
  date?: string;
};

type NewKarigarJobInput = {
  title: string;
  karigar: string;
  deadline: string;
  material: string;
  instructions: string;
  customerName: string;
  customerMobile: string;
  customerEmail?: string;
  customerAddress?: string;
  size: string;
  referenceImage?: string;
  /** Quoted / agreed price (₹), e.g. "125000" */
  price: string;
};

type NewEmployeeInput = {
  name: string;
  role: Employee["role"];
  department: string;
  salary: string;
  joinDate: string;
  phone: string;
  email: string;
  address: string;
};

type UpdateEmployeeInput = {
  name: string;
  role: Employee["role"];
  department: string;
  salary: string;
  joinDate: string;
  phone: string;
  email: string;
  address: string;
};

type AppDemoContextValue = {
  dataLoading: boolean;
  dataError: string | null;
  inventory: InventoryItem[];
  customerList: Customer[];
  employeeList: Employee[];
  salesOrders: Order[];
  recentActivities: RecentActivityItem[];
  karigarBoard: KarigarBoard;
  notifications: NotificationItem[];
  unreadNotifications: number;
  globalSearch: string;
  setGlobalSearch: (value: string) => void;
  refreshData: () => Promise<void>;
  addInventoryItem: (item: NewInventoryItem) => Promise<InventoryItem>;
  updateInventoryItem: (id: number, updates: UpdateInventoryItemInput) => Promise<InventoryItem>;
  deleteInventoryItem: (id: number) => Promise<void>;
  addOrder: (order: NewOrderInput) => Promise<Order>;
  addKarigarJob: (job: NewKarigarJobInput) => Promise<void>;
  addEmployee: (employee: NewEmployeeInput) => Promise<void>;
  updateEmployee: (employeeId: number, updates: UpdateEmployeeInput) => Promise<boolean>;
  updateEmployeeSalary: (employeeId: number, salary: string) => Promise<boolean>;
  toggleEmployeeStatus: (employeeId: number) => Promise<void>;
  advanceOrder: (orderId: string) => Promise<OrderStatus | null>;
  moveKarigarJob: (jobId: number) => Promise<JobColumn | null>;
  moveKarigarJobToColumn: (jobId: number, targetColumn: JobColumn) => Promise<boolean>;
  markNotificationRead: (id: number) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
};

const AppDemoContext = createContext<AppDemoContextValue | undefined>(undefined);

function applyBootstrap(setters: {
  setInventory: (v: InventoryItem[]) => void;
  setCustomerList: (v: Customer[]) => void;
  setEmployeeList: (v: Employee[]) => void;
  setSalesOrders: (v: Order[]) => void;
  setKarigarBoard: (v: KarigarBoard) => void;
  setRecentActivities: (v: RecentActivityItem[]) => void;
}, data: BootstrapPayload) {
  setters.setInventory(data.inventory);
  setters.setCustomerList(data.customerList);
  setters.setEmployeeList(data.employeeList as Employee[]);
  setters.setSalesOrders(
    data.salesOrders.map((o) => normalizeOrderFromApi(o as Order & Record<string, unknown>)),
  );
  const normJob = (j: KarigarJob) => normalizeKarigarJobFromApi(j as KarigarJob & Record<string, unknown>);
  setters.setKarigarBoard({
    assigned: data.karigarBoard.assigned.map(normJob),
    inProgress: data.karigarBoard.inProgress.map(normJob),
    completed: data.karigarBoard.completed.map(normJob),
  });
  setters.setRecentActivities(
    data.recentActivities.map((a) => ({
      ...a,
      read: Boolean(a.read),
    })) as RecentActivityItem[],
  );
}

export function AppDemoProvider({ children }: { children: ReactNode }) {
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [customerList, setCustomerList] = useState<Customer[]>([]);
  const [employeeList, setEmployeeList] = useState<Employee[]>([]);
  const [salesOrders, setSalesOrders] = useState<Order[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivityItem[]>([]);
  const [karigarBoard, setKarigarBoard] = useState<KarigarBoard>({
    assigned: [],
    inProgress: [],
    completed: [],
  });
  const [globalSearch, setGlobalSearch] = useState("");

  const refreshData = useCallback(async () => {
    const data = await fetchBootstrap();
    applyBootstrap(
      {
        setInventory,
        setCustomerList,
        setEmployeeList,
        setSalesOrders,
        setKarigarBoard,
        setRecentActivities,
      },
      data,
    );
  }, []);

  useEffect(() => {
    let cancelled = false;
    setDataLoading(true);
    setDataError(null);
    fetchBootstrap()
      .then((data) => {
        if (cancelled) return;
        applyBootstrap(
          {
            setInventory,
            setCustomerList,
            setEmployeeList,
            setSalesOrders,
            setKarigarBoard,
            setRecentActivities,
          },
          data,
        );
      })
      .catch((e: unknown) => {
        if (!cancelled) setDataError(e instanceof Error ? e.message : "Failed to load data");
      })
      .finally(() => {
        if (!cancelled) setDataLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const notifications = useMemo<NotificationItem[]>(
    () =>
      recentActivities.map((a) => ({
        id: a.id,
        title: a.action,
        detail: a.detail,
        time: a.time,
        read: a.read,
      })),
    [recentActivities],
  );

  const unreadNotifications = notifications.filter((n) => !n.read).length;

  const addInventoryItem = async (item: NewInventoryItem) => {
    const created = await apiPost<InventoryItem>("/api/inventory", item);
    await refreshData();
    return created;
  };

  const updateInventoryItem = async (id: number, updates: UpdateInventoryItemInput) => {
    const updated = await apiPatch<InventoryItem>(`/api/inventory/${id}`, updates);
    await refreshData();
    return updated;
  };

  const deleteInventoryItem = async (id: number) => {
    await apiDelete(`/api/inventory/${id}`);
    await refreshData();
  };

  const addOrder = async (order: NewOrderInput) => {
    const created = await apiPost<Order>("/api/orders", order);
    await refreshData();
    return created;
  };

  const advanceOrder = async (orderId: string) => {
    const res = await apiPatch<{ status: OrderStatus | null; order: Order }>(`/api/orders/${encodeURIComponent(orderId)}/advance`);
    await refreshData();
    return res.status;
  };

  const moveKarigarJob = async (jobId: number) => {
    const res = await apiPatch<{ advanced: boolean; column: JobColumn }>(`/api/karigar-jobs/${jobId}/move`, {
      advance: true,
    });
    await refreshData();
    if (!res.advanced) return null;
    return res.column;
  };

  const moveKarigarJobToColumn = async (jobId: number, targetColumn: JobColumn) => {
    const res = await apiPatch<{ advanced: boolean }>(`/api/karigar-jobs/${jobId}/move`, { column: targetColumn });
    await refreshData();
    return res.advanced;
  };

  const addKarigarJob = async (job: NewKarigarJobInput) => {
    await apiPost("/api/karigar-jobs", job);
    await refreshData();
  };

  const addEmployee = async (employee: NewEmployeeInput) => {
    await apiPost("/api/employees", employee);
    await refreshData();
  };

  const updateEmployee = async (employeeId: number, updates: UpdateEmployeeInput) => {
    try {
      await apiPatch(`/api/employees/${employeeId}`, updates);
      await refreshData();
      return true;
    } catch {
      return false;
    }
  };

  const updateEmployeeSalary = async (employeeId: number, salary: string) => {
    const parsed = parseCurrency(salary);
    if (!parsed) return false;
    try {
      await apiPatch(`/api/employees/${employeeId}/salary`, { salary });
      await refreshData();
      return true;
    } catch {
      return false;
    }
  };

  const toggleEmployeeStatus = async (employeeId: number) => {
    await apiPatch(`/api/employees/${employeeId}/toggle-status`, {});
    await refreshData();
  };

  const markNotificationRead = async (id: number) => {
    await apiPatch(`/api/activities/${id}/read`, {});
    setRecentActivities((prev) => prev.map((a) => (a.id === id ? { ...a, read: true } : a)));
  };

  const markAllNotificationsRead = async () => {
    await apiPatch("/api/activities/read-all", {});
    setRecentActivities((prev) => prev.map((a) => ({ ...a, read: true })));
  };

  const value: AppDemoContextValue = {
    dataLoading,
    dataError,
    inventory,
    customerList,
    employeeList,
    salesOrders,
    recentActivities,
    karigarBoard,
    notifications,
    unreadNotifications,
    globalSearch,
    setGlobalSearch,
    refreshData,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    addOrder,
    addKarigarJob,
    addEmployee,
    updateEmployee,
    updateEmployeeSalary,
    toggleEmployeeStatus,
    advanceOrder,
    moveKarigarJob,
    moveKarigarJobToColumn,
    markNotificationRead,
    markAllNotificationsRead,
  };

  return <AppDemoContext.Provider value={value}>{children}</AppDemoContext.Provider>;
}

export function useAppDemo() {
  const context = useContext(AppDemoContext);
  if (!context) throw new Error("useAppDemo must be used inside AppDemoProvider");
  return context;
}
