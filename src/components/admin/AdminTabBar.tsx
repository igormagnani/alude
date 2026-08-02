"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SVGProps } from "react";

const TABS = [
  { href: "/admin", label: "Mesa", Icon: IconMesa },
  { href: "/admin/pauta", label: "Pauta", Icon: IconPauta },
  { href: "/admin/mais", label: "Mais", Icon: IconMais },
] as const;

/**
 * Mesa é "home" de fato: fica ativa em /admin e em toda rota que só existe
 * a partir dela (Preview, Editor, e os stubs de Fila/Agenda enquanto o
 * usuário ainda não terminou o redirect). Barras com "/" garantem que
 * "/admin/p/" nunca casa com "/admin/pauta" por acidente.
 */
const MESA_PREFIXES = ["/admin/p/", "/admin/editar/", "/admin/fila", "/admin/agenda"];

function isMesaPath(pathname: string): boolean {
  if (pathname === "/admin") return true;
  return MESA_PREFIXES.some((p) => pathname.startsWith(p));
}

/** Navegação de mobile (abaixo de lg). Fixa no rodapé, com safe-area do iOS. */
export function AdminTabBar() {
  const pathname = usePathname() ?? "";

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 flex border-t border-areia/10 bg-breu/95 backdrop-blur lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {TABS.map(({ href, label, Icon }) => {
        const active = href === "/admin" ? isMesaPath(pathname) : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] transition-colors duration-150 ${
              active ? "text-ambar" : "text-areia/50"
            }`}
          >
            <Icon className="h-5 w-5" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function IconMesa(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3.5" y="4" width="17" height="12" rx="1.5" />
      <path d="M8 20h8" />
      <path d="M12 16v4" />
    </svg>
  );
}

function IconPauta(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M8 6h12" />
      <path d="M8 12h12" />
      <path d="M8 18h12" />
      <circle cx="4" cy="6" r="1" fill="currentColor" stroke="none" />
      <circle cx="4" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="4" cy="18" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconMais(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}
