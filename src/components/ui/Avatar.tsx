/** Iniciais do nome: "Dona Maria" → "DM"; "Ana" → "A". */
export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  const primeira = partes[0][0] ?? "";
  const ultima = partes.length > 1 ? (partes[partes.length - 1][0] ?? "") : "";
  return (primeira + ultima).toUpperCase();
}

/** Círculo com as iniciais. `tamanho` 40 (listas) ou 52 (cartões). Decorativo: o nome vem ao lado. */
export function Avatar({
  nome,
  tamanho = 40,
  claro = false,
}: {
  nome: string;
  tamanho?: 40 | 52;
  claro?: boolean;
}) {
  return (
    <span
      className={`avatar ${claro ? "avatar-claro" : ""}`}
      style={{ width: tamanho, height: tamanho, fontSize: tamanho >= 52 ? "1.1rem" : "0.95rem" }}
      aria-hidden="true"
    >
      {iniciais(nome)}
    </span>
  );
}
