import Script from "next/script";
import { GA4_ID, GTM_ID } from "@/lib/site";

/**
 * Ordem importa: o Consent Mode precisa rodar ANTES de GTM e gtag, senão a primeira
 * medição sai antes da regra de consentimento e o cookie é gravado assim mesmo.
 *
 * Armazenamento nasce negado porque o site não tem banner de consentimento e gravar
 * cookie na primeira visita de um site brasileiro é exposição de LGPD sem necessidade.
 * O efeito colateral é real: sem cookie o GA4 não reconhece visitante que volta, então
 * "usuários" vem superestimado e "novos vs recorrentes" perde sentido. Sessão e
 * pageview seguem contando. Pra ter o número cheio, o caminho é um banner de consentimento.
 */
export function Analytics() {
  return (
    <>
      <Script id="consent-default" strategy="beforeInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',wait_for_update:500});
try{if(localStorage.getItem('alude-consentimento')==='aceito'){gtag('consent','update',{analytics_storage:'granted',ad_storage:'granted',ad_user_data:'granted',ad_personalization:'granted'});}}catch(e){}`}
      </Script>

      {/* GA4 direto. Ver o aviso de duplicidade em src/lib/site.ts antes de mexer. */}
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">
        {`gtag('js', new Date());gtag('config','${GA4_ID}');`}
      </Script>

      {/* GTM pro resto (pixels, remarketing), sem tag de GA4 dentro dele */}
      <Script id="gtm" strategy="afterInteractive">
        {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;
j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');`}
      </Script>
    </>
  );
}

/** Fallback do GTM pra quem navega sem JavaScript. Vai logo depois da abertura do body. */
export function GtmNoScript() {
  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
        height="0"
        width="0"
        style={{ display: "none", visibility: "hidden" }}
        title="Google Tag Manager"
      />
    </noscript>
  );
}
