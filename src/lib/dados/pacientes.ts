import type { DadosPaciente } from "@/lib/validacao-paciente";
import { contexto } from "./contexto";

export interface Paciente {
  id: number;
  nome: string;
  data_nascimento: string | null;
  observacao: string | null;
  criado_em: string;
}

const COLUNAS = "id, nome, data_nascimento, observacao, criado_em";

function paraBanco(d: DadosPaciente) {
  return {
    nome: d.nome,
    data_nascimento: d.data_nascimento || null,
    observacao: d.observacao || null,
  };
}

/** Pacientes ativos do profissional logado, em ordem alfabética. */
export async function listarPacientes(): Promise<Paciente[]> {
  const { supabase, usuario } = await contexto();
  const { data, error } = await supabase
    .from("paciente")
    .select(COLUNAS)
    .eq("usuario_id", usuario.id)
    .eq("ativo", true)
    .order("nome");
  if (error) throw new Error(`Erro ao listar pacientes: ${error.message}`);
  return data as Paciente[];
}

/** Paciente ativo do profissional logado, ou null (vira 404 na página). */
export async function obterPaciente(id: number): Promise<Paciente | null> {
  const { supabase, usuario } = await contexto();
  const { data, error } = await supabase
    .from("paciente")
    .select(COLUNAS)
    .eq("id", id)
    .eq("usuario_id", usuario.id)
    .eq("ativo", true)
    .maybeSingle();
  if (error) throw new Error(`Erro ao buscar paciente: ${error.message}`);
  return (data as Paciente | null) ?? null;
}

export async function criarPaciente(d: DadosPaciente): Promise<number> {
  const { supabase, usuario } = await contexto();
  const { data, error } = await supabase
    .from("paciente")
    .insert({ usuario_id: usuario.id, ...paraBanco(d) })
    .select("id")
    .single();
  if (error) throw new Error(`Erro ao criar paciente: ${error.message}`);
  return (data as { id: number }).id;
}

/** Devolve false se o paciente não existe ou não é do profissional logado. */
export async function atualizarPaciente(id: number, d: DadosPaciente): Promise<boolean> {
  const { supabase, usuario } = await contexto();
  const { data, error } = await supabase
    .from("paciente")
    .update(paraBanco(d))
    .eq("id", id)
    .eq("usuario_id", usuario.id)
    .eq("ativo", true)
    .select("id");
  if (error) throw new Error(`Erro ao atualizar paciente: ${error.message}`);
  return (data?.length ?? 0) > 0;
}

/** Exclusão lógica: o paciente some das listas, mas medicamentos e histórico ficam. */
export async function desativarPaciente(id: number): Promise<boolean> {
  const { supabase, usuario } = await contexto();
  const { data, error } = await supabase
    .from("paciente")
    .update({ ativo: false })
    .eq("id", id)
    .eq("usuario_id", usuario.id)
    .eq("ativo", true)
    .select("id");
  if (error) throw new Error(`Erro ao excluir paciente: ${error.message}`);
  return (data?.length ?? 0) > 0;
}
