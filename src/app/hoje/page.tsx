import type { Metadata } from "next";
import { agora, dataBR, NOMES_DIAS_LONGOS } from "@/lib/servicos";
import { usuarioAtual } from "@/lib/supabase/servidor";

export const metadata: Metadata = { title: "Hoje" };
export const dynamic = "force-dynamic";

/** RF06 — Página do dia. A lista de doses entra no bloco 5. */
export default async function PaginaHoje() {
  const usuario = await usuarioAtual();
  const a = agora();

  return (
    <>
      <h1>Hoje</h1>
      <p>
        {NOMES_DIAS_LONGOS[a.diaSemana]}, {dataBR(a.data)}
        {usuario ? ` — olá, ${usuario.nome}.` : "."}
      </p>
      <div className="cartao" role="status">
        <p>
          <strong>Em construção.</strong> As doses do dia, o botão “Tomei ✓” e os lembretes
          entram nos próximos blocos. Por enquanto, confira o login e o cadastro.
        </p>
      </div>
    </>
  );
}
