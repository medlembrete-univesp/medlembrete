import { NextResponse, type NextRequest } from "next/server";
import { contextoOuNulo, idDaRota } from "@/lib/dados/contexto";
import { carregarProgramacao, carregarRegistros, idsDeHorarios } from "@/lib/dados/doses";
import { aderencia, agora, somarDias } from "@/lib/servicos";
import { diasValidos } from "@/lib/validacao-dose";

export const dynamic = "force-dynamic";

/**
 * GET /api/aderencia?dias=7|30[&paciente=id] — por paciente e medicamento:
 * programadas, tomadas e percentual (RF10).
 */
export async function GET(request: NextRequest) {
  const ctx = await contextoOuNulo();
  if (!ctx) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const dias = diasValidos(request.nextUrl.searchParams.get("dias"));
  const pacienteId = idDaRota(request.nextUrl.searchParams.get("paciente"));
  const momento = agora();
  const fim = momento.data;
  const inicio = somarDias(fim, -(dias - 1));

  const medicamentos = await carregarProgramacao(ctx, pacienteId);
  const registros = await carregarRegistros(idsDeHorarios(medicamentos), inicio, fim, ctx);
  const itens = aderencia(medicamentos, registros, inicio, fim, momento);

  return NextResponse.json({ inicio, fim, dias, itens }, { headers: { "Cache-Control": "no-store" } });
}
