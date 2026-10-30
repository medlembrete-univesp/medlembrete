import type { Metadata } from "next";
import { FormularioPaciente } from "@/components/FormularioPaciente";
import { PACIENTE_VAZIO } from "@/lib/validacao-paciente";
import { acaoCriarPaciente } from "../acoes";

export const metadata: Metadata = { title: "Novo paciente" };

export default function PaginaNovoPaciente() {
  return (
    <>
      <h1>Novo paciente</h1>
      <FormularioPaciente
        acao={acaoCriarPaciente}
        inicial={PACIENTE_VAZIO}
        textoBotao="Salvar paciente"
        voltarPara="/pacientes"
      />
    </>
  );
}
