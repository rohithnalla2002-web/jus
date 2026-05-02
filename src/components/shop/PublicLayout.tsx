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
    <div className="min-h-screen bg-gradient-to-b from-[#faf8ff] via-[#f4f0ff] to-[#ebe4f9] text-zinc-900">
      <ShopNav />
      {dataError && !isLandingPage && (
        <div className="mx-auto max-w-4xl px-4 pt-3 text-sm text-violet-900 bg-violet-100/90 border border-violet-200 rounded-lg py-2">
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
