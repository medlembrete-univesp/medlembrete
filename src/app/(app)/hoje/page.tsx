import type { Metadata } from "next";
import Link from "next/link";
import { DosesDoDia } from "@/components/DosesDoDia";
import { FiltroPaciente } from "@/components/FiltroPaciente";
import { contexto, idDaRota } from "@/lib/dados/contexto";
import { carregarProgramacao, carregarRegistros, idsDeHorarios } from "@/lib/dados/doses";
import { listarPacientes } from "@/lib/dados/pacientes";
import { agora, dataBR, dosesDoDia, NOMES_DIAS_LONGOS } from "@/lib/servicos";

export const metadata: Metadata = { title: "Hoje" };
export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ paciente?: string }>;
}

/** RF06 — Página do dia: doses de todos os pacientes, com filtro por paciente. */
export default async function PaginaHoje({ searchParams }: Props) {
  const ctx = await contexto();
  const pacienteId = idDaRota((await searchParams).paciente);
  const momento = agora();

  const [pacientes, medicamentos] = await Promise.all([listarPacientes(), carregarProgramacao(ctx, pacienteId)]);
  const registros = await carregarRegistros(idsDeHorarios(medicamentos), momento.data, momento.data, ctx);
  const doses = dosesDoDia(medicamentos, registros, momento);
  const pacienteSelecionado = pacienteId ? pacientes.find((p) => p.id === pacienteId) ?? null : null;

  return (
    <>
      <div className="titulo-com-acao">
        <h1>Hoje</h1>
        <p className="texto-suave data-hoje">
          {NOMES_DIAS_LONGOS[momento.diaSemana]}, {dataBR(momento.data)}
        </p>
      </div>

      {pacientes.length === 0 ? (
        <div className="cartao">
          <p>Você ainda não tem pacientes cadastrados.</p>
          <p>
            <Link href="/pacientes/novo" className="botao">
              Cadastrar o primeiro paciente
            </Link>
          </p>
        </div>
      ) : (
        <>
          <FiltroPaciente pacientes={pacientes} selecionado={pacienteId} acao="/hoje" />
          {pacienteSelecionado && (
            <p className="texto-suave">
              Mostrando só <strong>{pacienteSelecionado.nome}</strong>. <Link href="/hoje">Ver todos</Link>.
            </p>
          )}
          <DosesDoDia dosesIniciais={doses} data={momento.data} horaInicial={momento.hora} pacienteId={pacienteId} />
        </>
      )}
    </>
  );
}
