export const CONSENT_KEY = "alude-consentimento";
/** O banner avisa quem depende da escolha (GA4 e pixel) sem precisar recarregar a página. */
export const CONSENT_EVENTO = "alude-consentimento-mudou";

export type Consentimento = "aceito" | "recusado" | null;

export function lerConsentimento(): Consentimento {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    return v === "aceito" || v === "recusado" ? v : null;
  } catch {
    return null;
  }
}

export function gravarConsentimento(valor: Exclude<Consentimento, null>) {
  try {
    localStorage.setItem(CONSENT_KEY, valor);
  } catch {
    /* navegador sem storage: vale só pra esta visita */
  }
  window.dispatchEvent(new CustomEvent(CONSENT_EVENTO, { detail: valor }));
}
