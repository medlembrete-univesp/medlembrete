"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Pílula no topo do cartão: "Cadastre-se" no login, "Já tenho conta" no cadastro. */
export function AlternarEntrada() {
  const caminho = usePathname();
  const noCadastro = caminho.startsWith("/cadastro");
  return (
    <Link href={noCadastro ? "/login" : "/cadastro"} className="botao botao-secundario botao-pilula">
      {noCadastro ? "Já tenho conta" : "Cadastre-se"}
    </Link>
  );
}
