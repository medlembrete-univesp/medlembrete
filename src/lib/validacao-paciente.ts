import { dataValida } from "@/lib/servicos";
import { texto, type Erros } from "@/lib/validacao";

export type CampoPaciente = "nome" | "data_nascimento" | "observacao";

export interface DadosPaciente {
  nome: string;
  /** AAAA-MM-DD ou vazio */
  data_nascimento: string;
  observacao: string;
}

export function lerPaciente(fd: FormData): DadosPaciente {
  return {
    nome: texto(fd, "nome"),
    data_nascimento: texto(fd, "data_nascimento"),
    observacao: texto(fd, "observacao"),
  };
}

/** `hoje` em AAAA-MM-DD (vem de agora().data) para recusar nascimento no futuro. */
export function validarPaciente(d: DadosPaciente, hoje: string): Erros<CampoPaciente> {
  const erros: Erros<CampoPaciente> = {};
  if (!d.nome) erros.nome = "Informe o nome do paciente.";
  else if (d.nome.length > 120) erros.nome = "O nome deve ter no máximo 120 caracteres.";

  if (d.data_nascimento) {
    if (!dataValida(d.data_nascimento)) erros.data_nascimento = "Informe uma data válida.";
    else if (d.data_nascimento > hoje) erros.data_nascimento = "A data de nascimento não pode ser no futuro.";
    else if (d.data_nascimento < "1900-01-01") erros.data_nascimento = "Informe uma data a partir de 1900.";
  }

  if (d.observacao.length > 255) erros.observacao = "A observação deve ter no máximo 255 caracteres.";
  return erros;
}

/** Idade em anos completos, ou null sem data de nascimento. */
export function idadeEm(dataNascimento: string | null, hoje: string): number | null {
  if (!dataNascimento) return null;
  const [an, mn, dn] = dataNascimento.split("-").map(Number);
  const [ah, mh, dh] = hoje.split("-").map(Number);
  let idade = ah - an;
  if (mh < mn || (mh === mn && dh < dn)) idade -= 1;
  return idade < 0 ? null : idade;
}
