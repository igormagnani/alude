import { requireAdmin } from "@/lib/admin-auth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTabBar } from "@/components/admin/AdminTabBar";

/**
 * Shell do admin. O documento público trava o scroll em <body> (quem rola lá é
 * o <Scroller>) e o admin não usa Scroller, então precisa da própria região de
 * scroll: `fixed inset-0 overflow-y-auto` isola isso do resto do site. A
 * sidebar fica sticky no topo em telas grandes; no mobile ela some e quem
 * navega é a AdminTabBar, fixa no rodapé com a safe-area do iOS.
 */
export default async function AdminAuthedLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="fixed inset-0 overflow-y-auto overscroll-contain bg-noite text-areia lg:flex">
      <aside className="hidden border-r border-areia/10 bg-breu/60 lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-56 lg:shrink-0">
        <AdminSidebar />
      </aside>
      <div className="lg:min-w-0 lg:flex-1">
        <main className="mx-auto max-w-6xl px-5 pb-28 pt-6 lg:px-8 lg:pb-10 lg:pt-10">{children}</main>
      </div>
      <AdminTabBar />
    </div>
  );
}
