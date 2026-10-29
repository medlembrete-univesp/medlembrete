import type { Metadata } from "next";
import { configSupabase } from "@/lib/supabase/config";
import { FormularioLogin } from "./FormularioLogin";

export const metadata: Metadata = { title: "Entrar" };

interface Props {
  searchParams: Promise<{ proximo?: string; cadastro?: string }>;
}

/** RF03 — Login. */
export default async function PaginaLogin({ searchParams }: Props) {
  const { proximo, cadastro } = await searchParams;

  if (!configSupabase()) {
    return (
      <>
        <h1>Entrar</h1>
        <p className="mensagem mensagem-alerta" role="alert">
          O Supabase ainda não foi configurado. Copie <code>.env.example</code> para{" "}
          <code>.env.local</code> e preencha as variáveis (veja <code>docs/DEPLOY.md</code>).
        </p>
      </>
    );
  }

  return (
    <>
      <h1>Entrar</h1>
      <FormularioLogin
        proximo={proximo}
        aviso={cadastro === "ok" ? "Conta criada. Agora entre com seu e-mail e senha." : undefined}
      />
    </>
  );
}
