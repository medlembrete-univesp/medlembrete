/** Validação dos formulários de cadastro e login (RF01, RF03). Funções puras, testáveis. */

export type Erros<T extends string> = Partial<Record<T, string>>;

export const CAMPOS_CADASTRO = [
  "nome",
  "email",
  "senha",
  "confirmacao",
  "cep",
  "cidade",
  "uf",
] as const;
export type CampoCadastro = (typeof CAMPOS_CADASTRO)[number];

export interface DadosCadastro {
  nome: string;
  email: string;
  senha: string;
  confirmacao: string;
  cep: string;
  cidade: string;
  uf: string;
}

export const SENHA_MINIMA = 8;

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function texto(fd: FormData, campo: string): string {
  const v = fd.get(campo);
  return typeof v === "string" ? v.trim() : "";
}

export function lerCadastro(fd: FormData): DadosCadastro {
  return {
    nome: texto(fd, "nome"),
    email: texto(fd, "email").toLowerCase(),
    senha: typeof fd.get("senha") === "string" ? (fd.get("senha") as string) : "",
    confirmacao: typeof fd.get("confirmacao") === "string" ? (fd.get("confirmacao") as string) : "",
    cep: texto(fd, "cep").replace(/\D/g, ""),
    cidade: texto(fd, "cidade"),
    uf: texto(fd, "uf").toUpperCase(),
  };
}

export function validarCadastro(d: DadosCadastro): Erros<CampoCadastro> {
  const erros: Erros<CampoCadastro> = {};
  if (!d.nome) erros.nome = "Informe seu nome.";
  else if (d.nome.length > 100) erros.nome = "O nome deve ter no máximo 100 caracteres.";

  if (!d.email) erros.email = "Informe seu e-mail.";
  else if (!REGEX_EMAIL.test(d.email) || d.email.length > 120)
    erros.email = "Informe um e-mail válido.";

  if (!d.senha) erros.senha = "Informe uma senha.";
  else if (d.senha.length < SENHA_MINIMA)
    erros.senha = `A senha deve ter pelo menos ${SENHA_MINIMA} caracteres.`;

  if (!d.confirmacao) erros.confirmacao = "Repita a senha.";
  else if (d.senha && d.confirmacao !== d.senha) erros.confirmacao = "As senhas não coincidem.";

  if (d.cep && !/^\d{8}$/.test(d.cep)) erros.cep = "O CEP deve ter 8 números.";
  if (d.cidade.length > 100) erros.cidade = "A cidade deve ter no máximo 100 caracteres.";
  if (d.uf && !(UFS as readonly string[]).includes(d.uf)) erros.uf = "Informe uma UF válida (ex.: SP).";
  return erros;
}

export interface DadosLogin {
  email: string;
  senha: string;
}

export function lerLogin(fd: FormData): DadosLogin {
  return {
    email: texto(fd, "email").toLowerCase(),
    senha: typeof fd.get("senha") === "string" ? (fd.get("senha") as string) : "",
  };
}

export function validarLogin(d: DadosLogin): Erros<"email" | "senha"> {
  const erros: Erros<"email" | "senha"> = {};
  if (!d.email) erros.email = "Informe seu e-mail.";
  if (!d.senha) erros.senha = "Informe sua senha.";
  return erros;
}

export const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA",
  "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const;
