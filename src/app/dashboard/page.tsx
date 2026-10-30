import type { Metadata } from "next";
import Link from "next/link";
import { FiltroPaciente } from "@/components/FiltroPaciente";
import { GraficoAderencia } from "@/components/GraficoAderencia";
import { contexto, idDaRota } from "@/lib/dados/contexto";
import { carregarProgramacao, carregarRegistros, idsDeHorarios } from "@/lib/dados/doses";
import { listarPacientes } from "@/lib/dados/pacientes";
import { aderencia, agora, dataBR, somarDias } from "@/lib/servicos";
import { diasValidos } from "@/lib/validacao-dose";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ dias?: string; paciente?: string }>;
}

/** RF10 — Dashboard de aderência por paciente e medicamento, nos últimos 7 ou 30 dias. */
export default async function PaginaDashboard({ searchParams }: Props) {
  const ctx = await contexto();
  const sp = await searchParams;
  const dias = diasValidos(sp.dias);
  const pacienteId = idDaRota(sp.paciente);
  const momento = agora();
  const fim = momento.data;
  const inicio = somarDias(fim, -(dias - 1));

  const [pacientes, medicamentos] = await Promise.all([listarPacientes(), carregarProgramacao(ctx, pacienteId)]);
  const registros = await carregarRegistros(idsDeHorarios(medicamentos), inicio, fim, ctx);
  const itens = aderencia(medicamentos, registros, inicio, fim, momento);

  const totalProgramadas = itens.reduce((s, a) => s + a.programadas, 0);
  const totalTomadas = itens.reduce((s, a) => s + a.tomadas, 0);
  const geral = totalProgramadas === 0 ? 0 : Math.round((totalTomadas / totalProgramadas) * 100);
  const comDados = itens.filter((a) => a.programadas > 0);
  const comPaciente = !pacienteId && pacientes.length > 1;
  const sufixoPaciente = pacienteId ? `&paciente=${pacienteId}` : "";

  return (
    <>
      <h1>Dashboard de aderência</h1>

      <div className="filtro" role="group" aria-label="Período">
        <Link
          href={`/dashboard?dias=7${sufixoPaciente}`}
          className={`botao ${dias === 7 ? "" : "botao-secundario"}`}
          aria-current={dias === 7 ? "true" : undefined}
        >
          Últimos 7 dias
        </Link>
        <Link
          href={`/dashboard?dias=30${sufixoPaciente}`}
          className={`botao ${dias === 30 ? "" : "botao-secundario"}`}
          aria-current={dias === 30 ? "true" : undefined}
        >
          Últimos 30 dias
        </Link>
      </div>
      <FiltroPaciente pacientes={pacientes} selecionado={pacienteId} acao="/dashboard" extras={{ dias: String(dias) }} />

      <p className="texto-suave">
        Período: {dataBR(inicio)} a {dataBR(fim)}. Aderência = doses tomadas ÷ doses programadas até agora.
      </p>

      {totalProgramadas === 0 ? (
        <div className="cartao" role="status">
          <p>
            <strong>Ainda não há dados.</strong> As doses passam a contar a partir do primeiro horário
            programado de cada medicamento.
          </p>
        </div>
      ) : (
        <>
          <div className="destaque" aria-label="Aderência geral">
            <p className="destaque-numero">{geral}%</p>
            <p className="destaque-legenda">
              aderência geral — {totalTomadas} de {totalProgramadas} doses tomadas
            </p>
          </div>

          <h2>Por medicamento</h2>
          <GraficoAderencia
            itens={comDados}
            comPaciente={comPaciente}
            descricao={`Gráfico de barras com a aderência de ${comDados.length} ${
              comDados.length === 1 ? "medicamento" : "medicamentos"
            } nos últimos ${dias} dias. Os mesmos números estão na tabela a seguir.`}
          />

          <div className="tabela-rolavel">
            <table>
              <caption className="visualmente-oculto">
                Aderência por medicamento de {dataBR(inicio)} a {dataBR(fim)}
              </caption>
              <thead>
                <tr>
                  {comPaciente && <th scope="col">Paciente</th>}
                  <th scope="col">Medicamento</th>
                  <th scope="col">Programadas</th>
                  <th scope="col">Tomadas</th>
                  <th scope="col">Aderência</th>
                </tr>
              </thead>
              <tbody>
                {itens.map((a) => (
                  <tr key={a.medicamento_id}>
                    {comPaciente && <td>{a.paciente ?? "—"}</td>}
                    <td>{a.medicamento}</td>
                    <td>{a.programadas}</td>
                    <td>{a.tomadas}</td>
                    <td>{a.programadas === 0 ? "sem doses no período" : `${a.percentual}%`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
