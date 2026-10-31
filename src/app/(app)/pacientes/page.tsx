import type { Metadata } from "next";
import Link from "next/link";
import { listarPacientes } from "@/lib/dados/pacientes";
import { agora, dataBR } from "@/lib/servicos";
import { idadeEm } from "@/lib/validacao-paciente";

export const metadata: Metadata = { title: "Pacientes" };
export const dynamic = "force-dynamic";

export default async function PaginaPacientes() {
  const pacientes = await listarPacientes();
  const hoje = agora().data;

  return (
    <>
      <div className="titulo-com-acao">
        <h1>Pacientes</h1>
        <Link href="/pacientes/novo" className="botao">
          + Novo paciente
        </Link>
      </div>

      {pacientes.length === 0 ? (
        <div className="cartao">
          <p>Você ainda não cadastrou nenhum paciente.</p>
          <p>
            Comece por <Link href="/pacientes/novo">cadastrar um paciente</Link>; depois adicione os
            medicamentos dele.
          </p>
        </div>
      ) : (
        <ul className="lista-cartoes" aria-label="Lista de pacientes">
          {pacientes.map((p) => {
            const idade = idadeEm(p.data_nascimento, hoje);
            return (
              <li key={p.id} className="cartao cartao-item">
                <div>
                  <h2 className="cartao-titulo">
                    <Link href={`/pacientes/${p.id}`}>{p.nome}</Link>
                  </h2>
                  <p className="texto-suave">
                    {p.data_nascimento
                      ? `Nascimento: ${dataBR(p.data_nascimento)}${idade !== null ? ` (${idade} anos)` : ""}`
                      : "Data de nascimento não informada"}
                  </p>
                  {(p.cidade || p.uf) && <p className="texto-suave">{[p.cidade, p.uf].filter(Boolean).join("/")}</p>}
                  {p.observacao && <p>{p.observacao}</p>}
                </div>
                <div className="acoes-linha">
                  <Link href={`/pacientes/${p.id}`} className="botao botao-secundario">
                    Medicamentos
                  </Link>
                  <Link href={`/pacientes/${p.id}/editar`} className="botao botao-secundario">
                    Editar
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
