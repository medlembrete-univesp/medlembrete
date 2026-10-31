import { type Agora, intervaloDeDatas, diaSemanaDe, minutosDe } from "./agora";
import type {
  Aderencia,
  DoseDoDia,
  LinhaHistorico,
  MedicamentoComHorarios,
  RegistroDose,
} from "./tipos";

/** Minutos após o horário previsto a partir dos quais a dose fica "atrasada" (RF06). */
export const ATRASO_MINUTOS = 60;

type Momento = Pick<Agora, "data" | "hora">;

function chaveRegistro(horarioId: number, data: string): string {
  return `${horarioId}|${data}`;
}

function indexarRegistros(registros: RegistroDose[]): Map<string, RegistroDose> {
  const mapa = new Map<string, RegistroDose>();
  for (const r of registros) mapa.set(chaveRegistro(r.horario_id, r.data), r);
  return mapa;
}

/** Já passou mais de ATRASO_MINUTOS do horário previsto, considerando a data? */
function atrasada(data: string, hora: string, momento: Momento): boolean {
  if (data < momento.data) return true;
  if (data > momento.data) return false;
  return minutosDe(momento.hora) - minutosDe(hora) > ATRASO_MINUTOS;
}

/** O horário previsto já chegou (é hoje e a hora passou, ou é um dia anterior)? */
function jaPassou(data: string, hora: string, momento: Momento): boolean {
  if (data < momento.data) return true;
  if (data > momento.data) return false;
  return minutosDe(hora) <= minutosDe(momento.hora);
}

function nomePaciente(m: MedicamentoComHorarios): string {
  return m.paciente?.nome ?? "";
}

interface DoseProgramada {
  data: string;
  medicamento: MedicamentoComHorarios;
  horario: MedicamentoComHorarios["horarios"][number];
}

/**
 * Enumera as doses programadas (medicamento ativo + horário ativo + dia da semana
 * marcado + data a partir da criação) para cada data do intervalo, em ordem de data,
 * hora, paciente e medicamento.
 */
export function dosesProgramadas(
  medicamentos: MedicamentoComHorarios[],
  inicio: string,
  fim: string,
): DoseProgramada[] {
  const saida: DoseProgramada[] = [];
  for (const data of intervaloDeDatas(inicio, fim)) {
    const dia = String(diaSemanaDe(data));
    const doDia: DoseProgramada[] = [];
    for (const medicamento of medicamentos) {
      if (!medicamento.ativo) continue;
      if (medicamento.inicio && data < medicamento.inicio) continue;
      for (const horario of medicamento.horarios) {
        if (!horario.ativo) continue;
        if (horario.inicio && data < horario.inicio) continue;
        if (!horario.dias_semana.includes(dia)) continue;
        doDia.push({ data, medicamento, horario });
      }
    }
    doDia.sort(
      (a, b) =>
        a.horario.hora.localeCompare(b.horario.hora) ||
        nomePaciente(a.medicamento).localeCompare(nomePaciente(b.medicamento), "pt-BR") ||
        a.medicamento.nome.localeCompare(b.medicamento.nome, "pt-BR"),
    );
    saida.push(...doDia);
  }
  return saida;
}

/**
 * RF06 — Doses de um dia com status pendente / tomada / atrasada.
 * `momento` normalmente é `agora()`; os testes passam um valor fixo.
 */
export function dosesDoDia(
  medicamentos: MedicamentoComHorarios[],
  registros: RegistroDose[],
  momento: Momento,
): DoseDoDia[] {
  const indice = indexarRegistros(registros);
  return dosesProgramadas(medicamentos, momento.data, momento.data).map(
    ({ data, medicamento, horario }) => {
      const registro = indice.get(chaveRegistro(horario.id, data));
      let status: DoseDoDia["status"] = "pendente";
      if (registro) status = "tomada";
      else if (atrasada(data, horario.hora, momento)) status = "atrasada";
      return {
        horario_id: horario.id,
        hora: horario.hora,
        paciente_id: medicamento.paciente?.id ?? null,
        paciente: medicamento.paciente?.nome ?? null,
        medicamento_id: medicamento.id,
        medicamento: medicamento.nome,
        dose: medicamento.dose,
        observacao: medicamento.observacao ?? null,
        status,
        tomado_em: registro?.tomado_em ?? null,
      };
    },
  );
}

/**
 * RF09 — Linhas do histórico entre `inicio` e `fim` (inclusive), limitado ao momento atual.
 * Doses programadas sem registro aparecem como "nao_tomada" (ou "pendente" se ainda
 * estão dentro da janela de atraso de hoje). Registros de horários ou medicamentos já
 * desativados continuam aparecendo como "tomada": o histórico nunca se perde.
 * Ordem: data mais recente primeiro; dentro do dia, hora crescente.
 */
export function historico(
  medicamentos: MedicamentoComHorarios[],
  registros: RegistroDose[],
  inicio: string,
  fim: string,
  momento: Momento,
): LinhaHistorico[] {
  const fimEfetivo = fim < momento.data ? fim : momento.data;
  if (inicio > fimEfetivo) return [];

  const indice = indexarRegistros(registros);
  const vistas = new Set<string>();
  const linhas: LinhaHistorico[] = [];

  for (const { data, medicamento, horario } of dosesProgramadas(medicamentos, inicio, fimEfetivo)) {
    if (!jaPassou(data, horario.hora, momento)) continue;
    const chave = chaveRegistro(horario.id, data);
    vistas.add(chave);
    const registro = indice.get(chave);
    let status: LinhaHistorico["status"] = "pendente";
    if (registro) status = "tomada";
    else if (atrasada(data, horario.hora, momento)) status = "nao_tomada";
    linhas.push({
      data,
      hora: horario.hora,
      horario_id: horario.id,
      paciente_id: medicamento.paciente?.id ?? null,
      paciente: medicamento.paciente?.nome ?? null,
      medicamento_id: medicamento.id,
      medicamento: medicamento.nome,
      dose: medicamento.dose,
      status,
      tomado_em: registro?.tomado_em ?? null,
    });
  }

  // Registros fora da programação atual (horário/medicamento desativado depois).
  const porHorario = new Map<number, { medicamento: MedicamentoComHorarios; hora: string }>();
  for (const m of medicamentos) for (const h of m.horarios) porHorario.set(h.id, { medicamento: m, hora: h.hora });

  for (const r of registros) {
    if (r.data < inicio || r.data > fimEfetivo) continue;
    const chave = chaveRegistro(r.horario_id, r.data);
    if (vistas.has(chave)) continue;
    const info = porHorario.get(r.horario_id);
    if (!info) continue;
    linhas.push({
      data: r.data,
      hora: info.hora,
      horario_id: r.horario_id,
      paciente_id: info.medicamento.paciente?.id ?? null,
      paciente: info.medicamento.paciente?.nome ?? null,
      medicamento_id: info.medicamento.id,
      medicamento: info.medicamento.nome,
      dose: info.medicamento.dose,
      status: "tomada",
      tomado_em: r.tomado_em,
    });
  }

  linhas.sort(
    (a, b) =>
      b.data.localeCompare(a.data) ||
      a.hora.localeCompare(b.hora) ||
      (a.paciente ?? "").localeCompare(b.paciente ?? "", "pt-BR") ||
      a.medicamento.localeCompare(b.medicamento, "pt-BR"),
  );
  return linhas;
}

/**
 * RF10 — Aderência por medicamento: tomadas ÷ programadas até o momento, em %.
 * Só conta doses cujo horário já chegou. Sem doses programadas, percentual = 0
 * (nunca divide por zero). Medicamentos ativos sem dose no período aparecem com 0/0.
 */
export function aderencia(
  medicamentos: MedicamentoComHorarios[],
  registros: RegistroDose[],
  inicio: string,
  fim: string,
  momento: Momento,
): Aderencia[] {
  const indice = indexarRegistros(registros);
  const porMedicamento = new Map<number, Aderencia>();
  for (const m of medicamentos) {
    if (!m.ativo) continue;
    porMedicamento.set(m.id, {
      paciente_id: m.paciente?.id ?? null,
      paciente: m.paciente?.nome ?? null,
      medicamento_id: m.id,
      medicamento: m.nome,
      programadas: 0,
      tomadas: 0,
      percentual: 0,
    });
  }

  const fimEfetivo = fim < momento.data ? fim : momento.data;
  if (inicio <= fimEfetivo) {
    for (const { data, medicamento, horario } of dosesProgramadas(medicamentos, inicio, fimEfetivo)) {
      if (!jaPassou(data, horario.hora, momento)) continue;
      const acc = porMedicamento.get(medicamento.id);
      if (!acc) continue;
      acc.programadas += 1;
      if (indice.has(chaveRegistro(horario.id, data))) acc.tomadas += 1;
    }
  }

  const saida = [...porMedicamento.values()];
  for (const a of saida) {
    a.percentual = a.programadas === 0 ? 0 : Math.round((a.tomadas / a.programadas) * 100);
  }
  saida.sort(
    (a, b) =>
      (a.paciente ?? "").localeCompare(b.paciente ?? "", "pt-BR") ||
      a.medicamento.localeCompare(b.medicamento, "pt-BR"),
  );
  return saida;
}

export interface AderenciaPaciente {
  paciente_id: number | null;
  paciente: string | null;
  programadas: number;
  tomadas: number;
  percentual: number;
  medicamentos: number;
}

/** Agrupa a aderência por paciente (soma de programadas e tomadas dos medicamentos). */
export function aderenciaPorPaciente(itens: Aderencia[]): AderenciaPaciente[] {
  const mapa = new Map<number | null, AderenciaPaciente>();
  for (const a of itens) {
    const acc = mapa.get(a.paciente_id) ?? {
      paciente_id: a.paciente_id,
      paciente: a.paciente,
      programadas: 0,
      tomadas: 0,
      percentual: 0,
      medicamentos: 0,
    };
    acc.programadas += a.programadas;
    acc.tomadas += a.tomadas;
    acc.medicamentos += 1;
    mapa.set(a.paciente_id, acc);
  }
  const saida = [...mapa.values()];
  for (const p of saida) p.percentual = p.programadas === 0 ? 0 : Math.round((p.tomadas / p.programadas) * 100);
  saida.sort((a, b) => (a.paciente ?? "").localeCompare(b.paciente ?? "", "pt-BR"));
  return saida;
}
