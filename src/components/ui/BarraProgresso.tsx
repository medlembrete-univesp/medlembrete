/**
 * Barra de progresso 0–100. Verde a partir de 80%, âmbar abaixo. `invertida` é a
 * versão para cartões de destaque (trilho translúcido, preenchimento claro).
 */
export function BarraProgresso({
  valor,
  rotulo,
  invertida = false,
}: {
  valor: number;
  rotulo: string;
  invertida?: boolean;
}) {
  const v = Math.max(0, Math.min(100, Math.round(valor)));
  return (
    <div
      className={`barra ${invertida ? "barra-invertida" : v >= 80 ? "barra-ok" : "barra-warn"}`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={v}
      aria-label={rotulo}
    >
      <div className="barra-preenchimento" style={{ width: `${v}%` }} />
    </div>
  );
}
