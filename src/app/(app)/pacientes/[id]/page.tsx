import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BotaoExcluir } from "@/components/BotaoExcluir";
import { Avatar } from "@/components/ui/Avatar";
import { Cartao } from "@/components/ui/Cartao";
import { EstadoVazio } from "@/components/ui/EstadoVazio";
import { idDaRota } from "@/lib/dados/contexto";
import { listarMedicamentosDoPaciente } from "@/lib/dados/medicamentos";
import { obterPaciente } from "@/lib/dados/pacientes";
import { agora, dataBR, NOMES_DIAS } from "@/lib/servicos";
import { enderecoResumido, idadeEm } from "@/lib/validacao-paciente";
import { formatarCep } from "@/lib/viacep";

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
  const endereco = enderecoResumido(paciente);

  return (
    <>
      <p className="voltar">
        <Link href="/pacientes">← Pacientes</Link>
      </p>
      <div className="pagina-cabecalho">
        <div className="cartao-paciente-topo">
          <Avatar nome={paciente.nome} tamanho={52} />
          <div>
            <h1>{paciente.nome}</h1>
            <p className="texto-suave">
              {paciente.data_nascimento
                ? `Nascimento: ${dataBR(paciente.data_nascimento)}${idade !== null ? ` · ${idade} anos` : ""}`
                : "Data de nascimento não informada"}
            </p>
          </div>
        </div>
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

      {(endereco || paciente.cep || paciente.observacao) && (
        <Cartao className="cartao-compacto">
          {(endereco || paciente.cep) && (
            <p>
              <strong>Endereço:</strong> {endereco}
              {paciente.cep ? `${endereco ? " — " : ""}CEP ${formatarCep(paciente.cep)}` : ""}
            </p>
          )}
          {paciente.observacao && (
            <p>
              <strong>Observações:</strong> {paciente.observacao}
            </p>
          )}
        </Cartao>
      )}

      <div className="pagina-cabecalho secao-cabecalho">
        <h2>Medicamentos</h2>
        <Link href={`/pacientes/${id}/medicamentos/novo`} className="botao">
          + Novo medicamento
        </Link>
      </div>

      {medicamentos.length === 0 ? (
        <EstadoVazio titulo="Nenhum medicamento cadastrado para este paciente.">
          Adicione o primeiro medicamento com seus horários e dias da semana.
        </EstadoVazio>
      ) : (
        <ul className="grade grade-cartoes lista-sem-marcas" aria-label={`Medicamentos de ${paciente.nome}`}>
          {medicamentos.map((m) => (
            <li key={m.id} className="cartao cartao-medicamento">
              <div>
                <h3>{m.nome}</h3>
                <p>
                  <strong>Dose:</strong> {m.dose}
                </p>
                {m.observacao && <p className="texto-suave">{m.observacao}</p>}
              </div>
              <ul className="lista-horarios" aria-label={`Horários de ${m.nome}`}>
                {m.horarios.map((h) => (
                  <li key={h.id} className="horario-item">
                    <span className="hora">{h.hora}</span>
                    <span className="texto-suave">{descreverDias(h.dias_semana)}</span>
                  </li>
                ))}
              </ul>
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
