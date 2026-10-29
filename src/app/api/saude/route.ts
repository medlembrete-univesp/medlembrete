import { NextResponse } from "next/server";
import { agora } from "@/lib/servicos";
import { configSupabase } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

/** GET /api/saude — usado para checar o deploy. Não exige login. */
export function GET() {
  const a = agora();
  return NextResponse.json({
    status: "ok",
    app: "medlembrete",
    agora: `${a.data} ${a.hora}`,
    fuso: "America/Sao_Paulo",
    supabase_configurado: configSupabase() !== null,
  });
}
