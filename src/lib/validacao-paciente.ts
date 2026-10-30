import { dataValida } from "@/lib/servicos";
import { texto, UFS, type Erros } from "@/lib/validacao";

export type CampoPaciente =
  | "nome"
  | "data_nascimento"
  | "observacao"
  | "cep"
  | "logradouro"
  | "numero"
  | "bairro"
  | "cidade"
  | "uf";

export interface DadosPaciente {
  nome: string;
  /** AAAA-MM-DD ou vazio */
  data_nascimento: string;
  observacao: string;
  /** só dígitos (8) ou vazio */
  cep: string;
  logradouro: string;
  numero: string;
  bairro: string;
  cidade: string;
  uf: string;
}

export const PACIENTE_VAZIO: DadosPaciente = {
  nome: "",
  data_nascimento: "",
  observacao: "",
  cep: "",
  logradouro: "",
  numero: "",
  bairro: "",
  cidade: "",
  uf: "",
};

export function lerPaciente(fd: FormData): DadosPaciente {
  return {
    nome: texto(fd, "nome"),
    data_nascimento: texto(fd, "data_nascimento"),
    observacao: texto(fd, "observacao"),
    cep: texto(fd, "cep").replace(/\D/g, ""),
    logradouro: texto(fd, "logradouro"),
    numero: texto(fd, "numero"),
    bairro: texto(fd, "bairro"),
    cidade: texto(fd, "cidade"),
    uf: texto(fd, "uf").toUpperCase(),
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

  if (d.cep && !/^\d{8}$/.test(d.cep)) erros.cep = "O CEP deve ter 8 números.";
  if (d.logradouro.length > 150) erros.logradouro = "O logradouro deve ter no máximo 150 caracteres.";
  if (d.numero.length > 20) erros.numero = "O número deve ter no máximo 20 caracteres.";
  if (d.bairro.length > 100) erros.bairro = "O bairro deve ter no máximo 100 caracteres.";
  if (d.cidade.length > 100) erros.cidade = "A cidade deve ter no máximo 100 caracteres.";
  if (d.uf && !(UFS as readonly string[]).includes(d.uf)) erros.uf = "Informe uma UF válida (ex.: SP).";
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

/** "Rua X, 10 — Bairro, Cidade/UF" com o que estiver preenchido. */
export function enderecoResumido(d: {
  logradouro: string | null;
  numero: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
}): string {
  const rua = [d.logradouro, d.numero].filter(Boolean).join(", ");
  const cidadeUf = [d.cidade, d.uf].filter(Boolean).join("/");
  return [rua, d.bairro, cidadeUf].filter(Boolean).join(" — ");
}
