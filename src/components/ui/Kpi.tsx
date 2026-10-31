/** Cartão de indicador: rótulo em --muted e número em destaque (32px/800). */
export function Kpi({
  rotulo,
  valor,
  tom = "neutro",
}: {
  rotulo: string;
  valor: string | number;
  tom?: "neutro" | "ok" | "danger";
}) {
  return (
    <div className="kpi">
      <p className="kpi-rotulo">{rotulo}</p>
      <p className={`kpi-valor kpi-${tom}`}>{valor}</p>
    </div>
  );
}
