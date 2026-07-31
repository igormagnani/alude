import { requireAdmin } from "@/lib/admin-auth";
import { AdminNav } from "@/components/admin/AdminNav";

export default async function AdminAuthedLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-noite text-areia flex">
      <aside className="w-56 shrink-0 border-r border-areia/10 bg-breu/60">
        <AdminNav />
      </aside>
      <div className="flex-1 min-w-0">
        <main className="max-w-6xl mx-auto px-8 py-10">{children}</main>
      </div>
    </div>
  );
}
