import { describe, expect, it } from "vitest";
import { lerCadastro, validarCadastro, validarLogin, type DadosCadastro } from "@/lib/validacao";
import { consultarCep } from "@/lib/viacep";

const valido: DadosCadastro = {
  nome: "Maria",
  email: "maria@exemplo.com",
  senha: "segredo123",
  confirmacao: "segredo123",
  cep: "01001000",
  cidade: "São Paulo",
  uf: "SP",
};

describe("validarCadastro (RF01)", () => {
  it("aceita dados válidos", () => {
    expect(validarCadastro(valido)).toEqual({});
  });

  it("exige senha com no mínimo 8 caracteres", () => {
    const erros = validarCadastro({ ...valido, senha: "1234567", confirmacao: "1234567" });
    expect(erros.senha).toMatch(/8 caracteres/);
  });

  it("exige confirmação igual à senha", () => {
    const erros = validarCadastro({ ...valido, confirmacao: "outra-coisa" });
    expect(erros.confirmacao).toBe("As senhas não coincidem.");
  });

  it("CEP, cidade e UF são opcionais, mas validados quando preenchidos", () => {
    expect(validarCadastro({ ...valido, cep: "", cidade: "", uf: "" })).toEqual({});
    expect(validarCadastro({ ...valido, cep: "123" }).cep).toBeDefined();
    expect(validarCadastro({ ...valido, uf: "SAO" }).uf).toBeDefined();
  });

  it("lerCadastro normaliza e-mail em minúsculo, CEP só com dígitos e UF em maiúsculo", () => {
    const fd = new FormData();
    fd.set("nome", "  Maria ");
    fd.set("email", "MARIA@Exemplo.com");
    fd.set("senha", "segredo123");
    fd.set("confirmacao", "segredo123");
    fd.set("cep", "01001-000");
    fd.set("cidade", "São Paulo");
    fd.set("uf", "sp");
    expect(lerCadastro(fd)).toEqual(valido);
  });
});

describe("validarLogin (RF03)", () => {
  it("exige e-mail e senha", () => {
    expect(validarLogin({ email: "", senha: "" })).toEqual({
      email: "Informe seu e-mail.",
      senha: "Informe sua senha.",
    });
  });
});

describe("consultarCep (RF02)", () => {
  const fakeFetch = (corpo: unknown, ok = true) =>
    (async () => ({ ok, json: async () => corpo })) as unknown as typeof fetch;

  it("preenche cidade e UF quando a ViaCEP responde", async () => {
    const r = await consultarCep("01001-000", fakeFetch({ localidade: "São Paulo", uf: "SP" }));
    expect(r).toEqual({ ok: true, cidade: "São Paulo", uf: "SP" });
  });

  it("CEP inexistente devolve mensagem clara", async () => {
    const r = await consultarCep("99999999", fakeFetch({ erro: true }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.mensagem).toMatch(/não encontrado/i);
  });

  it("falha de rede não lança exceção", async () => {
    const falha = (async () => {
      throw new Error("offline");
    }) as unknown as typeof fetch;
    const r = await consultarCep("01001000", falha);
    expect(r.ok).toBe(false);
  });

  it("CEP com menos de 8 dígitos não chama a API", async () => {
    let chamadas = 0;
    const contador = (async () => {
      chamadas++;
      return { ok: true, json: async () => ({}) };
    }) as unknown as typeof fetch;
    await consultarCep("123", contador);
    expect(chamadas).toBe(0);
  });
});
