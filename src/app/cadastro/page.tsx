import type { Metadata } from "next";
import { configSupabase } from "@/lib/supabase/config";
import { FormularioCadastro } from "./FormularioCadastro";

export const metadata: Metadata = { title: "Criar conta" };

/** RF01 + RF02 — Cadastro de usuário com CEP via ViaCEP. */
export default function PaginaCadastro() {
  if (!configSupabase()) {
    return (
      <>
        <h1>Criar conta</h1>
        <p className="mensagem mensagem-alerta" role="alert">
          O Supabase ainda não foi configurado. Copie <code>.env.example</code> para{" "}
          <code>.env.local</code> e preencha as variáveis (veja <code>docs/DEPLOY.md</code>).
        </p>
      </>
    );
  }

  return (
    <>
      <h1>Criar conta</h1>
      <FormularioCadastro />
    </>
  );
}
