import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { configSupabase, exigirConfigSupabase } from "./config";

/**
 * Cliente Supabase para Server Components, Server Actions e Route Handlers.
 * A sessão vive em cookies HttpOnly; o @supabase/ssr cuida da renovação.
 */
export async function criarClienteServidor() {
  const { url, chave } = exigirConfigSupabase();
  const cookieStore = await cookies();
  return createServerClient(url, chave, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(paraDefinir) {
        try {
          for (const { name, value, options } of paraDefinir) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Chamado a partir de um Server Component: não é possível gravar cookies aqui.
          // O proxy (src/proxy.ts) já renovou a sessão, então é seguro ignorar.
        }
      },
    },
  });
}

export interface UsuarioAtual {
  id: string;
  email: string;
  nome: string;
}

/**
 * Usuário logado ou null. Devolve null também quando o Supabase ainda não foi
 * configurado, para o layout não quebrar antes das contas existirem.
 */
export async function usuarioAtual(): Promise<UsuarioAtual | null> {
  if (!configSupabase()) return null;
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const meta = (user.user_metadata ?? {}) as { nome?: string };
  return {
    id: user.id,
    email: user.email ?? "",
    nome: meta.nome?.trim() || user.email?.split("@")[0] || "Usuário",
  };
}
