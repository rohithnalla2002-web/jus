import type { ReactElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppDemoProvider } from "./context/AppDemoContext";
import { AdminAuthProvider, useAdminAuth } from "./context/AdminAuthContext";
import { ShopCartProvider } from "./context/ShopCartContext";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import Sales from "./pages/Sales";
import OrderDetails from "./pages/OrderDetails";
import Karigar from "./pages/Karigar";
import KarigarJobDetails from "./pages/KarigarJobDetails";
import Customers from "./pages/Customers";
import CustomerDetails from "./pages/CustomerDetails";
import Employees from "./pages/Employees";
import EmployeeDetails from "./pages/EmployeeDetails";
import Accounting from "./pages/Accounting";
import Reports from "./pages/Reports";
import OldGoldExchange from "./pages/OldGoldExchange";
import GoldSchemes from "./pages/GoldSchemes";
import DayBook from "./pages/DayBook";
import NotFound from "./pages/NotFound";
import PublicLayout from "./components/shop/PublicLayout";
import LandingPage from "./pages/shop/LandingPage";
import ProductsPage from "./pages/shop/ProductsPage";
import ProductDetailPage from "./pages/shop/ProductDetailPage";
import CartPage from "./pages/shop/CartPage";
import AboutPage from "./pages/shop/AboutPage";
import ContactPage from "./pages/shop/ContactPage";
import AdminLogin from "./pages/admin/AdminLogin";
import { GoldMindLogoMark } from "@/components/shared/GoldMindBrandLogo";

const queryClient = new QueryClient();

function ProtectedAdmin({ children }: { children: ReactElement }) {
  const { authReady, isAuthenticated } = useAdminAuth();
  if (!authReady) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center text-muted-foreground text-sm">
        <GoldMindLogoMark size="lg" />
        <span>Checking session…</span>
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;
  return children;
}

const AppRoutes = () => (
  <Routes>
    <Route path="/admin/login" element={<AdminLogin />} />

    {/* Gold schemes early so this path always wins over catch-all; aliases for typos */}
    <Route path="/gold-schemes" element={<ProtectedAdmin><GoldSchemes /></ProtectedAdmin>} />
    <Route path="/goldscheme" element={<Navigate to="/gold-schemes" replace />} />
    <Route path="/gold-saving-schemes" element={<Navigate to="/gold-schemes" replace />} />
    <Route path="/day-book" element={<ProtectedAdmin><DayBook /></ProtectedAdmin>} />

    <Route element={<PublicLayout />}>
      <Route path="/" element={<LandingPage />} />
      <Route path="/products" element={<ProductsPage />} />
      <Route path="/product/:productId" element={<ProductDetailPage />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/contact" element={<ContactPage />} />
    </Route>

    <Route path="/dashboard" element={<ProtectedAdmin><Dashboard /></ProtectedAdmin>} />
    <Route path="/inventory" element={<ProtectedAdmin><Inventory /></ProtectedAdmin>} />
    <Route path="/sales" element={<ProtectedAdmin><Sales /></ProtectedAdmin>} />
    <Route path="/orders/:orderId" element={<ProtectedAdmin><OrderDetails /></ProtectedAdmin>} />
    <Route path="/karigar/jobs/:jobId" element={<ProtectedAdmin><KarigarJobDetails /></ProtectedAdmin>} />
    <Route path="/karigar" element={<ProtectedAdmin><Karigar /></ProtectedAdmin>} />
    <Route path="/customers" element={<ProtectedAdmin><Customers /></ProtectedAdmin>} />
    <Route path="/customers/:customerId" element={<ProtectedAdmin><CustomerDetails /></ProtectedAdmin>} />
    <Route path="/employees" element={<ProtectedAdmin><Employees /></ProtectedAdmin>} />
    <Route path="/employees/:employeeId" element={<ProtectedAdmin><EmployeeDetails /></ProtectedAdmin>} />
    <Route path="/accounting" element={<ProtectedAdmin><Accounting /></ProtectedAdmin>} />
    <Route path="/reports" element={<ProtectedAdmin><Reports /></ProtectedAdmin>} />
    <Route path="/old-gold-exchange" element={<ProtectedAdmin><OldGoldExchange /></ProtectedAdmin>} />

    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AdminAuthProvider>
      <AppDemoProvider>
        <ShopCartProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </TooltipProvider>
        </ShopCartProvider>
      </AppDemoProvider>
    </AdminAuthProvider>
  </QueryClientProvider>
);

export default App;
