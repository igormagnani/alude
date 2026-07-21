/**
 * Acervo da galeria. Para somar mídia nova: solte o arquivo em /public/galeria e
 * acrescente aqui com as dimensões reais (elas reservam o espaço antes de carregar,
 * senão o mosaico pula enquanto a imagem chega).
 *
 * Vídeo já é suportado: use tipo "video", aponte `src` pro mp4 e `poster` pro frame
 * de capa. O acervo atual só tem material real de vídeo da Sol da Meia Noite, que já
 * vive na seção dela, então por ora a galeria é fotográfica.
 */
export type Midia = {
  tipo: "foto" | "video";
  src: string;
  poster?: string;
  w: number;
  h: number;
  alt: string;
};

export const GALERIA: Midia[] = [
  { tipo: "foto", src: "/galeria/pista-cheia.webp", w: 1600, h: 1067, alt: "Alude de braços abertos no palco, feixes verdes cortando a casa cheia" },
  { tipo: "foto", src: "/galeria/bracos-fumaca.webp", w: 1068, h: 1600, alt: "Alude de braços erguidos entre dois refletores e fumaça" },
  { tipo: "foto", src: "/galeria/teto-laser.webp", w: 1280, h: 854, alt: "Vista do alto: teto de lasers vermelhos e azuis sobre o Alude na cabine" },
  { tipo: "foto", src: "/galeria/preto-e-branco.webp", w: 1000, h: 1600, alt: "Retrato em preto e branco do Alude de fone, rindo durante o set" },
  { tipo: "foto", src: "/galeria/letreiro.webp", w: 1600, h: 1068, alt: "Alude tocando com o letreiro ALUDE em neon aceso atrás" },
  { tipo: "foto", src: "/galeria/lasers-magenta.webp", w: 1068, h: 1600, alt: "Alude de braços para o alto sob lasers magenta em galpão industrial" },
  { tipo: "foto", src: "/galeria/sala-cheia.webp", w: 1600, h: 1033, alt: "Vista da sala lotada com o nome ALUDE projetado no telão" },
  { tipo: "foto", src: "/galeria/silhueta.webp", w: 1067, h: 1600, alt: "Silhueta do Alude recortada contra o feixe de luz do palco" },
  { tipo: "foto", src: "/galeria/co2.webp", w: 1280, h: 854, alt: "Alude disparando canhão de CO2 sobre a pista" },
  { tipo: "foto", src: "/galeria/rio.webp", w: 1600, h: 1068, alt: "Alude saltando num mirante do Rio com a cidade e o mar ao pôr do sol" },
  { tipo: "foto", src: "/galeria/sol-bandeira.webp", w: 1023, h: 678, alt: "Alude erguendo a bandeira da Sol da Meia Noite" },
  { tipo: "foto", src: "/galeria/de-costas.webp", w: 1600, h: 1068, alt: "Alude de costas na cabine, de frente para a pista e as luzes da cidade" },
];

export const PRESS_KIT =
  "https://drive.google.com/drive/folders/1B9Q1xrod3sRRvSyx8p1tnH57na03dAbB";
