/** Endereço canônico. O apex redireciona pra cá, então o www é a forma oficial. */
export const SITE_URL = "https://www.aludemusic.com";

/**
 * IDs de medição. Não são segredo (viajam no HTML de qualquer visitante), então ficam
 * no código: assim preview e produção medem igual, sem depender de variável de ambiente.
 *
 * ATENÇÃO A DUPLICIDADE: o GA4 é disparado AQUI, pelo gtag. Se alguém criar uma tag
 * "Configuração do GA4" dentro do GTM apontando pro mesmo G-, todo pageview passa a
 * contar duas vezes. Se um dia o GA4 for movido pra dentro do GTM, apague o gtag daqui.
 */
export const GA4_ID = "G-L4KN85165F";
export const GTM_ID = "GTM-W6BTWZNV";

export const PERFIS = {
  instagram: "https://www.instagram.com/aludemusic/",
  spotify: "https://open.spotify.com/artist/0y1hTVsxI6ZHval2nbIZJH",
  soundcloud: "https://soundcloud.com/aludeoficial",
  enkore: "https://www.enkoremusic.com/alude",
};

/**
 * Entidade da marca pro Google e pros modelos de linguagem. Só entra aqui o que já
 * está publicado no site ou verificado em fonte primária: nada de número inventado.
 */
export const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "MusicGroup",
      "@id": `${SITE_URL}/#alude`,
      name: "ALUDE",
      alternateName: "Alude",
      description:
        "DJ e produtor carioca. Toca do warmup ao after, com leitura de pista em tempo real, em festas e clubes do Rio de Janeiro e de mais cinco estados.",
      genre: ["House", "Jazz House"],
      url: SITE_URL,
      image: `${SITE_URL}/brand/hero-poster.jpg`,
      logo: `${SITE_URL}/brand/logo-cor.png`,
      foundingLocation: {
        "@type": "Place",
        name: "Rio de Janeiro, RJ, Brasil",
      },
      areaServed: [
        { "@type": "Country", name: "Brasil" },
        { "@type": "AdministrativeArea", name: "Rio de Janeiro" },
      ],
      sameAs: [PERFIS.instagram, PERFIS.spotify, PERFIS.soundcloud, PERFIS.enkore],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#site`,
      url: SITE_URL,
      name: "ALUDE",
      inLanguage: "pt-BR",
      publisher: { "@id": `${SITE_URL}/#alude` },
    },
  ],
};
