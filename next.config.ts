import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Contorno para o bug do Turbopack no Next 16.4 (issues #100251 e #100267):
    // com o cache de dev em disco ligado, a primeira inscrição do HMR devolve
    // "restart" e a aba recarrega sem parar. Remover quando a correção for lançada.
    turbopackFileSystemCacheForDev: false,
  },
};

export default nextConfig;
