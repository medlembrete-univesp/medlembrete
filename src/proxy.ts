import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { configSupabase } from "@/lib/supabase/config";

/** Rotas acessíveis sem login (RF03: todas as outras exigem sessão). */
const PUBLICAS = ["/login", "/cadastro", "/logout", "/api/saude"];

function ehPublica(caminho: string): boolean {
  return PUBLICAS.some((p) => caminho === p || caminho.startsWith(`${p}/`));
}

/**
 * Roda antes de cada requisição: renova o token de sessão do Supabase (gravando
 * os cookies novos) e redireciona quem não está logado para /login.
 */
export async function proxy(request: NextRequest) {
  const caminho = request.nextUrl.pathname;
  const cfg = configSupabase();

  // Sem Supabase configurado não há sessão para checar; as páginas explicam o que falta.
  if (!cfg) return NextResponse.next({ request });

  let resposta = NextResponse.next({ request });
  const supabase = createServerClient(cfg.url, cfg.chave, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(paraDefinir) {
        for (const { name, value } of paraDefinir) request.cookies.set(name, value);
        resposta = NextResponse.next({ request });
        for (const { name, value, options } of paraDefinir) {
          resposta.cookies.set(name, value, options);
        }
      },
    },
  });

  // getUser() valida o token no servidor do Supabase (não confiar só no cookie).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !ehPublica(caminho)) {
    if (caminho.startsWith("/api/")) {
      return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });
    }
    const destino = request.nextUrl.clone();
    destino.pathname = "/login";
    destino.search = "";
    if (caminho !== "/" && caminho !== "/hoje") destino.searchParams.set("proximo", caminho);
    return NextResponse.redirect(destino);
  }

  if (user && (caminho === "/login" || caminho === "/cadastro")) {
    const destino = request.nextUrl.clone();
    destino.pathname = "/hoje";
    destino.search = "";
    return NextResponse.redirect(destino);
  }

  return resposta;
}

export const config = {
  matcher: [
    // Tudo, menos o que é interno do Next (/_next/: estáticos, imagens e o
    // websocket de atualização ao vivo do modo dev) e arquivos de imagem.
    "/((?!_next/|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
