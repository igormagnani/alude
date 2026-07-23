/**
 * Catálogo de playlists do Alude, organizado por SÉRIE.
 *
 * COMO ADICIONAR UMA PLAYLIST NOVA:
 * 1. Ache a série certa abaixo (ou crie uma nova entrada em SERIES).
 * 2. Some um objeto em `playlists` com: nome, id do Spotify (o trecho depois
 *    de /playlist/ na URL), a descrição curta e a capa em /public/brand/playlists.
 * 3. Só isso. A seção do site cria a aba da série e o card sozinha.
 *
 * Séries sem playlist ainda não aparecem no site (não renderiza aba vazia).
 * Capas baixadas do próprio Spotify (as descrições de lá eram da época da
 * quarentena; as daqui foram reescritas na voz do site).
 */

export type Playlist = {
  nome: string;
  spotifyId: string;
  descricao: string;
  capa: string;
  faixas?: number;
};

export type Serie = {
  slug: string;
  nome: string;
  tagline: string;
  playlists: Playlist[];
};

export const SERIES: Serie[] = [
  {
    slug: "main-stage",
    nome: "Main Stage",
    tagline: "O som que sustenta a pista cheia",
    playlists: [
      {
        nome: "Jazz House",
        spotifyId: "4oLS2eis2vrqureHU36hhy",
        descricao:
          "A sofisticação do jazz com o convite da pista. Escolhidas a dedo, atualizadas toda semana.",
        capa: "/brand/jazz-house-capa.jpg",
        faixas: 58,
      },
      {
        nome: "Alude B.Day",
        spotifyId: "6vIhM98Su8komwSZrOUibc",
        descricao: "A trilha do aniversário do Alude, aberta pra você levar pra sua festa.",
        capa: "/brand/playlists/alude-bday.jpg",
      },
    ],
  },
  {
    slug: "taste-breaker",
    nome: "Taste Breaker",
    tagline: "O que quebra o gosto padrão",
    playlists: [
      {
        nome: "SLOW DOWN",
        spotifyId: "1vzp066rbj1YH8E9M4rSw0",
        descricao: "Downtempo soulful pro dia sem pressa. FKJ, Masego, Tom Misch.",
        capa: "/brand/playlists/slow-down.jpg",
      },
      {
        nome: "BOSSA",
        spotifyId: "5UvLHbeScHVoTdX7EHkS81",
        descricao: "Versões em bossa das músicas que você ama. Brasilidade pura.",
        capa: "/brand/playlists/bossa.jpg",
      },
      {
        nome: "RENDEZVOUS",
        spotifyId: "6MEmI4PiPhXEdlHVyOUnr1",
        descricao: "O jazz que a França faz como ninguém. Paris em forma de playlist.",
        capa: "/brand/playlists/rendezvous.jpg",
      },
      {
        nome: "SEXXXY",
        spotifyId: "7DSxwb5xmGqhY2Cwgc4ZHb",
        descricao: "Pra subir a temperatura. Tinashe, Ginuwine, Niykee Heaton.",
        capa: "/brand/playlists/sexxxy.jpg",
      },
      {
        nome: "SING ALONG",
        spotifyId: "3iHtAwu4M2uZDCj19VgSpb",
        descricao: "As que todo mundo canta junto, do primeiro ao último verso.",
        capa: "/brand/playlists/sing-along.jpg",
      },
      {
        nome: "BARONNETI",
        spotifyId: "1Of50jjQcFkyYZnViJy1LB",
        descricao: "Túnel do tempo 2005 a 2009. David Guetta, Bob Sinclair, DJ Antoine.",
        capa: "/brand/playlists/baronneti.jpg",
      },
      {
        nome: "CLASSICAL",
        spotifyId: "3J9OMULVt2JK5l6ZZZuQdB",
        descricao: "Os clássicos que você conhece sem saber o nome. Bach, Mozart, Vivaldi.",
        capa: "/brand/playlists/classical.jpg",
      },
    ],
  },
  {
    slug: "anthology",
    nome: "Anthology",
    tagline: "As faixas que definiram cada década",
    playlists: [
      {
        nome: "HIP-HOP ANTHOLOGY",
        spotifyId: "3Ab5HUemBwpSaFJXbe39rO",
        descricao: "O melhor do hip-hop, dos anos 80 até hoje. 2Pac, Dr. Dre, Kanye, Travis Scott.",
        capa: "/brand/playlists/hip-hop-anthology.jpg",
      },
      {
        nome: "ELECTRONIC ANTHOLOGY",
        spotifyId: "2i4XUs1YJboQwlltZa4ZWS",
        descricao: "As faixas que definiram a pista, década a década. De Lasgo a Vintage Culture.",
        capa: "/brand/playlists/electronic-anthology.jpg",
      },
    ],
  },
];

export const SERIES_ATIVAS = SERIES.filter((s) => s.playlists.length > 0);
