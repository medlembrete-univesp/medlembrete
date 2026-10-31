import type { Metadata } from "next";
import { FormularioPaciente } from "@/components/FormularioPaciente";
import { PACIENTE_VAZIO } from "@/lib/validacao-paciente";
import { acaoCriarPaciente } from "../acoes";

export const metadata: Metadata = { title: "Novo paciente" };

export default function PaginaNovoPaciente() {
  return (
    <>
      <div className="pagina-cabecalho">
        <h1>Novo paciente</h1>
      </div>
      <div className="cartao cartao-formulario">
      <FormularioPaciente
        acao={acaoCriarPaciente}
        inicial={PACIENTE_VAZIO}
        textoBotao="Salvar paciente"
        voltarPara="/pacientes"
      />
      </div>
    </>
  );
}
