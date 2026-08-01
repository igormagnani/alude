import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * Duas rotas reais: a home e o press kit de booking. Sem `changefreq` nem `priority`:
 * o Google declarou publicamente que ignora os dois. `lastModified` ele usa, e sai da
 * data do build, que é quando o conteúdo muda.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    { url: SITE_URL, lastModified },
    { url: `${SITE_URL}/press`, lastModified },
  ];
}
