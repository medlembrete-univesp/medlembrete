import { NextResponse, type NextRequest } from "next/server";
import { contextoOuNulo, idDaRota } from "@/lib/dados/contexto";
import { carregarProgramacao, carregarRegistros, idsDeHorarios } from "@/lib/dados/doses";
import { agora, dosesDoDia } from "@/lib/servicos";

export const dynamic = "force-dynamic";

/**
 * GET /api/doses/hoje[?paciente=id] — doses de hoje com status (RF06, RF08).
 * Usado pela página do dia para atualizar os status e pelos lembretes.
 */
export async function GET(request: NextRequest) {
  const ctx = await contextoOuNulo();
  if (!ctx) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });

  const pacienteId = idDaRota(request.nextUrl.searchParams.get("paciente"));
  const momento = agora();
  const medicamentos = await carregarProgramacao(ctx, pacienteId);
  const registros = await carregarRegistros(idsDeHorarios(medicamentos), momento.data, momento.data, ctx);
  const doses = dosesDoDia(medicamentos, registros, momento);

  return NextResponse.json(
    { data: momento.data, hora: momento.hora, doses },
    { headers: { "Cache-Control": "no-store" } },
  );
}
