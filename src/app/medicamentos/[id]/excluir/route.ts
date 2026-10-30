import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { idDaRota } from "@/lib/dados/contexto";
import { desativarMedicamento } from "@/lib/dados/medicamentos";

/** POST /medicamentos/[id]/excluir — exclusão lógica (RF05); 404 se não for do profissional. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = idDaRota((await params).id);
  if (!id) return NextResponse.json({ erro: "Medicamento não encontrado" }, { status: 404 });
  const m = await desativarMedicamento(id);
  if (!m) return NextResponse.json({ erro: "Medicamento não encontrado" }, { status: 404 });
  revalidatePath(`/pacientes/${m.paciente.id}`);
  return NextResponse.redirect(new URL(`/pacientes/${m.paciente.id}`, request.url), { status: 303 });
}
