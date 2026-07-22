import Script from "next/script";

/**
 * GA4. Fica inteiramente desligado até existir NEXT_PUBLIC_GA_ID no ambiente da
 * Vercel, então subir este arquivo não liga rastreamento nenhum sozinho.
 *
 * Consent Mode v2 entra negando armazenamento por padrão: sem isso o GA4 grava
 * cookie na primeira visita, o que num site brasileiro sem banner de consentimento
 * é exposição desnecessária de LGPD. Com `denied`, a medição segue existindo em
 * modelo agregado e sem cookie até que haja consentimento explícito.
 */
export function Analytics() {
  const id = process.env.NEXT_PUBLIC_GA_ID;
  if (!id) return null;

  return (
    <>
      <Script id="ga-consent" strategy="beforeInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied'});`}
      </Script>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="afterInteractive" />
      <Script id="ga-init" strategy="afterInteractive">
        {`gtag('js', new Date());gtag('config','${id}',{anonymize_ip:true});`}
      </Script>
    </>
  );
}
