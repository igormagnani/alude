"use client";

import { useEffect, useState } from "react";

const KEY = "alude-consentimento";

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

function atualizar(estado: "granted" | "denied") {
  // fala com o Consent Mode pelo dataLayer: não depende do gtag já ter carregado
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(["consent", "update", { analytics_storage: estado }]);
}

/**
 * Banner de consentimento. O site já nasce com armazenamento NEGADO (ver Analytics.tsx),
 * então quem nunca responde nada continua sem cookie: o banner só serve pra liberar,
 * nunca pra restringir. Some pra sempre depois da escolha.
 */
export function Consentimento() {
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setVisivel(true);
    } catch {
      // navegador sem storage: não insiste
    }
  }, []);

  const responder = (aceito: boolean) => {
    try {
      localStorage.setItem(KEY, aceito ? "aceito" : "recusado");
    } catch {
      /* segue sem lembrar da escolha */
    }
    atualizar(aceito ? "granted" : "denied");
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
        Uso cookies só pra medir quanta gente passa por aqui. Nada de anúncio, nada de
        vender seus dados.
      </p>
      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={() => responder(true)}
          className="bg-ambar px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-breu transition-transform hover:scale-[1.03]"
        >
          Pode medir
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
