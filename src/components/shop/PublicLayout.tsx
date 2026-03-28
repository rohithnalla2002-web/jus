import { Outlet } from "react-router-dom";
import { useAppDemo } from "@/context/AppDemoContext";
import ShopNav from "./ShopNav";
import ShopFooter from "./ShopFooter";

export default function PublicLayout() {
  const { dataLoading, dataError } = useAppDemo();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fefdfb] via-[#faf8f5] to-[#f5f0e8] text-zinc-900">
      <ShopNav />
      {dataError && (
        <div className="mx-auto max-w-4xl px-4 pt-3 text-sm text-amber-900 bg-amber-100/90 border border-amber-200 rounded-lg py-2">
          Shop data could not load: {dataError}. Start the API (<code className="text-xs">npm run dev --prefix server</code>) and refresh.
        </div>
      )}
      {dataLoading && !dataError && (
        <div className="mx-auto max-w-4xl px-4 pt-3 text-sm text-zinc-600">Loading catalogue…</div>
      )}
      <main>
        <Outlet />
      </main>
      <ShopFooter />
    </div>
  );
}
