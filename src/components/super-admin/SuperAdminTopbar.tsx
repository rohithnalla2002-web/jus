import { Menu, Search, ShieldCheck, Sparkles, User } from "lucide-react";
import { useSuperAdminAuth } from "@/context/SuperAdminAuthContext";

export default function SuperAdminTopbar({
  search,
  onSearchChange,
  onOpenMobileNav,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  onOpenMobileNav: () => void;
}) {
  const { name, username } = useSuperAdminAuth();

  return (
    <header className="z-30 flex h-16 shrink-0 items-center justify-between border-b border-border glass px-4 sm:px-6 md:sticky md:top-0">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileNav}
          className="rounded-lg p-2 transition-colors hover:bg-secondary md:hidden"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5 text-muted-foreground" />
        </button>

        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search admins, roles, emails..."
            className="w-full rounded-lg border border-border bg-secondary/50 py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-primary/50 focus:outline-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <div className="hidden items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 md:flex">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-medium text-primary">Super Admin Online</span>
        </div>
        <div className="flex items-center gap-2 border-l border-border pl-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-700 via-fuchsia-600 to-cyan-500">
            <User className="h-4 w-4 text-white" />
          </div>
          <div className="hidden text-left md:block">
            <p className="text-sm font-medium text-foreground">{name ?? "Super Admin"}</p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <ShieldCheck className="h-3 w-3" />
              {username ?? "super"}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
