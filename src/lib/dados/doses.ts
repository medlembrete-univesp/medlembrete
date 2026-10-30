import type { Horario, MedicamentoComHorarios, RegistroDose } from "@/lib/servicos";
import { contexto, type Contexto } from "./contexto";

interface LinhaPaciente {
  id: number;
  nome: string;
  ativo: boolean;
  medicamento: {
    id: number;
    nome: string;
    dose: string;
    observacao: string | null;
    ativo: boolean;
    horario: Horario[];
  }[];
}

/**
 * Programação completa do profissional logado: pacientes ativos com todos os seus
 * medicamentos e horários (ativos ou não — o histórico precisa dos desativados).
 * As funções puras de `servicos` decidem o que está ativo em cada data.
 */
export async function carregarProgramacao(
  ctx?: Contexto,
  pacienteId?: number | null,
): Promise<MedicamentoComHorarios[]> {
  const { supabase, usuario } = ctx ?? (await contexto());
  let consulta = supabase
    .from("paciente")
    .select("id, nome, ativo, medicamento(id, nome, dose, observacao, ativo, horario(id, hora, dias_semana, ativo))")
    .eq("usuario_id", usuario.id)
    .eq("ativo", true);
  if (pacienteId) consulta = consulta.eq("id", pacienteId);
  const { data, error } = await consulta;
  if (error) throw new Error(`Erro ao carregar programação: ${error.message}`);

  const saida: MedicamentoComHorarios[] = [];
  for (const p of data as unknown as LinhaPaciente[]) {
    for (const m of p.medicamento ?? []) {
      saida.push({
        id: m.id,
        nome: m.nome,
        dose: m.dose,
        observacao: m.observacao,
        ativo: m.ativo,
        horarios: m.horario ?? [],
        paciente: { id: p.id, nome: p.nome },
      });
    }
  }
  return saida;
}

/** Registros de dose dos horários informados entre `inicio` e `fim` (inclusive). */
export async function carregarRegistros(
  horarioIds: number[],
  inicio: string,
  fim: string,
  ctx?: Contexto,
): Promise<RegistroDose[]> {
  if (horarioIds.length === 0) return [];
  const { supabase } = ctx ?? (await contexto());
  const { data, error } = await supabase
    .from("registro_dose")
    .select("horario_id, data, tomado_em")
    .in("horario_id", horarioIds)
    .gte("data", inicio)
    .lte("data", fim);
  if (error) throw new Error(`Erro ao carregar registros: ${error.message}`);
  return data as RegistroDose[];
}

export function idsDeHorarios(medicamentos: MedicamentoComHorarios[]): number[] {
  return medicamentos.flatMap((m) => m.horarios.map((h) => h.id));
}

/** O horário pertence a um paciente do profissional logado? (RLS também garante.) */
export async function horarioDoUsuario(horarioId: number, ctx: Contexto): Promise<boolean> {
  const { supabase, usuario } = ctx;
  const { data, error } = await supabase
    .from("horario")
    .select("id, medicamento!inner(id, paciente!inner(id, usuario_id))")
    .eq("id", horarioId)
    .eq("medicamento.paciente.usuario_id", usuario.id)
    .maybeSingle();
  if (error) throw new Error(`Erro ao verificar horário: ${error.message}`);
  return data !== null;
}

export type ResultadoRegistro =
  | { ok: true; registro: RegistroDose; repetido: boolean }
  | { ok: false; motivo: "nao_encontrado" };

/**
 * RF07 — grava a dose tomada. Repetir a mesma dose no mesmo dia não duplica: a
 * restrição única do banco responde 23505 e devolvemos o registro já existente.
 */
export async function registrarDose(horarioId: number, data: string, ctx: Contexto): Promise<ResultadoRegistro> {
  if (!(await horarioDoUsuario(horarioId, ctx))) return { ok: false, motivo: "nao_encontrado" };
  const { supabase } = ctx;

  const { data: inserido, error } = await supabase
    .from("registro_dose")
    .insert({ horario_id: horarioId, data })
    .select("horario_id, data, tomado_em")
    .single();

  if (!error) return { ok: true, registro: inserido as RegistroDose, repetido: false };

  if (error.code === "23505") {
    const { data: existente, error: e2 } = await supabase
      .from("registro_dose")
      .select("horario_id, data, tomado_em")
      .eq("horario_id", horarioId)
      .eq("data", data)
      .single();
    if (e2) throw new Error(`Erro ao ler registro existente: ${e2.message}`);
    return { ok: true, registro: existente as RegistroDose, repetido: true };
  }
  if (error.code === "42501") return { ok: false, motivo: "nao_encontrado" };
  throw new Error(`Erro ao registrar dose: ${error.message}`);
}
