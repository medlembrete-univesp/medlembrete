import { redirect } from "next/navigation";
import { criarClienteServidor, type UsuarioAtual } from "@/lib/supabase/servidor";

export type Supabase = Awaited<ReturnType<typeof criarClienteServidor>>;

export interface Contexto {
  supabase: Supabase;
  usuario: UsuarioAtual;
}

/** Cliente Supabase + usuário logado, ou null sem sessão. Base das duas variantes abaixo. */
export async function contextoOuNulo(): Promise<Contexto | null> {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
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

/**
 * Para páginas e Server Actions: sem sessão, manda para /login (o proxy já faz
 * isso, mas a camada de dados não confia só nele).
 */
export async function contexto(): Promise<Contexto> {
  const ctx = await contextoOuNulo();
  if (!ctx) redirect("/login");
  return ctx;
}

/** Converte o [id] da rota (ou um parâmetro de consulta) em inteiro positivo, ou null. */
export function idDaRota(texto: string | undefined | null): number | null {
  if (!texto || !/^\d{1,15}$/.test(texto)) return null;
  const n = Number(texto);
  return n > 0 ? n : null;
}
