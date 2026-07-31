export const PILLAR_LABELS: Record<string, string> = {
  pov_cabine: "POV cabine",
  recap: "Recap de festa",
  comunidade: "Comunidade",
  curadoria: "Curadoria",
  day_in_the_life: "Um dia na vida",
  bastidor_estilo: "Bastidor de estilo",
};

/** Quadrantes da matriz de conteúdo (docs/arquitetura-de-conteudo.md). */
export type ContentTypeQuadrant = "entreter" | "inspirar" | "curadoria" | "convocar";

export const CONTENT_TYPE_LABELS: Record<string, string> = {
  humor: "Humor",
  viral_remix: "Viral remix",
  lifestyle: "Lifestyle",
  storytelling: "Storytelling",
  inspiracional: "Inspiracional",
  autoridade: "Autoridade",
  valor: "Valor",
  engajamento: "Engajamento",
};

export const CONTENT_TYPE_QUADRANTS: { key: ContentTypeQuadrant; label: string; types: string[] }[] = [
  { key: "entreter", label: "Entreter", types: ["humor", "viral_remix"] },
  { key: "inspirar", label: "Inspirar", types: ["lifestyle", "storytelling", "inspiracional"] },
  { key: "curadoria", label: "Curadoria", types: ["autoridade", "valor"] },
  { key: "convocar", label: "Convocar", types: ["engajamento"] },
];

/** Ordem canônica dos 8 tipos, igual à constraint do banco. */
export const CONTENT_TYPES: string[] = CONTENT_TYPE_QUADRANTS.flatMap((q) => q.types);

export const CONTENT_TYPE_TO_QUADRANT: Record<string, ContentTypeQuadrant> = Object.fromEntries(
  CONTENT_TYPE_QUADRANTS.flatMap((q) => q.types.map((t) => [t, q.key]))
);

/** Cor discreta por quadrante, só com os tokens existentes (areia/breu/dourado/ambar). */
export const CONTENT_TYPE_QUADRANT_BADGE: Record<ContentTypeQuadrant, string> = {
  entreter: "bg-ambar/15 text-ambar",
  inspirar: "bg-dourado/15 text-dourado",
  curadoria: "bg-areia/10 text-areia/70",
  convocar: "bg-breu text-ambar border border-ambar/40",
};

export const FORMAT_LABELS: Record<string, string> = {
  reel: "Reel",
  carrossel: "Carrossel",
  story: "Story",
  foto: "Foto",
  short: "Short",
  video_longo: "Vídeo longo",
  playlist_update: "Atualização de playlist",
};

export const PLATFORM_LABELS: Record<string, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  "youtube-shorts": "YouTube Shorts",
  spotify: "Spotify",
};

export const ITEM_STATUS_LABELS: Record<string, string> = {
  ideia: "Ideia",
  draft: "Rascunho",
  em_revisao: "Em revisão",
  aprovado: "Aprovado",
  agendado: "Agendado",
  publicado: "Publicado",
  rejeitado: "Rejeitado",
  arquivado: "Arquivado",
};

export const TOPIC_STATUS_LABELS: Record<string, string> = {
  novo: "Novo",
  aprovado: "Aprovado",
  usado: "Usado",
  descartado: "Descartado",
};

export const TOPIC_SOURCE_LABELS: Record<string, string> = {
  radar: "Radar",
  agenda: "Agenda",
  marco: "Marco",
  igor: "Igor",
  tendencia: "Tendência",
  ciclo: "Ciclo",
};

export const DIA_LABELS: Record<string, string> = {
  seg: "Seg",
  ter: "Ter",
  qua: "Qua",
  qui: "Qui",
  sex: "Sex",
  sab: "Sáb",
  dom: "Dom",
};

export const DIA_ORDER = ["seg", "ter", "qua", "qui", "sex", "sab", "dom"];
