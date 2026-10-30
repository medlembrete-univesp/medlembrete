import type { Horario, MedicamentoComHorarios } from "@/lib/servicos";
import { diferencaHorarios, type DadosMedicamento, type HorarioEntrada } from "@/lib/validacao-medicamento";
import { contexto } from "./contexto";
import { obterPaciente } from "./pacientes";

export interface MedicamentoDetalhe extends MedicamentoComHorarios {
  paciente: { id: number; nome: string };
}

interface LinhaMedicamento {
  id: number;
  nome: string;
  dose: string;
  observacao: string | null;
  ativo: boolean;
  horario: Horario[];
  paciente: { id: number; nome: string; usuario_id: string } | null;
}

const COLUNAS = "id, nome, dose, observacao, ativo, horario(id, hora, dias_semana, ativo)";

function ordenarHorarios(h: Horario[]): Horario[] {
  return [...h].sort((a, b) => a.hora.localeCompare(b.hora));
}

/** Medicamentos ativos de um paciente do profissional logado (só horários ativos). */
export async function listarMedicamentosDoPaciente(pacienteId: number): Promise<MedicamentoComHorarios[] | null> {
  const paciente = await obterPaciente(pacienteId);
  if (!paciente) return null;
  const { supabase } = await contexto();
  const { data, error } = await supabase
    .from("medicamento")
    .select(COLUNAS)
    .eq("paciente_id", pacienteId)
    .eq("ativo", true)
    .eq("horario.ativo", true)
    .order("nome");
  if (error) throw new Error(`Erro ao listar medicamentos: ${error.message}`);
  return (data as unknown as LinhaMedicamento[]).map((m) => ({
    id: m.id,
    nome: m.nome,
    dose: m.dose,
    observacao: m.observacao,
    ativo: m.ativo,
    horarios: ordenarHorarios(m.horario ?? []),
  }));
}

/** Um medicamento ativo (com todos os horários, ativos ou não) do profissional logado, ou null. */
export async function obterMedicamento(id: number): Promise<MedicamentoDetalhe | null> {
  const { supabase, usuario } = await contexto();
  const { data, error } = await supabase
    .from("medicamento")
    .select(`${COLUNAS}, paciente!inner(id, nome, usuario_id)`)
    .eq("id", id)
    .eq("ativo", true)
    .eq("paciente.usuario_id", usuario.id)
    .maybeSingle();
  if (error) throw new Error(`Erro ao buscar medicamento: ${error.message}`);
  const m = data as unknown as LinhaMedicamento | null;
  if (!m || !m.paciente || m.paciente.usuario_id !== usuario.id) return null;
  return {
    id: m.id,
    nome: m.nome,
    dose: m.dose,
    observacao: m.observacao,
    ativo: m.ativo,
    horarios: ordenarHorarios(m.horario ?? []),
    paciente: { id: m.paciente.id, nome: m.paciente.nome },
  };
}

async function inserirHorarios(medicamentoId: number, horarios: HorarioEntrada[]) {
  if (horarios.length === 0) return;
  const { supabase } = await contexto();
  const { error } = await supabase
    .from("horario")
    .insert(horarios.map((h) => ({ medicamento_id: medicamentoId, hora: h.hora, dias_semana: h.dias_semana })));
  if (error) throw new Error(`Erro ao salvar horários: ${error.message}`);
}

/** RF04 — cria o medicamento e seus horários. Devolve null se o paciente não é do profissional. */
export async function criarMedicamento(pacienteId: number, d: DadosMedicamento): Promise<number | null> {
  const paciente = await obterPaciente(pacienteId);
  if (!paciente) return null;
  const { supabase } = await contexto();
  const { data, error } = await supabase
    .from("medicamento")
    .insert({ paciente_id: pacienteId, nome: d.nome, dose: d.dose, observacao: d.observacao || null })
    .select("id")
    .single();
  if (error) throw new Error(`Erro ao criar medicamento: ${error.message}`);
  const id = (data as { id: number }).id;
  await inserirHorarios(id, d.horarios);
  return id;
}

/**
 * RF05 — atualiza nome, dose e observação; horários alterados ou removidos ficam
 * ativo = false e os novos são criados. Devolve false se não é do profissional.
 */
export async function atualizarMedicamento(id: number, d: DadosMedicamento): Promise<boolean> {
  const atual = await obterMedicamento(id);
  if (!atual) return false;
  const { supabase } = await contexto();

  const { error } = await supabase
    .from("medicamento")
    .update({ nome: d.nome, dose: d.dose, observacao: d.observacao || null })
    .eq("id", id);
  if (error) throw new Error(`Erro ao atualizar medicamento: ${error.message}`);

  const { desativar, criar } = diferencaHorarios(atual.horarios, d.horarios);
  if (desativar.length > 0) {
    const { error: e2 } = await supabase.from("horario").update({ ativo: false }).in("id", desativar);
    if (e2) throw new Error(`Erro ao desativar horários: ${e2.message}`);
  }
  await inserirHorarios(id, criar);
  return true;
}

/** Exclusão lógica (RF05): some da lista e do dia; o histórico continua. */
export async function desativarMedicamento(id: number): Promise<MedicamentoDetalhe | null> {
  const atual = await obterMedicamento(id);
  if (!atual) return null;
  const { supabase } = await contexto();
  const { error } = await supabase.from("medicamento").update({ ativo: false }).eq("id", id);
  if (error) throw new Error(`Erro ao excluir medicamento: ${error.message}`);
  return atual;
}
