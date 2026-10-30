"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/hoje", rotulo: "Hoje" },
  { href: "/pacientes", rotulo: "Pacientes" },
  { href: "/historico", rotulo: "Histórico" },
  { href: "/dashboard", rotulo: "Dashboard" },
];

export function Navegacao() {
  const caminho = usePathname();
  return (
    <nav className="navegacao" aria-label="Principal">
      <ul>
        {LINKS.map((l) => {
          const atual = caminho === l.href || caminho.startsWith(`${l.href}/`);
          return (
            <li key={l.href}>
              <Link href={l.href} aria-current={atual ? "page" : undefined}>
                {l.rotulo}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
