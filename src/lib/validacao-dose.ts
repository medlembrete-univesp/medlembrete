import { dataValida, somarDias } from "@/lib/servicos";

export interface CorpoDose {
  horario_id: number;
  /** AAAA-MM-DD */
  data: string;
}

/** Quantos dias para trás ainda se aceita registrar uma dose esquecida. */
export const DIAS_RETROATIVOS = 7;

/**
 * RF07 — valida o corpo de POST /api/doses: `{horario_id, data}`.
 * Devolve o corpo normalizado ou uma mensagem de erro.
 */
export function validarCorpoDose(corpo: unknown, hoje: string): { ok: true; valor: CorpoDose } | { ok: false; erro: string } {
  if (typeof corpo !== "object" || corpo === null) return { ok: false, erro: "Corpo deve ser um objeto JSON." };
  const c = corpo as Record<string, unknown>;

  const horarioBruto = c.horario_id;
  const horario_id =
    typeof horarioBruto === "number" ? horarioBruto : typeof horarioBruto === "string" ? Number(horarioBruto) : NaN;
  if (!Number.isInteger(horario_id) || horario_id <= 0) return { ok: false, erro: "horario_id inválido." };

  const data = typeof c.data === "string" ? c.data : hoje;
  if (!dataValida(data)) return { ok: false, erro: "data deve estar no formato AAAA-MM-DD." };
  if (data > hoje) return { ok: false, erro: "Não é possível registrar uma dose no futuro." };
  if (data < somarDias(hoje, -DIAS_RETROATIVOS)) return { ok: false, erro: `Só é possível registrar doses dos últimos ${DIAS_RETROATIVOS} dias.` };

  return { ok: true, valor: { horario_id, data } };
}

/** Período do histórico/dashboard: valida e aplica padrão de `diasPadrao` até hoje. */
export function periodoValido(
  inicio: string | undefined,
  fim: string | undefined,
  hoje: string,
  diasPadrao = 7,
  maxDias = 90,
): { inicio: string; fim: string; aviso?: string } {
  let f = fim && dataValida(fim) ? fim : hoje;
  if (f > hoje) f = hoje;
  let i = inicio && dataValida(inicio) ? inicio : somarDias(f, -(diasPadrao - 1));
  let aviso: string | undefined;
  if (i > f) {
    aviso = "A data inicial era maior que a final; as datas foram invertidas.";
    [i, f] = [f, i];
    if (f > hoje) f = hoje;
  }
  if (somarDias(i, maxDias) < f) {
    aviso = `O período foi limitado a ${maxDias} dias.`;
    i = somarDias(f, -(maxDias - 1));
  }
  return { inicio: i, fim: f, aviso };
}
