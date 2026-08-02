"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Mesa" },
  { href: "/admin/pauta", label: "Pauta" },
  { href: "/admin/mais", label: "Mais" },
];

/** Mesma regra de "ativo" da AdminTabBar: ver comentário lá. */
const MESA_PREFIXES = ["/admin/p/", "/admin/editar/", "/admin/fila", "/admin/agenda"];

function isMesaPath(pathname: string): boolean {
  if (pathname === "/admin") return true;
  return MESA_PREFIXES.some((p) => pathname.startsWith(p));
}

/** Navegação de desktop (lg+). No mobile, quem navega é a AdminTabBar. */
export function AdminSidebar() {
  const pathname = usePathname() ?? "";
  const router = useRouter();

  async function sair() {
    await fetch("/api/admin/logout", { method: "POST", credentials: "same-origin" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <nav className="flex flex-col h-full w-full">
      <div className="px-6 py-6 border-b border-areia/10">
        <p className="text-dourado text-xs uppercase tracking-[0.2em]">Alude</p>
        <p className="display text-xl text-areia mt-1">Conteúdo</p>
      </div>
      <ul className="flex-1 px-3 py-4 space-y-1">
        {LINKS.map((link) => {
          const active = link.href === "/admin" ? isMesaPath(pathname) : pathname.startsWith(link.href);
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`block rounded-lg px-3 py-2 text-sm transition-colors duration-150 ${
                  active ? "bg-ambar/15 text-ambar" : "text-areia/70 hover:bg-areia/5 hover:text-areia"
                }`}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="px-3 py-4 border-t border-areia/10">
        <button
          onClick={sair}
          className="w-full text-left rounded-lg px-3 py-2 text-sm text-areia/50 hover:text-areia hover:bg-areia/5 transition-colors duration-150"
        >
          Sair
        </button>
      </div>
    </nav>
  );
}
