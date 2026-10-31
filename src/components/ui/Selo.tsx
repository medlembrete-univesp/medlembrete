export type TomSelo = "ok" | "danger" | "neutro" | "warn";

/** Badge de status: sempre com texto, nunca só cor (RNF01). */
export function Selo({ tom, children }: { tom: TomSelo; children: React.ReactNode }) {
  return <span className={`selo selo-${tom}`}>{children}</span>;
}
