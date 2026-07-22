import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * Uma linha só porque o site tem uma rota só: tudo mora em `/`. Se um dia nascerem
 * páginas de verdade (uma por série de playlist, um "sobre", uma agenda), elas entram
 * aqui e o arquivo cresce sozinho.
 *
 * Sem `changefreq` nem `priority`: o Google declarou publicamente que ignora os dois.
 * `lastModified` ele usa, e sai da data do build, que é quando o conteúdo muda.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: SITE_URL, lastModified: new Date() }];
}
