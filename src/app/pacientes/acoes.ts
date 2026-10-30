"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { EstadoPaciente } from "@/components/FormularioPaciente";
import { atualizarPaciente, criarPaciente } from "@/lib/dados/pacientes";
import { agora } from "@/lib/servicos";
import { lerPaciente, validarPaciente } from "@/lib/validacao-paciente";

export async function acaoCriarPaciente(_anterior: EstadoPaciente, fd: FormData): Promise<EstadoPaciente> {
  const dados = lerPaciente(fd);
  const erros = validarPaciente(dados, agora().data);
  if (Object.keys(erros).length > 0) return { erros, valores: dados };

  let id: number;
  try {
    id = await criarPaciente(dados);
  } catch {
    return { erros: {}, mensagem: "Não foi possível salvar o paciente. Tente de novo.", valores: dados };
  }
  revalidatePath("/pacientes");
  redirect(`/pacientes/${id}`);
}

export async function acaoEditarPaciente(
  id: number,
  _anterior: EstadoPaciente,
  fd: FormData,
): Promise<EstadoPaciente> {
  const dados = lerPaciente(fd);
  const erros = validarPaciente(dados, agora().data);
  if (Object.keys(erros).length > 0) return { erros, valores: dados };

  let ok: boolean;
  try {
    ok = await atualizarPaciente(id, dados);
  } catch {
    return { erros: {}, mensagem: "Não foi possível salvar as alterações. Tente de novo.", valores: dados };
  }
  if (!ok) return { erros: {}, mensagem: "Paciente não encontrado.", valores: dados };
  revalidatePath("/pacientes");
  revalidatePath(`/pacientes/${id}`);
  redirect(`/pacientes/${id}`);
}
