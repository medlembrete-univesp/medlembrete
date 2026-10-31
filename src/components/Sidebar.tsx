"use client";

import { Calendar, ChartNoAxesColumn, Clock, LogOut, Menu, Users, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { BotaoContraste } from "./BotaoContraste";
import { Avatar } from "./ui/Avatar";
import { Logo } from "./ui/Logo";

const LINKS = [
  { href: "/hoje", rotulo: "Hoje", Icone: Clock },
  { href: "/pacientes", rotulo: "Pacientes", Icone: Users },
  { href: "/historico", rotulo: "Histórico", Icone: Calendar },
  { href: "/dashboard", rotulo: "Dashboard", Icone: ChartNoAxesColumn },
];

/**
 * Menu lateral da área logada (spec 6.2). Em telas estreitas vira uma barra
 * superior com botão de menu que abre a mesma navegação.
 */
export function Sidebar({ usuario }: { usuario: { nome: string; email: string } }) {
  const caminho = usePathname();
  const [aberto, setAberto] = useState(false);
  const idPainel = useId();

  // Fecha o menu do celular ao navegar.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAberto(false);
  }, [caminho]);

  const navegacao = (
    <nav className="sidebar-nav" aria-label="Principal">
      <ul>
        {LINKS.map(({ href, rotulo, Icone }) => {
          const atual = caminho === href || caminho.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link href={href} className="nav-item" aria-current={atual ? "page" : undefined}>
                <Icone size={20} strokeWidth={2} aria-hidden="true" />
                <span>{rotulo}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );

  const base = (
    <div className="sidebar-base">
      <BotaoContraste className="botao botao-sidebar" />
      <form action="/logout" method="post">
        <button type="submit" className="botao botao-sidebar">
          <LogOut size={20} strokeWidth={2} aria-hidden="true" />
          <span>Sair</span>
        </button>
      </form>
      <hr className="sidebar-divisor" />
      <div className="sidebar-usuario">
        <Avatar nome={usuario.nome} claro />
        <div className="sidebar-usuario-texto">
          <span className="sidebar-usuario-nome">{usuario.nome}</span>
          <span className="sidebar-usuario-email">{usuario.email}</span>
        </div>
      </div>
    </div>
  );

  return (
    <aside className={`sidebar ${aberto ? "sidebar-aberta" : ""}`}>
      <div className="sidebar-topo">
        <Logo href="/hoje" contornada />
        <button
          type="button"
          className="botao botao-sidebar sidebar-menu-botao"
          aria-expanded={aberto}
          aria-controls={idPainel}
          onClick={() => setAberto((v) => !v)}
        >
          {aberto ? <X size={22} strokeWidth={2} aria-hidden="true" /> : <Menu size={22} strokeWidth={2} aria-hidden="true" />}
          <span>{aberto ? "Fechar" : "Menu"}</span>
        </button>
      </div>
      <div id={idPainel} className="sidebar-painel">
        {navegacao}
        {base}
      </div>
    </aside>
  );
}
