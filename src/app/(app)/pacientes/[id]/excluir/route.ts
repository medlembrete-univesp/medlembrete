import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { idDaRota } from "@/lib/dados/contexto";
import { desativarPaciente } from "@/lib/dados/pacientes";

/** POST /pacientes/[id]/excluir — exclusão lógica; 404 se não for do profissional. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = idDaRota((await params).id);
  if (!id) return NextResponse.json({ erro: "Paciente não encontrado" }, { status: 404 });
  const ok = await desativarPaciente(id);
  if (!ok) return NextResponse.json({ erro: "Paciente não encontrado" }, { status: 404 });
  revalidatePath("/pacientes");
  return NextResponse.redirect(new URL("/pacientes", request.url), { status: 303 });
}
