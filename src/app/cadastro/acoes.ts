"use server";

import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import {
  lerCadastro,
  validarCadastro,
  type CampoCadastro,
  type DadosCadastro,
  type Erros,
} from "@/lib/validacao";

export interface EstadoCadastro {
  erros: Erros<CampoCadastro>;
  mensagem?: string;
  valores: Omit<DadosCadastro, "senha" | "confirmacao">;
}

function semSenhas(d: DadosCadastro): EstadoCadastro["valores"] {
  return { nome: d.nome, email: d.email, cep: d.cep, cidade: d.cidade, uf: d.uf };
}

/** RF01 — cria o usuário no Supabase Auth; o trigger do banco cria o perfil. */
export async function cadastrar(_anterior: EstadoCadastro, fd: FormData): Promise<EstadoCadastro> {
  const dados = lerCadastro(fd);
  const erros = validarCadastro(dados);
  if (Object.keys(erros).length > 0) {
    return { erros, valores: semSenhas(dados) };
  }

  const supabase = await criarClienteServidor();
  const { data, error } = await supabase.auth.signUp({
    email: dados.email,
    password: dados.senha,
    options: {
      data: {
        nome: dados.nome,
        cep: dados.cep || null,
        cidade: dados.cidade || null,
        uf: dados.uf || null,
      },
    },
  });

  if (error) {
    const texto = error.message.toLowerCase();
    if (error.code === "user_already_exists" || texto.includes("already")) {
      return { erros: { email: "Já existe uma conta com este e-mail." }, valores: semSenhas(dados) };
    }
    if (error.code === "weak_password" || texto.includes("password")) {
      return { erros: { senha: "Escolha uma senha mais forte." }, valores: semSenhas(dados) };
    }
    return {
      erros: {},
      mensagem: "Não foi possível criar a conta agora. Tente de novo em instantes.",
      valores: semSenhas(dados),
    };
  }

  // Com "Confirm email" desligado no Supabase, signUp já devolve a sessão.
  if (data.session) redirect("/hoje");

  // Com confirmação ligada (ou e-mail já existente e confirmação ligada), não há sessão.
  if (data.user && data.user.identities && data.user.identities.length === 0) {
    return { erros: { email: "Já existe uma conta com este e-mail." }, valores: semSenhas(dados) };
  }
  redirect("/login?cadastro=ok");
}
