import type { ReactNode } from "react";

/** Cartão padrão (`destaque` = fundo escuro, usado em "Próxima dose" e "Aderência geral"). */
export function Cartao({
  children,
  destaque = false,
  className = "",
  as: Tag = "div",
  ...resto
}: {
  children: ReactNode;
  destaque?: boolean;
  className?: string;
  as?: "div" | "section" | "article" | "li";
} & Record<string, unknown>) {
  return (
    <Tag className={`cartao ${destaque ? "cartao-destaque" : ""} ${className}`.trim()} {...resto}>
      {children}
    </Tag>
  );
}

/** Cabeçalho de cartão: título à esquerda, conteúdo extra à direita. */
export function CartaoCabecalho({ titulo, children, id }: { titulo: string; children?: ReactNode; id?: string }) {
  return (
    <div className="cartao-cabecalho">
      <h2 id={id}>{titulo}</h2>
      {children}
    </div>
  );
}
