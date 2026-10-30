import type { Metadata } from "next";
import { FormularioPaciente } from "@/components/FormularioPaciente";
import { acaoCriarPaciente } from "../acoes";

export const metadata: Metadata = { title: "Novo paciente" };

export default function PaginaNovoPaciente() {
  return (
    <>
      <h1>Novo paciente</h1>
      <FormularioPaciente
        acao={acaoCriarPaciente}
        inicial={{ nome: "", data_nascimento: "", observacao: "" }}
        textoBotao="Salvar paciente"
        voltarPara="/pacientes"
      />
    </>
  );
}
