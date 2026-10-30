import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BotaoExcluir } from "@/components/BotaoExcluir";
import { idDaRota } from "@/lib/dados/contexto";
import { listarMedicamentosDoPaciente } from "@/lib/dados/medicamentos";
import { obterPaciente } from "@/lib/dados/pacientes";
import { agora, dataBR, NOMES_DIAS } from "@/lib/servicos";
import { idadeEm } from "@/lib/validacao-paciente";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = idDaRota((await params).id);
  const p = id ? await obterPaciente(id) : null;
  return { title: p ? p.nome : "Paciente" };
}

function descreverDias(dias: string): string {
  if (dias === "0123456") return "todos os dias";
  if (dias === "01234") return "segunda a sexta";
  if (dias === "56") return "fins de semana";
  return [...dias].map((d) => NOMES_DIAS[Number(d)]).join(", ");
}

/** Detalhe do paciente com seus medicamentos ativos (RF04/RF05). */
export default async function PaginaPaciente({ params }: Props) {
  const id = idDaRota((await params).id);
  if (!id) notFound();
  const paciente = await obterPaciente(id);
  if (!paciente) notFound();
  const medicamentos = (await listarMedicamentosDoPaciente(id)) ?? [];
  const idade = idadeEm(paciente.data_nascimento, agora().data);

  return (
    <>
      <p>
        <Link href="/pacientes">← Pacientes</Link>
      </p>
      <div className="titulo-com-acao">
        <h1>{paciente.nome}</h1>
        <div className="acoes-linha">
          <Link href={`/pacientes/${id}/editar`} className="botao botao-secundario">
            Editar paciente
          </Link>
          <BotaoExcluir
            acao={`/pacientes/${id}/excluir`}
            rotulo="Excluir paciente"
            mensagem={`Excluir o paciente ${paciente.nome}? Os medicamentos dele saem da lista e da página do dia, mas o histórico de doses é mantido.`}
          />
        </div>
      </div>

      <div className="cartao">
        <p className="texto-suave">
          {paciente.data_nascimento
            ? `Nascimento: ${dataBR(paciente.data_nascimento)}${idade !== null ? ` (${idade} anos)` : ""}`
            : "Data de nascimento não informada"}
        </p>
        {paciente.observacao && <p>{paciente.observacao}</p>}
      </div>

      <div className="titulo-com-acao">
        <h2>Medicamentos</h2>
        <Link href={`/pacientes/${id}/medicamentos/novo`} className="botao">
          + Novo medicamento
        </Link>
      </div>

      {medicamentos.length === 0 ? (
        <div className="cartao">
          <p>Nenhum medicamento cadastrado para este paciente.</p>
        </div>
      ) : (
        <ul className="lista-cartoes" aria-label={`Medicamentos de ${paciente.nome}`}>
          {medicamentos.map((m) => (
            <li key={m.id} className="cartao cartao-item">
              <div>
                <h3 className="cartao-titulo">{m.nome}</h3>
                <p>
                  <strong>Dose:</strong> {m.dose}
                </p>
                {m.observacao && <p className="texto-suave">{m.observacao}</p>}
                <ul className="lista-horarios" aria-label={`Horários de ${m.nome}`}>
                  {m.horarios.map((h) => (
                    <li key={h.id}>
                      <span className="hora">{h.hora}</span> — {descreverDias(h.dias_semana)}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="acoes-linha">
                <Link href={`/medicamentos/${m.id}/editar`} className="botao botao-secundario">
                  Editar
                </Link>
                <BotaoExcluir
                  acao={`/medicamentos/${m.id}/excluir`}
                  mensagem={`Excluir ${m.nome} de ${paciente.nome}? Ele sai da lista e da página do dia, mas o histórico é mantido.`}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
