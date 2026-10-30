import { describe, expect, it } from "vitest";
import { idadeEm, lerPaciente, validarPaciente } from "@/lib/validacao-paciente";

const HOJE = "2026-10-29";

describe("validarPaciente", () => {
  it("aceita só o nome", () => {
    expect(validarPaciente({ nome: "Dona Maria", data_nascimento: "", observacao: "" }, HOJE)).toEqual({});
  });

  it("exige nome", () => {
    expect(validarPaciente({ nome: "", data_nascimento: "", observacao: "" }, HOJE).nome).toBeDefined();
  });

  it("recusa nascimento no futuro ou inválido", () => {
    expect(validarPaciente({ nome: "A", data_nascimento: "2026-10-30", observacao: "" }, HOJE).data_nascimento).toMatch(/futuro/);
    expect(validarPaciente({ nome: "A", data_nascimento: "2026-02-30", observacao: "" }, HOJE).data_nascimento).toMatch(/válida/);
    expect(validarPaciente({ nome: "A", data_nascimento: "1950-05-20", observacao: "" }, HOJE)).toEqual({});
  });

  it("lerPaciente apara espaços", () => {
    const fd = new FormData();
    fd.set("nome", "  João  ");
    fd.set("data_nascimento", "1950-05-20");
    fd.set("observacao", " alérgico a dipirona ");
    expect(lerPaciente(fd)).toEqual({ nome: "João", data_nascimento: "1950-05-20", observacao: "alérgico a dipirona" });
  });
});

describe("idadeEm", () => {
  it("calcula anos completos", () => {
    expect(idadeEm("1950-10-29", HOJE)).toBe(76);
    expect(idadeEm("1950-10-30", HOJE)).toBe(75);
    expect(idadeEm(null, HOJE)).toBeNull();
  });
});
