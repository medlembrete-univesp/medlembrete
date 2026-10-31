import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FormularioMedicamento } from "@/components/FormularioMedicamento";
import { idDaRota } from "@/lib/dados/contexto";
import { obterPaciente } from "@/lib/dados/pacientes";
import { acaoCriarMedicamento } from "@/app/(app)/medicamentos/acoes";

export const metadata: Metadata = { title: "Novo medicamento" };
export const dynamic = "force-dynamic";

/** RF04 — cadastro de medicamento para um paciente. */
export default async function PaginaNovoMedicamento({ params }: { params: Promise<{ id: string }> }) {
  const id = idDaRota((await params).id);
  if (!id) notFound();
  const paciente = await obterPaciente(id);
  if (!paciente) notFound();

  const acao = acaoCriarMedicamento.bind(null, id);

  return (
    <>
      <p className="voltar">
        <Link href={`/pacientes/${id}`}>← {paciente.nome}</Link>
      </p>
      <div className="pagina-cabecalho">
        <div>
          <h1>Novo medicamento</h1>
          <p className="texto-suave">Paciente: {paciente.nome}</p>
        </div>
      </div>
      <div className="cartao cartao-formulario">
      <FormularioMedicamento
        acao={acao}
        inicial={{ nome: "", dose: "", observacao: "", horarios: [] }}
        textoBotao="Salvar medicamento"
        voltarPara={`/pacientes/${id}`}
      />
      </div>
    </>
  );
}
