import type { Metadata } from "next";
import { FiltroPaciente } from "@/components/FiltroPaciente";
import { contexto, idDaRota } from "@/lib/dados/contexto";
import { carregarProgramacao, carregarRegistros, idsDeHorarios } from "@/lib/dados/doses";
import { listarPacientes } from "@/lib/dados/pacientes";
import { agora, dataBR, historico, horaLocalDe, type StatusHistorico } from "@/lib/servicos";
import { periodoValido } from "@/lib/validacao-dose";

export const metadata: Metadata = { title: "Histórico" };
export const dynamic = "force-dynamic";

const ROTULO: Record<StatusHistorico, string> = {
  tomada: "Tomada",
  nao_tomada: "Não tomada",
  pendente: "Pendente",
};

interface Props {
  searchParams: Promise<{ inicio?: string; fim?: string; paciente?: string }>;
}

/** RF09 — Histórico das doses dos últimos 7 dias, com filtro de período e paciente. */
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
      <h1>Histórico</h1>

      <form method="get" action="/historico" className="filtro filtro-periodo">
        {pacienteId && <input type="hidden" name="paciente" value={pacienteId} />}
        <div>
          <label htmlFor="inicio">De</label>
          <input id="inicio" name="inicio" type="date" defaultValue={inicio} max={momento.data} />
        </div>
        <div>
          <label htmlFor="fim">Até</label>
          <input id="fim" name="fim" type="date" defaultValue={fim} max={momento.data} />
        </div>
        <button type="submit" className="botao botao-secundario">
          Aplicar período
        </button>
      </form>
      <FiltroPaciente pacientes={pacientes} selecionado={pacienteId} acao="/historico" extras={{ inicio, fim }} />

      {aviso && (
        <p className="mensagem mensagem-alerta" role="status">
          {aviso}
        </p>
      )}

      <p className="texto-suave">
        Período: {dataBR(inicio)} a {dataBR(fim)}.{" "}
        {linhas.length === 0
          ? "Nenhuma dose programada ou registrada."
          : `${tomadas} de ${linhas.length} ${linhas.length === 1 ? "dose" : "doses"} tomadas.`}
      </p>

      {linhas.length > 0 && (
        <div className="tabela-rolavel">
          <table>
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
                <th scope="col">Tomada às</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((l) => (
                <tr key={`${l.horario_id}|${l.data}`}>
                  <td>{dataBR(l.data)}</td>
                  <td className="hora">{l.hora}</td>
                  {mostrarPaciente && <td>{l.paciente ?? "—"}</td>}
                  <td>
                    {l.medicamento} <span className="texto-suave">({l.dose})</span>
                  </td>
                  <td>
                    <span className={`status status-${l.status}`}>{ROTULO[l.status]}</span>
                  </td>
                  <td>{l.tomado_em ? horaLocalDe(l.tomado_em) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
