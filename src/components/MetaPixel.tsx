"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { META_PIXEL_ID } from "@/lib/site";
import { CONSENT_EVENTO, lerConsentimento } from "@/lib/consentimento";

/**
 * Pixel da Meta. Diferente do GA4, ele NÃO carrega antes do consentimento: é
 * rastreamento publicitário, e o simples pedido a connect.facebook.net já entrega
 * IP e página visitada pra Meta. Então o script só entra em cena depois do aceite.
 *
 * Consequência que vale saber: quem recusa não é atribuído em campanha nenhuma.
 * Isso é o preço da conformidade, não um bug.
 *
 * Sem versão <noscript>: quem navega sem JavaScript nunca viu o banner, logo nunca
 * consentiu, e disparar o pixel por baixo seria justamente o que queremos evitar.
 */
export function MetaPixel() {
  const [liberado, setLiberado] = useState(false);

  useEffect(() => {
    if (lerConsentimento() === "aceito") setLiberado(true);
    const ouvir = (e: Event) => {
      setLiberado((e as CustomEvent).detail === "aceito");
    };
    window.addEventListener(CONSENT_EVENTO, ouvir);
    return () => window.removeEventListener(CONSENT_EVENTO, ouvir);
  }, []);

  if (!liberado) return null;

  return (
    <Script id="meta-pixel" strategy="afterInteractive">
      {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${META_PIXEL_ID}');fbq('track','PageView');`}
    </Script>
  );
}
