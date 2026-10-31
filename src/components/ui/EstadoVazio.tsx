import type { ReactNode } from "react";

/** Cartão de estado vazio: título, texto em --muted e, opcionalmente, uma ação. */
export function EstadoVazio({
  titulo,
  children,
  acao,
}: {
  titulo: string;
  children?: ReactNode;
  acao?: ReactNode;
}) {
  return (
    <div className="cartao estado-vazio" role="status">
      <h2>{titulo}</h2>
      {children && <p className="texto-suave">{children}</p>}
      {acao && <div className="estado-vazio-acao">{acao}</div>}
    </div>
  );
}
