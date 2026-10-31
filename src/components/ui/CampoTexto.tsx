import { CircleAlert } from "lucide-react";
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

/** Mensagem de erro de campo: ícone + texto, anunciada pelo leitor de tela. */
export function ErroCampo({ id, texto }: { id: string; texto?: string }) {
  if (!texto) return null;
  return (
    <p id={id} className="erro-campo" role="alert">
      <CircleAlert size={18} strokeWidth={2} aria-hidden="true" />
      <span>{texto}</span>
    </p>
  );
}

interface Base {
  id: string;
  rotulo: string;
  erro?: string;
  ajuda?: ReactNode;
  /** Estilo "só linha inferior" da tela de login. */
  linha?: boolean;
  className?: string;
}

function describedBy(id: string, erro?: string, ajuda?: ReactNode, extra?: string) {
  return [erro ? `erro-${id}` : null, ajuda ? `ajuda-${id}` : null, extra ?? null].filter(Boolean).join(" ") || undefined;
}

/** Rótulo + input + ajuda + erro, com aria-describedby e aria-invalid ligados. */
export function CampoTexto({
  id,
  rotulo,
  erro,
  ajuda,
  linha = false,
  className = "",
  "aria-describedby": describedExtra,
  ...input
}: Base & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={`campo ${linha ? "campo-linha" : ""} ${className}`.trim()}>
      <label htmlFor={id}>{rotulo}</label>
      <input
        id={id}
        aria-invalid={erro ? true : undefined}
        aria-describedby={describedBy(id, erro, ajuda, describedExtra)}
        {...input}
      />
      {ajuda && (
        <p id={`ajuda-${id}`} className="ajuda">
          {ajuda}
        </p>
      )}
      <ErroCampo id={`erro-${id}`} texto={erro} />
    </div>
  );
}

export function CampoSelecao({
  id,
  rotulo,
  erro,
  ajuda,
  linha = false,
  className = "",
  children,
  ...select
}: Base & SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  return (
    <div className={`campo ${linha ? "campo-linha" : ""} ${className}`.trim()}>
      <label htmlFor={id}>{rotulo}</label>
      <select id={id} aria-invalid={erro ? true : undefined} aria-describedby={describedBy(id, erro, ajuda)} {...select}>
        {children}
      </select>
      {ajuda && (
        <p id={`ajuda-${id}`} className="ajuda">
          {ajuda}
        </p>
      )}
      <ErroCampo id={`erro-${id}`} texto={erro} />
    </div>
  );
}

export function CampoTextoLongo({
  id,
  rotulo,
  erro,
  ajuda,
  className = "",
  ...textarea
}: Omit<Base, "linha"> & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className={`campo ${className}`.trim()}>
      <label htmlFor={id}>{rotulo}</label>
      <textarea id={id} aria-invalid={erro ? true : undefined} aria-describedby={describedBy(id, erro, ajuda)} {...textarea} />
      {ajuda && (
        <p id={`ajuda-${id}`} className="ajuda">
          {ajuda}
        </p>
      )}
      <ErroCampo id={`erro-${id}`} texto={erro} />
    </div>
  );
}
