import { NextResponse, type NextRequest } from "next/server";
import { contextoOuNulo } from "@/lib/dados/contexto";
import { registrarDose } from "@/lib/dados/doses";
import { agora } from "@/lib/servicos";
import { validarCorpoDose } from "@/lib/validacao-dose";

export const dynamic = "force-dynamic";

/** Só aceita chamadas da própria origem (proteção contra requisições de outros sites). */
function mesmaOrigem(request: NextRequest): boolean {
  const origem = request.headers.get("origin");
  if (!origem) return request.headers.get("sec-fetch-site") !== "cross-site";
  try {
    return new URL(origem).host === request.nextUrl.host;
  } catch {
    return false;
  }
}

/**
 * POST /api/doses — registra a dose tomada (RF07). Corpo: {horario_id, data}.
 * Repetir não duplica (restrição única no banco). 404 para horário de outro profissional.
 */
export async function POST(request: NextRequest) {
  const ctx = await contextoOuNulo();
  if (!ctx) return NextResponse.json({ erro: "Não autenticado" }, { status: 401 });
  if (!mesmaOrigem(request)) return NextResponse.json({ erro: "Origem não permitida" }, { status: 403 });

  let corpo: unknown;
  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json({ erro: "Corpo deve ser JSON." }, { status: 400 });
  }

  const momento = agora();
  const validado = validarCorpoDose(corpo, momento.data);
  if (!validado.ok) return NextResponse.json({ erro: validado.erro }, { status: 400 });

  const resultado = await registrarDose(validado.valor.horario_id, validado.valor.data, ctx);
  if (!resultado.ok) return NextResponse.json({ erro: "Horário não encontrado." }, { status: 404 });

  return NextResponse.json(
    { ...resultado.registro, status: "tomada", repetido: resultado.repetido },
    { status: resultado.repetido ? 200 : 201 },
  );
}
