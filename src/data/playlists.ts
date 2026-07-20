/**
 * Catálogo de playlists do Alude, organizado por SÉRIE.
 *
 * COMO ADICIONAR UMA PLAYLIST NOVA:
 * 1. Ache a série certa abaixo (ou crie uma nova entrada em SERIES).
 * 2. Some um objeto em `playlists` com: nome, id do Spotify (o trecho depois
 *    de /playlist/ na URL), a descrição curta e a capa em /public/brand.
 * 3. Só isso. A seção do site cria a aba da série e o card sozinha.
 *
 * Séries sem playlist ainda não aparecem no site (não renderiza aba vazia).
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
    ],
  },
  {
    slug: "taste-breaker",
    nome: "Taste Breaker",
    tagline: "O que quebra o gosto padrão",
    playlists: [],
  },
];

export const SERIES_ATIVAS = SERIES.filter((s) => s.playlists.length > 0);
