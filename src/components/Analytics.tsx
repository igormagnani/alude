import { GA4_ID, GTM_ID } from "@/lib/site";

/**
 * As tags de medição vivem AQUI mas são renderizadas direto no root layout, e não
 * dentro de outro componente: `beforeInteractive` só é promovido pro <head> do HTML
 * servido quando o <Script> está no próprio layout. Isso importa por dois motivos:
 * é o que a documentação do Google manda pro GTM, e é o que faz a verificação do
 * Search Console por "Google Analytics" ou "Gerenciador de tags" enxergar as tags,
 * já que o verificador lê o HTML bruto e não executa o runtime do Next.
 *
 * A ORDEM é lei: consentimento primeiro, senão o primeiro hit sai antes da regra.
 *
 * Armazenamento nasce negado. O banner (Consentimento.tsx) é quem libera, e o pixel
 * da Meta (MetaPixel.tsx) nem carrega antes disso.
 */
export function TagsDeMedicao() {
  return (
    <>
      {/*
        Um bloco só, de propósito. Se o gtag.js viesse numa tag separada, o React o
        hoistaria pro topo do head e a ordem passaria a depender da rede: consentimento
        e carregamento virariam uma corrida. Aqui o próprio script pede o gtag.js no
        fim, então a regra de consentimento é garantidamente anterior.
      */}
      <script id="ga4" dangerouslySetInnerHTML={{ __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',wait_for_update:500});
try{if(localStorage.getItem('alude-consentimento')==='aceito'){gtag('consent','update',{analytics_storage:'granted',ad_storage:'granted',ad_user_data:'granted',ad_personalization:'granted'});}}catch(e){}
gtag('js',new Date());gtag('config','${GA4_ID}');
var g=document.createElement('script');g.async=true;g.src='https://www.googletagmanager.com/gtag/js?id=${GA4_ID}';document.head.appendChild(g);` }} />

      {/* GTM pro resto (pixels, remarketing), sem tag de GA4 dentro dele */}
      <script id="gtm" dangerouslySetInnerHTML={{ __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;
j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');` }} />
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
