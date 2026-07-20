import Image from "next/image";

export function Booking() {
  return (
    <section className="relative flex min-h-svh items-center justify-center overflow-hidden px-6 text-center">
      <Image
        src="/brand/hero-poster.jpg"
        alt=""
        fill
        className="scale-105 object-cover opacity-25 blur-[3px]"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-noite via-noite/70 to-noite" />
      <div className="relative flex flex-col items-center gap-9">
        <p className="text-[11px] uppercase tracking-[0.4em] text-ambar">Booking</p>
        <h2 className="display max-w-4xl text-[clamp(2.4rem,8vw,6.5rem)]">
          Leva essa energia
          <br />
          pra sua festa
        </h2>
        <p className="max-w-xl text-base leading-relaxed text-areia/75">
          Do warmup que enche a casa ao set que ninguém quer que acabe. Chama no direct que a
          conversa começa por lá.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <a
            href="https://www.instagram.com/aludemusic/"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-ambar px-9 py-4 text-xs font-semibold uppercase tracking-[0.25em] text-breu transition-transform hover:scale-[1.04]"
          >
            Chamar no Instagram
          </a>
          <a
            href="https://www.enkoremusic.com/alude"
            target="_blank"
            rel="noopener noreferrer"
            className="border border-areia/30 px-9 py-4 text-xs font-semibold uppercase tracking-[0.25em] text-areia transition-colors hover:border-ambar hover:text-ambar"
          >
            Booking via Enkore
          </a>
        </div>
      </div>
    </section>
  );
}

export function Rodape() {
  return (
    <footer className="border-t border-areia/10 px-6 py-12">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 md:flex-row md:justify-between">
        <Image src="/brand/logo-branca.png" alt="ALUDE" width={120} height={120} className="h-auto w-24" />
        <div className="flex gap-7 text-[10px] uppercase tracking-[0.3em] text-areia/55">
          <a href="https://www.instagram.com/aludemusic/" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-ambar">Instagram</a>
          <a href="https://open.spotify.com/artist/0y1hTVsxI6ZHval2nbIZJH" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-ambar">Spotify</a>
          <a href="https://soundcloud.com/aludeoficial" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-ambar">SoundCloud</a>
        </div>
        <p className="text-[10px] uppercase tracking-[0.3em] text-areia/35">Rio de Janeiro</p>
      </div>
    </footer>
  );
}
