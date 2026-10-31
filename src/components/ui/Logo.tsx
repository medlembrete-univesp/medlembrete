import Link from "next/link";

/**
 * Logo: quadrado com "+" e o nome. `contornada` é a versão para fundo escuro (sidebar).
 */
export function Logo({ href, contornada = false }: { href?: string; contornada?: boolean }) {
  const conteudo = (
    <>
      <span className={`logo-marca ${contornada ? "logo-marca-contornada" : ""}`} aria-hidden="true">
        +
      </span>
      <span className="logo-nome">MedLembrete</span>
    </>
  );
  if (href) {
    return (
      <Link href={href} className="logo" aria-label="MedLembrete, página inicial">
        {conteudo}
      </Link>
    );
  }
  return <span className="logo">{conteudo}</span>;
}
