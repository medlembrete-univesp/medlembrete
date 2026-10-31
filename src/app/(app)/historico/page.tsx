import type { Metadata } from "next";
import { FiltroPaciente } from "@/components/FiltroPaciente";
import { Cartao } from "@/components/ui/Cartao";
import { EstadoVazio } from "@/components/ui/EstadoVazio";
import { Selo, type TomSelo } from "@/components/ui/Selo";
import { contexto, idDaRota } from "@/lib/dados/contexto";
import { carregarProgramacao, carregarRegistros, idsDeHorarios } from "@/lib/dados/doses";
import { listarPacientes } from "@/lib/dados/pacientes";
import { agora, dataBR, historico, horaLocalDe, type StatusHistorico } from "@/lib/servicos";
import { periodoValido } from "@/lib/validacao-dose";

export const metadata: Metadata = { title: "Histórico" };
export const dynamic = "force-dynamic";

const ROTULO: Record<StatusHistorico, string> = { tomada: "Tomada", nao_tomada: "Não tomada", pendente: "Pendente" };
const TOM: Record<StatusHistorico, TomSelo> = { tomada: "ok", nao_tomada: "danger", pendente: "neutro" };

interface Props {
  searchParams: Promise<{ inicio?: string; fim?: string; paciente?: string }>;
}

/** RF09 — Histórico das doses (spec 6.5): cartão de filtro + cartão com a tabela. */
export default async function PaginaHistorico({ searchParams }: Props) {
  const ctx = await contexto();
  const sp = await searchParams;
  const momento = agora();
  const pacienteId = idDaRota(sp.paciente);
  const { inicio, fim, aviso } = periodoValido(sp.inicio, sp.fim, momento.data);

  const [pacientes, medicamentos] = await Promise.all([listarPacientes(), carregarProgramacao(ctx, pacienteId)]);
  const registros = await carregarRegistros(idsDeHorarios(medicamentos), inicio, fim, ctx);
  const linhas = historico(medicamentos, registros, inicio, fim, momento);
  const tomadas = linhas.filter((l) => l.status === "tomada").length;
  const mostrarPaciente = !pacienteId && pacientes.length > 1;

  return (
    <>
      <div className="pagina-cabecalho">
        <h1>Histórico</h1>
      </div>

      <div className="pilha">
        <Cartao className="cartao-filtro">
          <form method="get" action="/historico" className="filtro">
            {pacienteId && <input type="hidden" name="paciente" value={pacienteId} />}
            <div className="campo campo-inline">
              <label htmlFor="inicio">De</label>
              <input id="inicio" name="inicio" type="date" defaultValue={inicio} max={momento.data} />
            </div>
            <div className="campo campo-inline">
              <label htmlFor="fim">Até</label>
              <input id="fim" name="fim" type="date" defaultValue={fim} max={momento.data} />
            </div>
            <button type="submit" className="botao">
              Aplicar período
            </button>
            <p className="texto-suave filtro-periodo-texto">
              Período: {dataBR(inicio)} a {dataBR(fim)}
            </p>
          </form>
          <FiltroPaciente pacientes={pacientes} selecionado={pacienteId} acao="/historico" extras={{ inicio, fim }} />
          {aviso && (
            <p className="mensagem mensagem-alerta" role="status">
              {aviso}
            </p>
          )}
        </Cartao>

        {linhas.length === 0 ? (
          <EstadoVazio titulo="Nenhuma dose programada ou registrada neste período." />
        ) : (
          <Cartao>
            <p className="texto-suave resumo-doses">
              {tomadas} de {linhas.length} {linhas.length === 1 ? "dose" : "doses"} tomadas.
            </p>
            <div className="tabela-rolavel">
              <table className="tabela">
                <caption className="visualmente-oculto">
                  Doses de {dataBR(inicio)} a {dataBR(fim)}
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Data</th>
                    <th scope="col">Horário</th>
                    {mostrarPaciente && <th scope="col">Paciente</th>}
                    <th scope="col">Medicamento</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {linhas.map((l) => (
                    <tr key={`${l.horario_id}|${l.data}`}>
                      <td>{dataBR(l.data)}</td>
                      <td className="hora">{l.hora}</td>
                      {mostrarPaciente && <td>{l.paciente ?? "—"}</td>}
                      <td>
                        <strong>{l.medicamento}</strong> <span className="texto-suave">· {l.dose}</span>
                      </td>
                      <td>
                        <Selo tom={TOM[l.status]}>
                          {ROTULO[l.status]}
                          {l.status === "tomada" && l.tomado_em ? ` às ${horaLocalDe(l.tomado_em)}` : ""}
                        </Selo>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Cartao>
        )}
      </div>
    </>
  );
}
