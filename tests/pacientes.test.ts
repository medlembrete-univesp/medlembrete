import { describe, expect, it } from "vitest";
import { PACIENTE_VAZIO, enderecoResumido, idadeEm, lerPaciente, validarPaciente } from "@/lib/validacao-paciente";

const HOJE = "2026-10-29";

describe("validarPaciente", () => {
  it("aceita só o nome", () => {
    expect(validarPaciente({ ...PACIENTE_VAZIO, nome: "Dona Maria" }, HOJE)).toEqual({});
  });

  it("exige nome", () => {
    expect(validarPaciente(PACIENTE_VAZIO, HOJE).nome).toBeDefined();
  });

  it("recusa nascimento no futuro ou inválido", () => {
    expect(validarPaciente({ ...PACIENTE_VAZIO, nome: "A", data_nascimento: "2026-10-30" }, HOJE).data_nascimento).toMatch(/futuro/);
    expect(validarPaciente({ ...PACIENTE_VAZIO, nome: "A", data_nascimento: "2026-02-30" }, HOJE).data_nascimento).toMatch(/válida/);
    expect(validarPaciente({ ...PACIENTE_VAZIO, nome: "A", data_nascimento: "1950-05-20" }, HOJE)).toEqual({});
  });

  it("lerPaciente apara espaços", () => {
    const fd = new FormData();
    fd.set("nome", "  João  ");
    fd.set("data_nascimento", "1950-05-20");
    fd.set("observacao", " alérgico a dipirona ");
    fd.set("cep", "01001-000");
    fd.set("uf", "sp");
    expect(lerPaciente(fd)).toEqual({
      ...PACIENTE_VAZIO,
      nome: "João",
      data_nascimento: "1950-05-20",
      observacao: "alérgico a dipirona",
      cep: "01001000",
      uf: "SP",
    });
  });

  it("valida CEP e UF do endereço quando preenchidos", () => {
    expect(validarPaciente({ ...PACIENTE_VAZIO, nome: "A", cep: "123" }, HOJE).cep).toBeDefined();
    expect(validarPaciente({ ...PACIENTE_VAZIO, nome: "A", uf: "SAO" }, HOJE).uf).toBeDefined();
    expect(validarPaciente({ ...PACIENTE_VAZIO, nome: "A", cep: "01001000", uf: "SP" }, HOJE)).toEqual({});
  });

  it("enderecoResumido monta a linha com o que estiver preenchido", () => {
    expect(enderecoResumido({ logradouro: "Praça da Sé", numero: "10", bairro: "Sé", cidade: "São Paulo", uf: "SP" })).toBe("Praça da Sé, 10 — Sé — São Paulo/SP");
    expect(enderecoResumido({ logradouro: null, numero: null, bairro: null, cidade: "Campinas", uf: null })).toBe("Campinas");
  });
});

describe("idadeEm", () => {
  it("calcula anos completos", () => {
    expect(idadeEm("1950-10-29", HOJE)).toBe(76);
    expect(idadeEm("1950-10-30", HOJE)).toBe(75);
    expect(idadeEm(null, HOJE)).toBeNull();
  });
});
