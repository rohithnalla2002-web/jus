import { Crown, Database, KeyRound, ShieldCheck } from "lucide-react";
import SuperAdminLayout from "@/components/super-admin/SuperAdminLayout";
import PageHeader from "@/components/shared/PageHeader";

const settings = [
  {
    title: "Super Admin Login",
    detail: "Default access is available at /super-admin/login with username super and password super@123.",
    icon: Crown,
  },
  {
    title: "DB-backed Admins",
    detail: "Admins created here are stored in PostgreSQL and can sign in from the normal Admin Login screen.",
    icon: Database,
  },
  {
    title: "Password Security",
    detail: "Admin passwords are stored as PBKDF2 hashes. The Super Admin credential can be moved to env variables later.",
    icon: KeyRound,
  },
  {
    title: "Audit Control",
    detail: "Create, update, deactivate and reset-password actions are captured in the Super Admin audit log.",
    icon: ShieldCheck,
  },
];

export default function SuperAdminSettings() {
  return (
    <SuperAdminLayout>
      <PageHeader title="Super Admin Settings" subtitle="Security posture and module configuration" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {settings.map((item) => (
          <section key={item.title} className="glass card-shine rounded-2xl p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                <item.icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="font-serif text-xl font-bold text-foreground">{item.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.detail}</p>
              </div>
            </div>
          </section>
        ))}
      </div>
      <div className="mt-5 rounded-2xl border border-violet-200/80 bg-gradient-to-r from-violet-50 via-fuchsia-50 to-cyan-50 p-5 text-sm text-violet-950">
        <p className="font-semibold">Recommended next hardening step</p>
        <p className="mt-1 text-violet-900/80">
          For production, set SUPER_ADMIN_USERNAME and SUPER_ADMIN_PASSWORD in the server environment and rotate the default password.
        </p>
      </div>
    </SuperAdminLayout>
  );
}
