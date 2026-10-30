import { describe, expect, it } from "vitest";
import { aderencia, dosesDoDia, historico, type MedicamentoComHorarios } from "@/lib/servicos";
import { periodoValido, validarCorpoDose } from "@/lib/validacao-dose";

const HOJE = "2026-10-29"; // quinta-feira

describe("validarCorpoDose (RF07)", () => {
  it("aceita horario_id numérico ou texto e data de hoje", () => {
    expect(validarCorpoDose({ horario_id: 3, data: HOJE }, HOJE)).toEqual({ ok: true, valor: { horario_id: 3, data: HOJE } });
    expect(validarCorpoDose({ horario_id: "3" }, HOJE)).toEqual({ ok: true, valor: { horario_id: 3, data: HOJE } });
  });

  it("recusa corpo inválido, id inválido, data futura e data antiga demais", () => {
    expect(validarCorpoDose(null, HOJE).ok).toBe(false);
    expect(validarCorpoDose({ horario_id: 0 }, HOJE).ok).toBe(false);
    expect(validarCorpoDose({ horario_id: "abc" }, HOJE).ok).toBe(false);
    expect(validarCorpoDose({ horario_id: 1, data: "2026-10-30" }, HOJE).ok).toBe(false);
    expect(validarCorpoDose({ horario_id: 1, data: "2026-10-01" }, HOJE).ok).toBe(false);
    expect(validarCorpoDose({ horario_id: 1, data: "2026-13-01" }, HOJE).ok).toBe(false);
    expect(validarCorpoDose({ horario_id: 1, data: "2026-10-25" }, HOJE).ok).toBe(true);
  });
});

describe("periodoValido (RF09)", () => {
  it("padrão são os últimos 7 dias até hoje", () => {
    expect(periodoValido(undefined, undefined, HOJE)).toEqual({ inicio: "2026-10-23", fim: HOJE, aviso: undefined });
  });
  it("não deixa o fim passar de hoje e inverte datas trocadas", () => {
    expect(periodoValido("2026-10-20", "2026-11-05", HOJE).fim).toBe(HOJE);
    const r = periodoValido("2026-10-28", "2026-10-20", HOJE);
    expect([r.inicio, r.fim]).toEqual(["2026-10-20", "2026-10-28"]);
    expect(r.aviso).toMatch(/invertidas/);
  });
  it("limita a 90 dias", () => {
    const r = periodoValido("2025-01-01", HOJE, HOJE);
    expect(r.inicio).toBe("2026-08-01");
    expect(r.aviso).toMatch(/90 dias/);
  });
});

describe("doses só a partir da criação (RF09, RF10)", () => {
  const med: MedicamentoComHorarios = {
    id: 1, nome: "Losartana", dose: "50 mg", ativo: true, inicio: "2026-10-28",
    paciente: { id: 10, nome: "Maria" },
    horarios: [
      { id: 100, hora: "08:00", dias_semana: "0123456", ativo: true, inicio: "2026-10-28" },
      { id: 101, hora: "20:00", dias_semana: "0123456", ativo: true, inicio: HOJE }, // horário acrescentado hoje
    ],
  };

  it("histórico ignora dias anteriores à criação do medicamento e do horário", () => {
    const h = historico([med], [], "2026-10-23", HOJE, { data: HOJE, hora: "23:00" });
    expect(h.map((l) => [l.data, l.hora])).toEqual([
      [HOJE, "08:00"],
      [HOJE, "20:00"],
      ["2026-10-28", "08:00"],
    ]);
  });

  it("aderência conta só as doses que existiam", () => {
    const [a] = aderencia([med], [], "2026-10-01", HOJE, { data: HOJE, hora: "23:00" });
    expect(a.programadas).toBe(3);
  });

  it("sem `inicio` (dados antigos) o comportamento continua o mesmo", () => {
    const semInicio = { ...med, inicio: undefined, horarios: med.horarios.map((h) => ({ ...h, inicio: undefined })) };
    expect(historico([semInicio], [], "2026-10-28", HOJE, { data: HOJE, hora: "23:00" })).toHaveLength(4);
  });
});

describe("serviços com paciente (RF06, RF09, RF10)", () => {
  const maria: MedicamentoComHorarios = {
    id: 1, nome: "Losartana", dose: "50 mg", ativo: true,
    paciente: { id: 10, nome: "Maria" },
    horarios: [{ id: 100, hora: "08:00", dias_semana: "0123456", ativo: true }],
  };
  const joao: MedicamentoComHorarios = {
    id: 2, nome: "Metformina", dose: "500 mg", ativo: true,
    paciente: { id: 20, nome: "João" },
    horarios: [{ id: 200, hora: "08:00", dias_semana: "0123456", ativo: true }],
  };

  it("dosesDoDia traz paciente e ordena por hora, depois paciente", () => {
    const doses = dosesDoDia([maria, joao], [], { data: HOJE, hora: "07:00" });
    expect(doses.map((d) => d.paciente)).toEqual(["João", "Maria"]);
    expect(doses[0]).toMatchObject({ paciente_id: 20, paciente: "João", medicamento: "Metformina", status: "pendente" });
  });

  it("historico e aderencia carregam o paciente", () => {
    const registros = [{ horario_id: 100, data: HOJE, tomado_em: `${HOJE}T11:00:00Z` }];
    const h = historico([maria, joao], registros, HOJE, HOJE, { data: HOJE, hora: "10:00" });
    expect(h.map((l) => [l.paciente, l.status])).toEqual([["João", "nao_tomada"], ["Maria", "tomada"]]);
    const a = aderencia([maria, joao], registros, HOJE, HOJE, { data: HOJE, hora: "10:00" });
    expect(a.map((x) => [x.paciente, x.percentual])).toEqual([["João", 0], ["Maria", 100]]);
  });
});
