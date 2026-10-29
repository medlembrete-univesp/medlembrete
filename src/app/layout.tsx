import type { Metadata, Viewport } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { BotaoContraste, CHAVE_TEMA } from "@/components/BotaoContraste";
import { Navegacao } from "@/components/Navegacao";
import { usuarioAtual } from "@/lib/supabase/servidor";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "MedLembrete", template: "%s — MedLembrete" },
  description: "Lembretes de medicamentos acessíveis, com histórico e aderência.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

// Aplica o tema salvo antes da primeira pintura, para não piscar.
const scriptTema = `try{if(localStorage.getItem(${JSON.stringify(CHAVE_TEMA)})==="contraste"){document.documentElement.dataset.tema="contraste"}}catch(e){}`;

export default async function LayoutRaiz({ children }: { children: ReactNode }) {
  const usuario = await usuarioAtual();

  return (
    <html lang="pt-BR">
      <head>
        <script dangerouslySetInnerHTML={{ __html: scriptTema }} />
      </head>
      <body>
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
          MedLembrete — Projeto Integrador II, UNIVESP. Os lembretes funcionam enquanto a
          página estiver aberta.
        </footer>
      </body>
    </html>
  );
}
