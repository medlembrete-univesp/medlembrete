"use server";

import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { lerLogin, validarLogin, type Erros } from "@/lib/validacao";

export interface EstadoLogin {
  erros: Erros<"email" | "senha">;
  /** Mensagem genérica (RF03): nunca dizer se foi o e-mail ou a senha. */
  mensagem?: string;
  valores: { email: string };
}

/** Destino seguro depois do login: só caminhos internos. */
function destinoSeguro(proximo: string | null): string {
  if (proximo && /^\/(?!\/)[\w\-/?=&%.]*$/.test(proximo) && !proximo.startsWith("/login")) {
    return proximo;
  }
  return "/hoje";
}

export async function entrar(_anterior: EstadoLogin, fd: FormData): Promise<EstadoLogin> {
  const dados = lerLogin(fd);
  const erros = validarLogin(dados);
  if (Object.keys(erros).length > 0) {
    return { erros, valores: { email: dados.email } };
  }

  const supabase = await criarClienteServidor();
  const { error } = await supabase.auth.signInWithPassword({
    email: dados.email,
    password: dados.senha,
  });

  if (error) {
    return {
      erros: {},
      mensagem: "E-mail ou senha incorretos.",
      valores: { email: dados.email },
    };
  }

  const proximo = fd.get("proximo");
  redirect(destinoSeguro(typeof proximo === "string" ? proximo : null));
}
