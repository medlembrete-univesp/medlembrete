import type { Metadata } from "next";
import Link from "next/link";
import { DosesDoDia } from "@/components/DosesDoDia";
import { FiltroPaciente } from "@/components/FiltroPaciente";
import { Avatar } from "@/components/ui/Avatar";
import { BarraProgresso } from "@/components/ui/BarraProgresso";
import { Cartao, CartaoCabecalho } from "@/components/ui/Cartao";
import { EstadoVazio } from "@/components/ui/EstadoVazio";
import { Kpi } from "@/components/ui/Kpi";
import { contexto, idDaRota } from "@/lib/dados/contexto";
import { carregarProgramacao, carregarRegistros, idsDeHorarios } from "@/lib/dados/doses";
import { listarPacientes } from "@/lib/dados/pacientes";
import {
  aderencia,
  aderenciaPorPaciente,
  agora,
  dataBR,
  dosesDoDia,
  NOMES_DIAS_LONGOS,
  primeiroNome,
  somarDias,
} from "@/lib/servicos";

export const metadata: Metadata = { title: "Hoje" };
export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ paciente?: string }>;
}

/** RF06 — Página do dia (spec 6.3): KPIs, doses de hoje, próxima dose, pacientes, lembretes. */
export default async function PaginaHoje({ searchParams }: Props) {
  const ctx = await contexto();
  const pacienteId = idDaRota((await searchParams).paciente);
  const momento = agora();
  const inicio7 = somarDias(momento.data, -6);

  const [pacientes, medicamentos] = await Promise.all([listarPacientes(), carregarProgramacao(ctx, pacienteId)]);
  const registros7 = await carregarRegistros(idsDeHorarios(medicamentos), inicio7, momento.data, ctx);
  const registrosHoje = registros7.filter((r) => r.data === momento.data);
  const doses = dosesDoDia(medicamentos, registrosHoje, momento);
  const itensAderencia = aderencia(medicamentos, registros7, inicio7, momento.data, momento);
  const porPaciente = aderenciaPorPaciente(itensAderencia);
  const totalProgramadas = itensAderencia.reduce((s, a) => s + a.programadas, 0);
  const totalTomadas = itensAderencia.reduce((s, a) => s + a.tomadas, 0);
  const aderencia7 = totalProgramadas === 0 ? null : Math.round((totalTomadas / totalProgramadas) * 100);

  const tomadas = doses.filter((d) => d.status === "tomada").length;
  const atrasadas = doses.filter((d) => d.status === "atrasada").length;
  const pacienteSelecionado = pacienteId ? pacientes.find((p) => p.id === pacienteId) ?? null : null;
  const linkNovoMedicamento = pacientes.length === 1 ? `/pacientes/${pacientes[0].id}/medicamentos/novo` : "/pacientes";

  return (
    <>
      <div className="pagina-cabecalho">
        <div>
          <p className="texto-suave">
            {NOMES_DIAS_LONGOS[momento.diaSemana]}, {dataBR(momento.data)}
          </p>
          <h1>Olá, {primeiroNome(ctx.usuario.nome)}!</h1>
        </div>
        {pacientes.length > 0 && (
          <Link href={linkNovoMedicamento} className="botao">
            + Novo medicamento
          </Link>
        )}
      </div>

      {pacientes.length === 0 ? (
        <EstadoVazio
          titulo="Você ainda não tem pacientes cadastrados."
          acao={
            <Link href="/pacientes/novo" className="botao">
              Cadastrar o primeiro paciente
            </Link>
          }
        >
          Cadastre um paciente e adicione os medicamentos dele. As doses do dia aparecem aqui.
        </EstadoVazio>
      ) : (
        <div className="pilha">
          <div className="grade grade-kpis">
            <Kpi rotulo="Doses hoje" valor={doses.length} />
            <Kpi rotulo="Tomadas" valor={tomadas} tom="ok" />
            <Kpi rotulo="Atrasadas" valor={atrasadas} tom="danger" />
            <Kpi rotulo="Aderência (7 dias)" valor={aderencia7 === null ? "—" : `${aderencia7}%`} />
          </div>

          {pacientes.length > 1 && (
            <div className="filtro-linha">
              <FiltroPaciente pacientes={pacientes} selecionado={pacienteId} acao="/hoje" />
              {pacienteSelecionado && (
                <p className="texto-suave">
                  Mostrando só <strong>{pacienteSelecionado.nome}</strong>. <Link href="/hoje">Ver todos</Link>.
                </p>
              )}
            </div>
          )}

          <DosesDoDia dosesIniciais={doses} data={momento.data} horaInicial={momento.hora} pacienteId={pacienteId}>
            <Cartao as="section" aria-labelledby="titulo-pacientes">
              <CartaoCabecalho titulo="Pacientes" id="titulo-pacientes">
                <Link href="/pacientes" className="botao botao-secundario botao-pequeno">
                  Ver todos
                </Link>
              </CartaoCabecalho>
              <ul className="lista-pacientes-resumo">
                {pacientes.map((p) => {
                  const a = porPaciente.find((x) => x.paciente_id === p.id);
                  const meds = a?.medicamentos ?? 0;
                  return (
                    <li key={p.id} className="paciente-resumo">
                      <Avatar nome={p.nome} />
                      <div className="paciente-resumo-texto">
                        <Link href={`/pacientes/${p.id}`} className="paciente-resumo-nome">
                          {p.nome}
                        </Link>
                        <span className="texto-suave">
                          {meds} {meds === 1 ? "medicamento" : "medicamentos"}
                        </span>
                      </div>
                      <div className="paciente-resumo-aderencia">
                        <span className="paciente-resumo-percentual">
                          {a && a.programadas > 0 ? `${a.percentual}%` : "—"}
                        </span>
                        {a && a.programadas > 0 && (
                          <BarraProgresso valor={a.percentual} rotulo={`Aderência de ${p.nome} nos últimos 7 dias`} />
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Cartao>
          </DosesDoDia>
        </div>
      )}
    </>
  );
}
