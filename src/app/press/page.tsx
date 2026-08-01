import type { Metadata } from "next";
import Image from "next/image";
import { PERFIS, SITE_URL } from "@/lib/site";
import { Rodape } from "@/components/Booking";

export const metadata: Metadata = {
  title: "ALUDE · Press Kit e Booking",
  description:
    "Press kit oficial do Alude: bio, credenciais, fotos em alta resolução, rider técnico e contato de booking via Enkore.",
  alternates: { canonical: "/press" },
  openGraph: {
    type: "profile",
    locale: "pt_BR",
    url: `${SITE_URL}/press`,
    siteName: "ALUDE",
    title: "ALUDE · Press Kit e Booking",
    description: "Bio, credenciais, fotos em alta e rider técnico do Alude, pronto pra fechar a data.",
    images: [{ url: "/press/fotos/alude-show-01.jpg", width: 1920, height: 1281, alt: "Alude na cabine, foto de show" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ALUDE · Press Kit e Booking",
    description: "Bio, credenciais, fotos em alta e rider técnico do Alude, pronto pra fechar a data.",
    images: ["/press/fotos/alude-show-01.jpg"],
  },
};

/** Entidade da página: referencia o MusicGroup e o WebSite já publicados em site.ts */
const PRESS_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "ProfilePage",
  "@id": `${SITE_URL}/press#page`,
  url: `${SITE_URL}/press`,
  name: "ALUDE · Press Kit e Booking",
  inLanguage: "pt-BR",
  isPartOf: { "@id": `${SITE_URL}/#site` },
  about: { "@id": `${SITE_URL}/#alude` },
  mainEntity: { "@id": `${SITE_URL}/#alude` },
};

const CHIPS = [
  "Mais de 500 mil streams no Spotify",
  "Residente Holy Snow e AVA Club",
  "House · Dance · Tech · Afro · Melodic",
];

const RESIDENCIAS = ["Holy Snow", "AVA Club"];

const PALCOS = ["Morro da Urca", "Sutton", "Londra no Fasano", "Privilège Búzios", "Sol da Meia Noite · Vitória, ES"];

const FOTOS_SHOW = [
  { arquivo: "alude-show-01.jpg", alt: "Alude sorrindo e apontando pra pista durante o set, sob luz quente" },
  { arquivo: "alude-show-02.jpg", alt: "Alude em um mirante do Rio de Janeiro, com a cidade e o mar ao fundo" },
  { arquivo: "alude-show-03.jpg", alt: "Alude na cabine com os braços erguidos sob luzes verdes e azuis" },
  { arquivo: "alude-show-04.jpg", alt: "Alude nos controles da cabine sob luzes verdes" },
  { arquivo: "alude-show-05.jpg", alt: "Alude de mão erguida na cabine sob luz azul" },
  { arquivo: "alude-show-06.jpg", alt: "Alude cantando junto à pista, braço estendido, sob luz azul" },
];

const FOTOS_DOWNLOAD = [
  ...FOTOS_SHOW.map((f, i) => ({ arquivo: f.arquivo, legenda: `Foto de show ${String(i + 1).padStart(2, "0")}` })),
  { arquivo: "alude-estudio-01.jpg", legenda: "Retrato de estúdio 01" },
  { arquivo: "alude-estudio-02.jpg", legenda: "Retrato de estúdio 02" },
];

export default function Press() {
  return (
    <main className="flex flex-col">
      <script
        type="application/ld+json"
        // conteúdo é nosso e estático, não vem de entrada de usuário
        dangerouslySetInnerHTML={{ __html: JSON.stringify(PRESS_JSON_LD) }}
      />

      {/* Hero: a decisão em 10 segundos. Nome, o que ele faz, e por que confiar. */}
      <section className="relative isolate overflow-hidden px-6 pb-16 pt-28 sm:px-10 sm:pb-20 sm:pt-32">
        <Image
          src="/press/fotos/alude-show-01.jpg"
          alt=""
          fill
          priority
          className="object-cover object-[50%_35%]"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(5,6,10,0.6)_0%,rgba(5,6,10,0.88)_68%,rgba(5,6,10,0.98)_100%)]" />

        <div className="relative z-10 mb-10 flex items-center justify-between text-[10px] uppercase tracking-[0.3em]">
          <a href="/" className="text-areia/70 transition-colors hover:text-ambar">
            Alude
          </a>
          <span className="text-areia/40">Press Kit</span>
        </div>

        <div className="press-reveal press-reveal-1 relative z-10 mx-auto max-w-4xl">
          <p className="text-[11px] uppercase tracking-[0.4em] text-ambar">Press Kit · Booking</p>
          <h1 className="display mt-5 text-[clamp(2.6rem,10vw,6.4rem)]">ALUDE</h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-areia/85 sm:text-lg">
            DJ e produtor carioca. Toca do warmup ao after, com leitura de pista em tempo real, em
            festas e clubes do Rio de Janeiro e de mais cinco estados.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {CHIPS.map((chip) => (
              <span
                key={chip}
                className="border border-areia/25 bg-noite/50 px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-areia/85 backdrop-blur-sm"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Bio: os fatos que sustentam a decisão de contratar */}
      <section className="press-reveal press-reveal-2 border-t border-areia/10 px-6 py-16 sm:px-10 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.4em] text-ambar">Bio</p>
          <div className="mt-6 space-y-5 text-base leading-relaxed text-areia/85 sm:text-lg">
            <p>
              O Alude começou a publicar remixes e faixas autorais em 2016. Em 2018, o remix de Que
              Tiro Foi Esse, feito com ETTO e ZROQ, viralizou nas pistas e nas redes no Carnaval. Em
              2019 veio o primeiro single nas plataformas, uma releitura de The Lion Sleeps Tonight
              com BR1 e GÖW, que já passou de meio milhão de streams no Spotify.
            </p>
            <p>
              Hoje o Alude é presença constante no circuito carioca e além. Residente do Holy Snow e
              do AVA Club, já levou seu som a palcos como o Morro da Urca, o Sutton, o Londra no
              Fasano, o Privilège Búzios e a Sol da Meia Noite, em Vitória.
            </p>
            <p>
              Na cabine, a assinatura é uma só: leitura de pista em tempo real, do warmup ao after,
              com house enérgico atravessado por afro, tech e melodic.
            </p>
          </div>
        </div>
      </section>

      {/* Credenciais: prova social em formato de lista, pra escanear rápido */}
      <section className="press-reveal press-reveal-3 border-t border-areia/10 px-6 py-16 sm:px-10 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <p className="text-[11px] uppercase tracking-[0.4em] text-ambar">Credenciais</p>
          <h2 className="display mt-5 text-[clamp(1.8rem,5vw,3.2rem)]">Onde já tocou</h2>

          <div className="mt-10 grid gap-10 sm:grid-cols-[220px_1fr] sm:items-start">
            <Image
              src="/press/fotos/alude-estudio-02.jpg"
              alt="Retrato de estúdio do Alude, fundo amarelo, olhando pra câmera"
              width={640}
              height={960}
              className="hidden h-auto w-full object-cover sm:block"
            />
            <div className="grid gap-10 sm:grid-cols-2">
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em]" style={{ color: "var(--dourado)" }}>
                  Residências
                </p>
                <ul className="mt-4 space-y-2.5 text-sm text-areia/85 sm:text-base">
                  {RESIDENCIAS.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em]" style={{ color: "var(--dourado)" }}>
                  Palcos e casas
                </p>
                <ul className="mt-4 space-y-2.5 text-sm text-areia/85 sm:text-base">
                  {PALCOS.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Galeria: 6 fotos de show, grid responsivo e lazy por padrão */}
      <section className="press-reveal border-t border-areia/10 px-6 py-16 sm:px-10 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.4em] text-ambar">Galeria</p>
              <h2 className="display mt-5 text-[clamp(1.8rem,5vw,3.2rem)]">Fotos de show</h2>
            </div>
            <a
              href="#downloads"
              className="border border-areia/25 px-5 py-2.5 text-[10px] uppercase tracking-[0.25em] text-areia/75 transition-colors hover:border-dourado hover:text-dourado"
            >
              Baixar fotos em alta
            </a>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
            {FOTOS_SHOW.map((foto) => (
              <div key={foto.arquivo} className="relative aspect-[3/2] overflow-hidden bg-breu">
                <Image
                  src={`/press/fotos/${foto.arquivo}`}
                  alt={foto.alt}
                  fill
                  sizes="(min-width: 768px) 33vw, 50vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Downloads: lista simples de links pro hi-res, sem esconder atrás de formulário */}
      <section id="downloads" className="press-reveal scroll-mt-10 border-t border-areia/10 px-6 py-14 sm:px-10 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.4em] text-ambar">Downloads</p>
          <h2 className="display mt-5 text-[clamp(1.5rem,4vw,2.2rem)]">Fotos em alta resolução</h2>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-areia/70">
            Clique pra baixar o arquivo original de cada foto, pronta pra imprensa e material de
            divulgação.
          </p>
          <ul className="mt-8 grid gap-x-8 gap-y-1 sm:grid-cols-2">
            {FOTOS_DOWNLOAD.map((foto) => (
              <li key={foto.arquivo}>
                <a
                  href={`/press/hi-res/${foto.arquivo}`}
                  download
                  className="flex items-center justify-between border-b border-areia/10 py-2.5 text-sm text-areia/80 transition-colors hover:text-dourado"
                >
                  <span>{foto.legenda}</span>
                  <span aria-hidden className="text-xs text-areia/40">
                    ↓
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Ouça: sem embed pesado, só o link direto */}
      <section className="press-reveal border-t border-areia/10 px-6 py-16 text-center sm:px-10 sm:py-20">
        <div className="mx-auto max-w-2xl">
          <p className="text-[11px] uppercase tracking-[0.4em] text-ambar">Ouça</p>
          <h2 className="display mt-5 text-[clamp(1.8rem,5vw,3.2rem)]">Antes de fechar, escuta</h2>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <a
              href={PERFIS.spotify}
              target="_blank"
              rel="noopener noreferrer"
              className="border border-areia/25 px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.25em] text-areia transition-colors hover:border-ambar hover:text-ambar"
            >
              Spotify
            </a>
            <a
              href={PERFIS.soundcloud}
              target="_blank"
              rel="noopener noreferrer"
              className="border border-areia/25 px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.25em] text-areia transition-colors hover:border-ambar hover:text-ambar"
            >
              SoundCloud
            </a>
          </div>
        </div>
      </section>

      {/* Booking: o mesmo padrão claro do fechamento da home, com o rider à mão */}
      <section className="relative flex flex-col items-center gap-8 bg-areia px-6 py-20 text-center sm:py-24">
        <p className="text-[11px] uppercase tracking-[0.4em] text-breu/70">Booking</p>
        <h2 className="display max-w-3xl text-[clamp(1.8rem,6vw,4rem)] text-breu">Fechar a data?</h2>
        <p className="max-w-xl text-base font-medium leading-relaxed text-breu/80">
          Todo booking passa pela Enkore. O rider técnico já está pronto pra baixar e seguir direto
          pra produção do seu evento.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <a
            href={PERFIS.enkore}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-breu px-9 py-4 text-xs font-semibold uppercase tracking-[0.25em] text-areia transition-transform hover:scale-[1.04] active:scale-[0.98]"
          >
            Booking via Enkore
          </a>
          <a
            href="/press/alude-rider-tecnico.pdf"
            download
            className="border border-breu/40 px-9 py-4 text-xs font-semibold uppercase tracking-[0.25em] text-breu transition-colors hover:border-breu hover:bg-breu/5 active:scale-[0.98]"
          >
            Baixar rider técnico
          </a>
        </div>
      </section>

      <Rodape />
    </main>
  );
}
