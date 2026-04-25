import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useAppDemo } from "@/context/AppDemoContext";
import ShopNav from "./ShopNav";
import ShopFooter from "./ShopFooter";

export default function PublicLayout() {
  const { dataLoading, dataError } = useAppDemo();
  const location = useLocation();
  const isLandingPage = location.pathname === "/";

  useEffect(() => {
    const { hash } = location;
    if (!hash) return;

    const id = decodeURIComponent(hash.slice(1));
    const el = document.getElementById(id);
    if (!el) return;

    const navOffset = 96;
    const top = el.getBoundingClientRect().top + window.scrollY - navOffset;
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  }, [location.hash, location.pathname, dataLoading]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fefdfb] via-[#faf8f5] to-[#f5f0e8] text-zinc-900">
      <ShopNav />
      {dataError && !isLandingPage && (
        <div className="mx-auto max-w-4xl px-4 pt-3 text-sm text-amber-900 bg-amber-100/90 border border-amber-200 rounded-lg py-2">
          Shop data could not load: {dataError}. Start the API (<code className="text-xs">npm run dev --prefix server</code>) and refresh.
        </div>
      )}
      {dataLoading && !dataError && !isLandingPage && (
        <div className="mx-auto max-w-4xl px-4 pt-3 text-sm text-zinc-600">Loading catalogue…</div>
      )}
      <main>
        <Outlet />
      </main>
      <ShopFooter />
    </div>
  );
}
