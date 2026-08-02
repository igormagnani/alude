"use client";

import { useEffect, useState } from "react";
import type { SVGProps } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PLATFORM_LABELS } from "@/lib/content-constants";
import { IgFeedMock } from "./IgFeedMock";
import { IgReelMock } from "./IgReelMock";
import { IgStoryMock } from "./IgStoryMock";
import { JudgmentBar } from "./JudgmentBar";
import type { PreviewItem, PublicationLink } from "./shared";

/**
 * Ramifica em JSX (em vez de escolher um componente e guardar numa variável)
 * de propósito: atribuir um componente a uma variável durante o render viola
 * a regra react-hooks/static-components (recria o componente a cada render).
 */
function renderMock(item: PreviewItem) {
  if (item.format === "reel" || item.format === "short" || item.format === "video_longo") {
    return <IgReelMock item={item} />;
  }
  if (item.format === "story") return <IgStoryMock item={item} />;
  return <IgFeedMock item={item} />; // foto | carrossel | playlist_update (+ fallback)
}

/**
 * Tela cheia do Preview IG: cobre sidebar e AdminTabBar (ambos abaixo de
 * z-30). Header mínimo (fechar/posição/chevrons/editar), o mock centralizado
 * com largura de celular, e a JudgmentBar fixa embaixo quando a peça ainda
 * não foi publicada. Fechar e o fim da fila voltam pra Mesa (/admin, Fase 3).
 */
export function PreviewShell({
  item,
  prevId,
  nextId,
  position,
  publications,
}: {
  item: PreviewItem;
  prevId: string | null;
  nextId: string | null;
  position: string | null;
  publications: PublicationLink[];
}) {
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);

  const isPublished = item.status === "publicado";

  function goTo(id: string | null) {
    const target = id ? `/admin/p/${id}` : "/admin";
    const reduced =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      router.replace(target);
      return;
    }
    setLeaving(true);
    setTimeout(() => router.replace(target), 220);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target?.closest("input, textarea, select")) return;
      if (e.key === "Escape") router.push("/admin");
      else if (e.key === "ArrowLeft" && prevId) router.push(`/admin/p/${prevId}`);
      else if (e.key === "ArrowRight" && nextId) router.push(`/admin/p/${nextId}`);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prevId, nextId, router]);

  return (
    <div className="fixed inset-0 z-30 flex flex-col bg-black">
      <header
        className="grid shrink-0 grid-cols-3 items-center gap-2 border-b border-white/10 px-2 py-2.5"
        style={{ paddingTop: "max(0.625rem, env(safe-area-inset-top))" }}
      >
        <div className="flex justify-start">
          <Link
            href="/admin"
            aria-label="Fechar preview"
            className="flex h-9 w-9 items-center justify-center rounded-full text-white/70 transition-colors duration-150 hover:bg-white/10 hover:text-white"
          >
            <IconClose className="h-5 w-5" aria-hidden />
          </Link>
        </div>
        <div className="flex items-center justify-center gap-3 text-sm text-white/60">
          <NavChevron href={prevId ? `/admin/p/${prevId}` : undefined} direction="prev" />
          {position && <span className="tabular-nums">{position}</span>}
          <NavChevron href={nextId ? `/admin/p/${nextId}` : undefined} direction="next" />
        </div>
        <div className="flex justify-end">
          <Link
            href={`/admin/editar/${item.id}`}
            className="px-1.5 py-1 text-xs font-semibold text-white/70 transition-colors duration-150 hover:text-white"
          >
            editar
          </Link>
        </div>
      </header>

      <div className={`flex-1 overflow-y-auto overscroll-contain ${isPublished ? "pb-8" : "pb-52"}`}>
        <div key={item.id} className={`mx-auto w-full max-w-[390px] ${leaving ? "admin-card-out" : "admin-pop"}`}>
          {renderMock(item)}
          {isPublished && <PublishedLink publications={publications} />}
        </div>
      </div>

      {!isPublished && <JudgmentBar item={item} onDone={() => goTo(nextId)} />}
    </div>
  );
}

function PublishedLink({ publications }: { publications: PublicationLink[] }) {
  const links = publications.filter((p) => p.external_url);
  if (links.length === 0) {
    return (
      <p className="px-3 pb-6 pt-3 text-center text-xs italic text-white/40">
        Publicado, mas ainda sem link externo registrado.
      </p>
    );
  }
  return (
    <div className="flex flex-wrap justify-center gap-2 px-3 pb-6 pt-3">
      {links.map((p) => (
        <a
          key={p.platform}
          href={p.external_url ?? undefined}
          target="_blank"
          rel="noreferrer"
          className="rounded-full border border-white/20 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors duration-150 hover:border-white/40"
        >
          ver no {PLATFORM_LABELS[p.platform] ?? p.platform} ↗
        </a>
      ))}
    </div>
  );
}

function NavChevron({ href, direction }: { href?: string; direction: "prev" | "next" }) {
  const Icon = direction === "prev" ? IconChevronLeft : IconChevronRight;
  if (!href) {
    return <Icon className="h-5 w-5 text-white/20" aria-hidden />;
  }
  return (
    <Link
      href={href}
      aria-label={direction === "prev" ? "Peça anterior" : "Próxima peça"}
      className="flex h-8 w-8 items-center justify-center rounded-full text-white/70 transition-colors duration-150 hover:bg-white/10 hover:text-white"
    >
      <Icon className="h-5 w-5" aria-hidden />
    </Link>
  );
}

function IconClose(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

function IconChevronLeft(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function IconChevronRight(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}
