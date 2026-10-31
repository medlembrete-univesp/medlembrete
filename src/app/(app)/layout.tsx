import type { ReactNode } from "react";
import { Sidebar } from "@/components/Sidebar";
import { usuarioAtual } from "@/lib/supabase/servidor";

/** Layout da área logada (spec 6.2): sidebar fixa + conteúdo em cartões + rodapé. */
export default async function LayoutApp({ children }: { children: ReactNode }) {
  const usuario = await usuarioAtual();

  return (
    <div className="app">
      <a href="#conteudo" className="pular">
        Pular para o conteúdo
      </a>
      <Sidebar usuario={{ nome: usuario?.nome ?? "Profissional", email: usuario?.email ?? "" }} />
      <div className="app-conteudo">
        <main id="conteudo" tabIndex={-1}>
          {children}
        </main>
        <footer className="rodape">
          MedLembrete — Projeto Integrador II, UNIVESP. Os lembretes funcionam enquanto a página estiver
          aberta.
        </footer>
      </div>
    </div>
  );
}
