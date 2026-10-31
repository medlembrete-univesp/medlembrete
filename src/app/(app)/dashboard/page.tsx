import type { Metadata } from "next";
import Link from "next/link";
import { FiltroPaciente } from "@/components/FiltroPaciente";
import { GraficoAderencia } from "@/components/GraficoAderencia";
import { BarraProgresso } from "@/components/ui/BarraProgresso";
import { Cartao, CartaoCabecalho } from "@/components/ui/Cartao";
import { EstadoVazio } from "@/components/ui/EstadoVazio";
import { contexto, idDaRota } from "@/lib/dados/contexto";
import { carregarProgramacao, carregarRegistros, idsDeHorarios } from "@/lib/dados/doses";
import { listarPacientes } from "@/lib/dados/pacientes";
import { aderencia, aderenciaPorPaciente, agora, dataBR, somarDias } from "@/lib/servicos";
import { diasValidos } from "@/lib/validacao-dose";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ dias?: string; paciente?: string }>;
}

/** RF10 — Dashboard de aderência (spec 6.6): destaque, por paciente, por medicamento e gráfico. */
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
  const porPaciente = aderenciaPorPaciente(itens).filter((p) => p.programadas > 0);

  const totalProgramadas = itens.reduce((s, a) => s + a.programadas, 0);
  const totalTomadas = itens.reduce((s, a) => s + a.tomadas, 0);
  const geral = totalProgramadas === 0 ? 0 : Math.round((totalTomadas / totalProgramadas) * 100);
  const comDados = itens.filter((a) => a.programadas > 0);
  const comPaciente = !pacienteId && pacientes.length > 1;
  const sufixoPaciente = pacienteId ? `&paciente=${pacienteId}` : "";

  return (
    <>
      <div className="pagina-cabecalho">
        <h1>Dashboard de aderência</h1>
        <div className="segmentado" role="group" aria-label="Período">
          <Link href={`/dashboard?dias=7${sufixoPaciente}`} className="segmentado-opcao" aria-current={dias === 7 ? "true" : undefined}>
            Últimos 7 dias
          </Link>
          <Link href={`/dashboard?dias=30${sufixoPaciente}`} className="segmentado-opcao" aria-current={dias === 30 ? "true" : undefined}>
            Últimos 30 dias
          </Link>
        </div>
      </div>

      <div className="pilha">
        <div className="filtro-linha">
          <p className="texto-suave">
            Período: {dataBR(inicio)} a {dataBR(fim)}. Aderência = doses tomadas ÷ doses programadas até agora.
          </p>
          <FiltroPaciente pacientes={pacientes} selecionado={pacienteId} acao="/dashboard" extras={{ dias: String(dias) }} />
        </div>

        {totalProgramadas === 0 ? (
          <EstadoVazio titulo="Ainda não há dados.">
            As doses passam a contar a partir do primeiro horário programado de cada medicamento.
          </EstadoVazio>
        ) : (
          <>
            <div className="grade grade-3">
              <Cartao destaque as="section" aria-labelledby="titulo-geral">
                <h2 id="titulo-geral" className="cartao-destaque-titulo">
                  Aderência geral
                </h2>
                <p className="aderencia-geral">{geral}%</p>
                <p>
                  {totalTomadas} de {totalProgramadas} doses tomadas
                </p>
                <BarraProgresso valor={geral} rotulo="Aderência geral" invertida />
              </Cartao>

              <Cartao as="section" aria-labelledby="titulo-pacientes">
                <CartaoCabecalho titulo="Por paciente" id="titulo-pacientes" />
                <ul className="lista-aderencia">
                  {porPaciente.map((p) => (
                    <li key={p.paciente_id ?? 0} className="aderencia-item">
                      <div className="aderencia-item-topo">
                        <span className="aderencia-item-nome">{p.paciente}</span>
                        <span className="aderencia-item-valor">
                          {p.percentual}% <span className="texto-suave">({p.tomadas}/{p.programadas})</span>
                        </span>
                      </div>
                      <BarraProgresso valor={p.percentual} rotulo={`Aderência de ${p.paciente}`} />
                    </li>
                  ))}
                </ul>
              </Cartao>

              <Cartao as="section" aria-labelledby="titulo-medicamentos">
                <CartaoCabecalho titulo="Por medicamento" id="titulo-medicamentos" />
                <ul className="lista-aderencia">
                  {itens.map((a) => (
                    <li key={a.medicamento_id} className="aderencia-item">
                      <div className="aderencia-item-topo">
                        <span className="aderencia-item-nome">
                          {a.medicamento}
                          {comPaciente && a.paciente ? <span className="texto-suave"> · {a.paciente}</span> : null}
                        </span>
                        <span className="aderencia-item-valor">
                          {a.programadas === 0 ? (
                            <span className="texto-suave">sem doses</span>
                          ) : (
                            <>
                              {a.percentual}% <span className="texto-suave">({a.tomadas}/{a.programadas})</span>
                            </>
                          )}
                        </span>
                      </div>
                      {a.programadas > 0 && <BarraProgresso valor={a.percentual} rotulo={`Aderência de ${a.medicamento}`} />}
                    </li>
                  ))}
                </ul>
              </Cartao>
            </div>

            <Cartao as="section" aria-labelledby="titulo-grafico">
              <CartaoCabecalho titulo="Gráfico por medicamento" id="titulo-grafico" />
              <GraficoAderencia
                itens={comDados}
                comPaciente={comPaciente}
                descricao={`Gráfico de barras com a aderência de ${comDados.length} ${
                  comDados.length === 1 ? "medicamento" : "medicamentos"
                } nos últimos ${dias} dias. Os mesmos números estão na lista "Por medicamento".`}
              />
            </Cartao>
          </>
        )}
      </div>
    </>
  );
}
