import type { Metadata } from "next";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { EstadoVazio } from "@/components/ui/EstadoVazio";
import { contexto } from "@/lib/dados/contexto";
import { carregarProgramacao } from "@/lib/dados/doses";
import { listarPacientes } from "@/lib/dados/pacientes";
import { agora } from "@/lib/servicos";
import { idadeEm } from "@/lib/validacao-paciente";

export const metadata: Metadata = { title: "Pacientes" };
export const dynamic = "force-dynamic";

/** Lista de pacientes em cartões (spec 6.4), com os medicamentos e horários de cada um. */
export default async function PaginaPacientes() {
  const ctx = await contexto();
  const [pacientes, medicamentos] = await Promise.all([listarPacientes(), carregarProgramacao(ctx)]);
  const hoje = agora().data;

  return (
    <>
      <div className="pagina-cabecalho">
        <h1>Pacientes</h1>
        <Link href="/pacientes/novo" className="botao">
          + Novo paciente
        </Link>
      </div>

      {pacientes.length === 0 ? (
        <EstadoVazio titulo="Você ainda não cadastrou nenhum paciente.">
          Comece por <Link href="/pacientes/novo">cadastrar um paciente</Link>; depois adicione os medicamentos dele.
        </EstadoVazio>
      ) : (
        <ul className="grade grade-cartoes lista-sem-marcas" aria-label="Lista de pacientes">
          {pacientes.map((p) => {
            const idade = idadeEm(p.data_nascimento, hoje);
            const meds = medicamentos.filter((m) => m.paciente?.id === p.id && m.ativo);
            const local = [p.cidade, p.uf].filter(Boolean).join("/");
            const subtitulo = [idade !== null ? `${idade} anos` : null, local || null].filter(Boolean).join(" · ");
            return (
              <li key={p.id} className="cartao cartao-paciente">
                <div className="cartao-paciente-topo">
                  <Avatar nome={p.nome} tamanho={52} />
                  <div className="cartao-paciente-texto">
                    <h2>
                      <Link href={`/pacientes/${p.id}`}>{p.nome}</Link>
                    </h2>
                    {subtitulo && <p className="texto-suave">{subtitulo}</p>}
                  </div>
                </div>

                {meds.length === 0 ? (
                  <p className="texto-suave">Nenhum medicamento cadastrado.</p>
                ) : (
                  <ul className="lista-medicamentos-resumo" aria-label={`Medicamentos de ${p.nome}`}>
                    {meds.map((m) => (
                      <li key={m.id} className="medicamento-resumo">
                        <span className="medicamento-resumo-nome">{m.nome}</span>
                        <span className="texto-suave hora">
                          {m.horarios
                            .filter((h) => h.ativo)
                            .map((h) => h.hora)
                            .sort()
                            .join(" · ")}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="acoes-linha">
                  <Link href={`/pacientes/${p.id}/medicamentos/novo`} className="botao">
                    + Medicamento
                  </Link>
                  <Link href={`/pacientes/${p.id}/editar`} className="botao botao-secundario">
                    Editar paciente
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
