import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        // o endereço da Vercel continua servindo o site inteiro: sem isso são dois
        // hostnames com conteúdo idêntico dividindo sinal de busca entre si
        source: "/:caminho*",
        has: [{ type: "host", value: "alude.vercel.app" }],
        destination: "https://www.aludemusic.com/:caminho*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
