import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FormularioPaciente } from "@/components/FormularioPaciente";
import { idDaRota } from "@/lib/dados/contexto";
import { obterPaciente, paraFormulario } from "@/lib/dados/pacientes";
import { acaoEditarPaciente } from "../../acoes";

export const metadata: Metadata = { title: "Editar paciente" };
export const dynamic = "force-dynamic";

export default async function PaginaEditarPaciente({ params }: { params: Promise<{ id: string }> }) {
  const id = idDaRota((await params).id);
  if (!id) notFound();
  const paciente = await obterPaciente(id);
  if (!paciente) notFound();

  const acao = acaoEditarPaciente.bind(null, id);

  return (
    <>
      <div className="pagina-cabecalho">
        <h1>Editar paciente</h1>
      </div>
      <div className="cartao cartao-formulario">
      <FormularioPaciente
        acao={acao}
        inicial={paraFormulario(paciente)}
        textoBotao="Salvar alterações"
        voltarPara={`/pacientes/${id}`}
      />
      </div>
    </>
  );
}
