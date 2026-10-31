import Image from "next/image";
import type { ReactNode } from "react";
import { BotaoContraste } from "@/components/BotaoContraste";
import { Logo } from "@/components/ui/Logo";
import { AlternarEntrada } from "./AlternarEntrada";

/** Layout das páginas públicas (login e cadastro): cartão dividido sobre fundo verde-água. */
export default function LayoutPublico({ children }: { children: ReactNode }) {
  return (
    <div className="publico">
      <a href="#conteudo" className="pular">
        Pular para o conteúdo
      </a>
      <div className="publico-topo">
        <BotaoContraste className="botao botao-pilula botao-claro" />
      </div>
      <div className="cartao-login">
        <aside className="cartao-login-esq">
          <Logo />
          <Image
            src="/ilustracao-login.svg"
            alt=""
            width={420}
            height={300}
            priority
            className="cartao-login-ilustracao"
          />
          <p className="cartao-login-frase">
            Lembretes de medicamentos para quem cuida de alguém. Registre cada dose e acompanhe a aderência.
          </p>
        </aside>
        <section className="cartao-login-dir">
          <div className="cartao-login-acao">
            <AlternarEntrada />
          </div>
          <main id="conteudo" tabIndex={-1} className="cartao-login-form">
            {children}
          </main>
          <p className="cartao-login-rodape">MedLembrete — Projeto Integrador II, UNIVESP.</p>
        </section>
      </div>
    </div>
  );
}
