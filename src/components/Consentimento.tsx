"use client";

import { useEffect, useState } from "react";
import { CONSENT_EVENTO, gravarConsentimento, lerConsentimento } from "@/lib/consentimento";

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

function avisarGoogle(aceito: boolean) {
  const estado = aceito ? "granted" : "denied";
  window.dataLayer = window.dataLayer || [];
  // o pixel da Meta entrou, então o consentimento cobre publicidade também
  window.dataLayer.push([
    "consent",
    "update",
    {
      analytics_storage: estado,
      ad_storage: estado,
      ad_user_data: estado,
      ad_personalization: estado,
    },
  ]);
}

/**
 * Banner de consentimento. O site nasce com armazenamento NEGADO e o pixel da Meta
 * nem carrega, então quem ignora o aviso não é rastreado: o banner só libera.
 */
export function Consentimento() {
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    if (!lerConsentimento()) setVisivel(true);
    const ouvir = () => setVisivel(false);
    window.addEventListener(CONSENT_EVENTO, ouvir);
    return () => window.removeEventListener(CONSENT_EVENTO, ouvir);
  }, []);

  const responder = (aceito: boolean) => {
    avisarGoogle(aceito);
    gravarConsentimento(aceito ? "aceito" : "recusado");
    setVisivel(false);
  };

  if (!visivel) return null;

  return (
    <div
      role="dialog"
      aria-label="Aviso de cookies"
      // o botão de som mora embaixo à direita: no celular o banner sobe pra não cobrir
      className="fixed inset-x-4 bottom-24 z-[55] border border-areia/20 bg-breu/95 p-5 backdrop-blur-sm md:inset-x-auto md:bottom-6 md:left-6 md:max-w-sm"
    >
      <p className="text-sm leading-relaxed text-areia/80">
        Uso cookies pra medir quanta gente passa por aqui e pra alcançar de novo quem já
        veio, nos anúncios. Nada de vender seus dados.
      </p>
      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={() => responder(true)}
          className="bg-ambar px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-breu transition-transform hover:scale-[1.03]"
        >
          Pode usar
        </button>
        <button
          type="button"
          onClick={() => responder(false)}
          className="border border-areia/30 px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-areia/80 transition-colors hover:border-ambar hover:text-ambar"
        >
          Prefiro não
        </button>
      </div>
    </div>
  );
}
