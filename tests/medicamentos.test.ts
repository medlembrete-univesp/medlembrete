import { describe, expect, it } from "vitest";
import {
  diferencaHorarios,
  lerMedicamento,
  normalizarDias,
  validarMedicamento,
  type DadosMedicamento,
} from "@/lib/validacao-medicamento";

function formulario(campos: Record<string, string | string[]>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(campos)) {
    if (Array.isArray(v)) for (const item of v) fd.append(k, item);
    else fd.set(k, v);
  }
  return fd;
}

describe("lerMedicamento + validarMedicamento (RF04)", () => {
  it("criar medicamento com dois horários é aceito", () => {
    const d = lerMedicamento(
      formulario({
        nome: "Losartana",
        dose: "1 comprimido de 50 mg",
        observacao: "",
        qtd_horarios: "2",
        hora_0: "08:00",
        dias_0: ["0", "1", "2", "3", "4", "5", "6"],
        hora_1: "20:00",
        dias_1: ["0", "2", "4"],
      }),
    );
    expect(d.horarios).toEqual([
      { hora: "08:00", dias_semana: "0123456" },
      { hora: "20:00", dias_semana: "024" },
    ]);
    const e = validarMedicamento(d);
    expect(e.campos).toEqual({});
    expect(e.horarios.filter(Boolean)).toHaveLength(0);
  });

  it("criar sem horário é recusado", () => {
    const d = lerMedicamento(formulario({ nome: "Losartana", dose: "50 mg", qtd_horarios: "0" }));
    expect(validarMedicamento(d).campos.horarios).toMatch(/pelo menos um horário/);
  });

  it("horário sem dia marcado é recusado, apontando a linha", () => {
    const d = lerMedicamento(
      formulario({ nome: "X", dose: "1", qtd_horarios: "2", hora_0: "08:00", dias_0: ["0"], hora_1: "09:00" }),
    );
    const e = validarMedicamento(d);
    expect(e.horarios[0]).toBeUndefined();
    expect(e.horarios[1]).toMatch(/dia da semana/);
    expect(e.campos.horarios).toBeDefined();
  });

  it("hora inválida e hora repetida são recusadas", () => {
    const base: DadosMedicamento = {
      nome: "X",
      dose: "1",
      observacao: "",
      horarios: [
        { hora: "25:00", dias_semana: "0" },
        { hora: "08:00", dias_semana: "0" },
        { hora: "08:00", dias_semana: "1" },
      ],
    };
    const e = validarMedicamento(base);
    expect(e.horarios[0]).toMatch(/inválido/i);
    expect(e.horarios[1]).toBeUndefined();
    expect(e.horarios[2]).toMatch(/já foi informado/);
  });

  it("nome e dose são obrigatórios", () => {
    const e = validarMedicamento({ nome: "", dose: "", observacao: "", horarios: [{ hora: "08:00", dias_semana: "0" }] });
    expect(e.campos.nome).toBeDefined();
    expect(e.campos.dose).toBeDefined();
  });

  it("normalizarDias ordena, remove repetidos e ignora lixo", () => {
    expect(normalizarDias(["6", "0", "6", "x", "34"])).toBe("0346");
    expect(normalizarDias([])).toBe("");
  });
});

describe("diferencaHorarios (RF05 — editar mantém histórico)", () => {
  const atuais = [
    { id: 10, hora: "08:00", dias_semana: "0123456", ativo: true },
    { id: 11, hora: "20:00", dias_semana: "0", ativo: true },
    { id: 12, hora: "12:00", dias_semana: "0123456", ativo: false }, // já desativado antes
  ];

  it("mantém horários iguais, desativa os alterados e cria os novos", () => {
    const r = diferencaHorarios(atuais, [
      { hora: "08:00", dias_semana: "0123456" }, // igual → manter
      { hora: "20:00", dias_semana: "01" }, // dias mudaram → desativar 11 e criar
      { hora: "14:00", dias_semana: "5" }, // novo
    ]);
    expect(r.manter).toEqual([10]);
    expect(r.desativar).toEqual([11]);
    expect(r.criar).toEqual([
      { hora: "20:00", dias_semana: "01" },
      { hora: "14:00", dias_semana: "5" },
    ]);
  });

  it("remover todos desativa todos os ativos e não toca nos já inativos", () => {
    const r = diferencaHorarios(atuais, []);
    expect(r.desativar.sort()).toEqual([10, 11]);
    expect(r.manter).toEqual([]);
    expect(r.criar).toEqual([]);
  });

  it("sem mudanças não desativa nem cria nada", () => {
    const r = diferencaHorarios(atuais, [
      { hora: "20:00", dias_semana: "0" },
      { hora: "08:00", dias_semana: "0123456" },
    ]);
    expect(r.desativar).toEqual([]);
    expect(r.criar).toEqual([]);
    expect(r.manter.sort()).toEqual([10, 11]);
  });
});
