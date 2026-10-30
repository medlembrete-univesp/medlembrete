import { redirect } from "next/navigation";
import { criarClienteServidor, type UsuarioAtual } from "@/lib/supabase/servidor";

export type Supabase = Awaited<ReturnType<typeof criarClienteServidor>>;

export interface Contexto {
  supabase: Supabase;
  usuario: UsuarioAtual;
}

/**
 * Cliente Supabase + usuário logado para a camada de dados. Sem sessão, manda
 * para /login (o proxy já faz isso, mas a camada de dados não confia só nele).
 */
export async function contexto(): Promise<Contexto> {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const meta = (user.user_metadata ?? {}) as { nome?: string };
  return {
    supabase,
    usuario: {
      id: user.id,
      email: user.email ?? "",
      nome: meta.nome?.trim() || user.email?.split("@")[0] || "Usuário",
    },
  };
}

/** Converte o [id] da rota em inteiro positivo, ou null. */
export function idDaRota(texto: string): number | null {
  if (!/^\d{1,15}$/.test(texto)) return null;
  const n = Number(texto);
  return n > 0 ? n : null;
}
