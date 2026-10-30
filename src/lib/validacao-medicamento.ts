import { horaValida, type Horario } from "@/lib/servicos";
import { texto, type Erros } from "@/lib/validacao";

export type CampoMedicamento = "nome" | "dose" | "observacao" | "horarios";

/** Um horário como vem do formulário: HH:MM e dígitos 0..6 ordenados, sem repetição. */
export interface HorarioEntrada {
  hora: string;
  dias_semana: string;
}

export interface DadosMedicamento {
  nome: string;
  dose: string;
  observacao: string;
  horarios: HorarioEntrada[];
}

export interface ErrosMedicamento {
  campos: Erros<CampoMedicamento>;
  /** Mensagem por linha de horário (mesmo índice de `horarios`). */
  horarios: (string | undefined)[];
}

export const MAX_HORARIOS = 12;

/** Normaliza dias: só dígitos 0..6, únicos, em ordem. */
export function normalizarDias(valores: string[]): string {
  const conjunto = new Set<string>();
  for (const v of valores) for (const ch of v) if (/[0-6]/.test(ch)) conjunto.add(ch);
  return [...conjunto].sort().join("");
}

/**
 * Campos esperados: nome, dose, observacao, qtd_horarios e, para i em 0..qtd-1,
 * hora_i (texto) e dias_i (vários checkboxes com valores 0..6).
 */
export function lerMedicamento(fd: FormData): DadosMedicamento {
  const qtd = Math.min(Math.max(Number(texto(fd, "qtd_horarios")) || 0, 0), MAX_HORARIOS);
  const horarios: HorarioEntrada[] = [];
  for (let i = 0; i < qtd; i++) {
    const hora = texto(fd, `hora_${i}`);
    const dias = normalizarDias(fd.getAll(`dias_${i}`).filter((v): v is string => typeof v === "string"));
    horarios.push({ hora, dias_semana: dias });
  }
  return {
    nome: texto(fd, "nome"),
    dose: texto(fd, "dose"),
    observacao: texto(fd, "observacao"),
    horarios,
  };
}

export function validarMedicamento(d: DadosMedicamento): ErrosMedicamento {
  const campos: Erros<CampoMedicamento> = {};
  const horarios: (string | undefined)[] = [];

  if (!d.nome) campos.nome = "Informe o nome do medicamento.";
  else if (d.nome.length > 120) campos.nome = "O nome deve ter no máximo 120 caracteres.";

  if (!d.dose) campos.dose = "Informe a dose (ex.: 1 comprimido de 50 mg).";
  else if (d.dose.length > 120) campos.dose = "A dose deve ter no máximo 120 caracteres.";

  if (d.observacao.length > 255) campos.observacao = "A observação deve ter no máximo 255 caracteres.";

  if (d.horarios.length === 0) {
    campos.horarios = "Adicione pelo menos um horário.";
  } else {
    const vistos = new Set<string>();
    d.horarios.forEach((h, i) => {
      if (!h.hora) horarios[i] = "Informe o horário (HH:MM).";
      else if (!horaValida(h.hora)) horarios[i] = "Horário inválido. Use o formato HH:MM.";
      else if (!h.dias_semana) horarios[i] = "Marque pelo menos um dia da semana.";
      else if (vistos.has(h.hora)) horarios[i] = "Este horário já foi informado.";
      vistos.add(h.hora);
    });
    if (horarios.some(Boolean)) campos.horarios = "Corrija os horários indicados.";
  }

  return { campos, horarios };
}

export function temErros(e: ErrosMedicamento): boolean {
  return Object.keys(e.campos).length > 0;
}

/**
 * RF05 — ao editar, horários que mudaram ou saíram são desativados e os novos são
 * criados. Horários iguais (mesma hora e mesmos dias) são mantidos, preservando o
 * histórico de doses ligado a eles.
 */
export function diferencaHorarios(
  atuais: Pick<Horario, "id" | "hora" | "dias_semana" | "ativo">[],
  novos: HorarioEntrada[],
): { manter: number[]; desativar: number[]; criar: HorarioEntrada[] } {
  const chave = (h: HorarioEntrada) => `${h.hora}|${h.dias_semana}`;
  const ativos = atuais.filter((h) => h.ativo);
  const novosPorChave = new Map(novos.map((n) => [chave(n), n]));
  const manter: number[] = [];
  const desativar: number[] = [];
  const mantidas = new Set<string>();

  for (const a of ativos) {
    const k = chave(a);
    if (novosPorChave.has(k) && !mantidas.has(k)) {
      manter.push(a.id);
      mantidas.add(k);
    } else {
      desativar.push(a.id);
    }
  }
  const criar = novos.filter((n) => !mantidas.has(chave(n)));
  return { manter, desativar, criar };
}
