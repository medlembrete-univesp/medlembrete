import Link from "next/link";
import type { ReactNode } from "react";
import { BotaoContraste } from "@/components/BotaoContraste";
import { Navegacao } from "@/components/Navegacao";
import { usuarioAtual } from "@/lib/supabase/servidor";

/**
 * Layout da área logada. Versão provisória com o cabeçalho antigo; a sidebar
 * entra no passo 4 do redesign.
 */
export default async function LayoutApp({ children }: { children: ReactNode }) {
  const usuario = await usuarioAtual();

  return (
    <>
      <a href="#conteudo" className="pular">
        Pular para o conteúdo
      </a>
      <header className="cabecalho">
        <div className="cabecalho-interno">
          <Link href={usuario ? "/hoje" : "/login"} className="marca">
            MedLembrete
          </Link>
          {usuario && <Navegacao />}
          <div className="acoes-cabecalho">
            <BotaoContraste />
            {usuario ? (
              <form action="/logout" method="post">
                <span className="usuario-logado visualmente-oculto">Logado como {usuario.nome}.</span>
                <button type="submit" className="botao botao-secundario">
                  Sair
                </button>
              </form>
            ) : null}
          </div>
        </div>
      </header>
      <main id="conteudo" tabIndex={-1}>
        {children}
      </main>
      <footer className="rodape">
        MedLembrete — Projeto Integrador II, UNIVESP. Os lembretes funcionam enquanto a página estiver
        aberta.
      </footer>
    </>
  );
}
