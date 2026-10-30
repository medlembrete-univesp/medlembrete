import type { MetadataRoute } from "next";

/** Páginas são pessoais e exigem login; não há o que indexar além da entrada. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: ["/login", "/cadastro"], disallow: ["/api/", "/hoje", "/pacientes", "/medicamentos", "/historico", "/dashboard"] }],
  };
}
