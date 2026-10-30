import { minutosDe, type DoseDoDia } from "@/lib/servicos";

/** Chave única de uma dose num dia, usada para disparar o lembrete uma vez só (RF08). */
export function chaveDose(data: string, horarioId: number): string {
  return `${data}|${horarioId}`;
}

/**
 * RF08 — quais doses devem disparar lembrete agora: ainda não tomadas, com horário
 * já chegado (hora <= horaAtual) e que não foram alertadas antes neste dia.
 */
export function dosesParaAlertar(
  doses: DoseDoDia[],
  data: string,
  horaAtual: string,
  jaAlertadas: ReadonlySet<string>,
): DoseDoDia[] {
  const agoraMin = minutosDe(horaAtual);
  return doses.filter(
    (d) => d.status !== "tomada" && minutosDe(d.hora) <= agoraMin && !jaAlertadas.has(chaveDose(data, d.horario_id)),
  );
}

/** Texto curto para a notificação do sistema e para a região aria-live. */
export function resumoLembrete(doses: DoseDoDia[]): string {
  if (doses.length === 0) return "";
  if (doses.length === 1) {
    const d = doses[0];
    return `${d.hora}: ${d.paciente ? `${d.paciente} — ` : ""}${d.medicamento}, ${d.dose}.`;
  }
  return `${doses.length} doses na hora: ${doses
    .map((d) => `${d.paciente ? `${d.paciente} — ` : ""}${d.medicamento}`)
    .join("; ")}.`;
}

export const CHAVE_LEMBRETES = "medlembrete-lembretes";
export const CHAVE_ALERTADAS = "medlembrete-alertadas";

/** Lê do sessionStorage as doses já alertadas hoje (descarta as de outros dias). */
export function lerAlertadas(armazem: Pick<Storage, "getItem">, data: string): Set<string> {
  try {
    const bruto = armazem.getItem(CHAVE_ALERTADAS);
    if (!bruto) return new Set();
    const lista = JSON.parse(bruto) as unknown;
    if (!Array.isArray(lista)) return new Set();
    return new Set(lista.filter((c): c is string => typeof c === "string" && c.startsWith(`${data}|`)));
  } catch {
    return new Set();
  }
}

export function gravarAlertadas(armazem: Pick<Storage, "setItem">, alertadas: ReadonlySet<string>): void {
  try {
    armazem.setItem(CHAVE_ALERTADAS, JSON.stringify([...alertadas]));
  } catch {
    // sem armazenamento disponível: o lembrete pode repetir após recarregar, nada grave
  }
}
