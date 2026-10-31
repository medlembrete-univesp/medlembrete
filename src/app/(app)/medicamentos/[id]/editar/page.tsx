import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FormularioMedicamento } from "@/components/FormularioMedicamento";
import { idDaRota } from "@/lib/dados/contexto";
import { obterMedicamento } from "@/lib/dados/medicamentos";
import { acaoEditarMedicamento } from "../../acoes";

export const metadata: Metadata = { title: "Editar medicamento" };
export const dynamic = "force-dynamic";

/** RF05 — edição; horários alterados são desativados e os novos criados. */
export default async function PaginaEditarMedicamento({ params }: { params: Promise<{ id: string }> }) {
  const id = idDaRota((await params).id);
  if (!id) notFound();
  const m = await obterMedicamento(id);
  if (!m) notFound();

  const acao = acaoEditarMedicamento.bind(null, id, m.paciente.id);

  return (
    <>
      <p className="voltar">
        <Link href={`/pacientes/${m.paciente.id}`}>← {m.paciente.nome}</Link>
      </p>
      <div className="pagina-cabecalho">
        <div>
          <h1>Editar medicamento</h1>
          <p className="texto-suave">Paciente: {m.paciente.nome}</p>
        </div>
      </div>
      <div className="cartao cartao-formulario">
      <FormularioMedicamento
        acao={acao}
        inicial={{
          nome: m.nome,
          dose: m.dose,
          observacao: m.observacao ?? "",
          horarios: m.horarios.filter((h) => h.ativo).map((h) => ({ hora: h.hora, dias_semana: h.dias_semana })),
        }}
        textoBotao="Salvar alterações"
        voltarPara={`/pacientes/${m.paciente.id}`}
      />
      </div>
    </>
  );
}
