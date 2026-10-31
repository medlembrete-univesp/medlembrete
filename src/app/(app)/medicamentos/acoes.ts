"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { EstadoMedicamento } from "@/components/FormularioMedicamento";
import { atualizarMedicamento, criarMedicamento } from "@/lib/dados/medicamentos";
import { lerMedicamento, temErros, validarMedicamento } from "@/lib/validacao-medicamento";

export async function acaoCriarMedicamento(
  pacienteId: number,
  _anterior: EstadoMedicamento,
  fd: FormData,
): Promise<EstadoMedicamento> {
  const dados = lerMedicamento(fd);
  const e = validarMedicamento(dados);
  if (temErros(e)) return { erros: e.campos, errosHorarios: e.horarios, valores: dados };

  let id: number | null;
  try {
    id = await criarMedicamento(pacienteId, dados);
  } catch {
    return { erros: {}, errosHorarios: [], mensagem: "Não foi possível salvar o medicamento. Tente de novo.", valores: dados };
  }
  if (id === null) return { erros: {}, errosHorarios: [], mensagem: "Paciente não encontrado.", valores: dados };
  revalidatePath(`/pacientes/${pacienteId}`);
  redirect(`/pacientes/${pacienteId}`);
}

export async function acaoEditarMedicamento(
  id: number,
  pacienteId: number,
  _anterior: EstadoMedicamento,
  fd: FormData,
): Promise<EstadoMedicamento> {
  const dados = lerMedicamento(fd);
  const e = validarMedicamento(dados);
  if (temErros(e)) return { erros: e.campos, errosHorarios: e.horarios, valores: dados };

  let ok: boolean;
  try {
    ok = await atualizarMedicamento(id, dados);
  } catch {
    return { erros: {}, errosHorarios: [], mensagem: "Não foi possível salvar as alterações. Tente de novo.", valores: dados };
  }
  if (!ok) return { erros: {}, errosHorarios: [], mensagem: "Medicamento não encontrado.", valores: dados };
  revalidatePath(`/pacientes/${pacienteId}`);
  redirect(`/pacientes/${pacienteId}`);
}
