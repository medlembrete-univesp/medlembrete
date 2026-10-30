import { describe, expect, it } from "vitest";
import {
  CHAVE_ALERTADAS,
  chaveDose,
  dosesParaAlertar,
  gravarAlertadas,
  lerAlertadas,
  resumoLembrete,
} from "@/lib/lembretes";
import type { DoseDoDia } from "@/lib/servicos";

const HOJE = "2026-10-29";
function dose(parcial: Partial<DoseDoDia> & { horario_id: number; hora: string }): DoseDoDia {
  return {
    paciente_id: 1,
    paciente: "Maria",
    medicamento_id: 1,
    medicamento: "Losartana",
    dose: "50 mg",
    observacao: null,
    status: "pendente",
    tomado_em: null,
    ...parcial,
  };
}

describe("dosesParaAlertar (RF08)", () => {
  const doses = [
    dose({ horario_id: 1, hora: "08:00" }),
    dose({ horario_id: 2, hora: "08:30", status: "atrasada" }),
    dose({ horario_id: 3, hora: "09:00", status: "tomada", tomado_em: "x" }),
    dose({ horario_id: 4, hora: "10:00" }),
  ];

  it("dispara para pendentes e atrasadas cujo horário chegou, nunca para tomadas ou futuras", () => {
    const r = dosesParaAlertar(doses, HOJE, "09:30", new Set());
    expect(r.map((d) => d.horario_id)).toEqual([1, 2]);
  });

  it("dispara no minuto exato e não antes", () => {
    expect(dosesParaAlertar(doses, HOJE, "07:59", new Set())).toHaveLength(0);
    expect(dosesParaAlertar(doses, HOJE, "08:00", new Set()).map((d) => d.horario_id)).toEqual([1]);
  });

  it("cada dose dispara uma vez só", () => {
    const ja = new Set([chaveDose(HOJE, 1)]);
    expect(dosesParaAlertar(doses, HOJE, "09:30", ja).map((d) => d.horario_id)).toEqual([2]);
  });
});

describe("resumoLembrete", () => {
  it("uma dose", () => {
    expect(resumoLembrete([dose({ horario_id: 1, hora: "08:00" })])).toBe("08:00: Maria — Losartana, 50 mg.");
  });
  it("várias doses", () => {
    expect(
      resumoLembrete([dose({ horario_id: 1, hora: "08:00" }), dose({ horario_id: 2, hora: "08:00", paciente: "João", medicamento: "Metformina" })]),
    ).toBe("2 doses na hora: Maria — Losartana; João — Metformina.");
  });
});

describe("alertadas no sessionStorage", () => {
  function armazemFalso() {
    const mapa = new Map<string, string>();
    return { getItem: (k: string) => mapa.get(k) ?? null, setItem: (k: string, v: string) => void mapa.set(k, v) };
  }

  it("grava e lê, descartando chaves de outros dias", () => {
    const a = armazemFalso();
    gravarAlertadas(a, new Set([chaveDose(HOJE, 1), chaveDose("2026-10-28", 7)]));
    expect([...lerAlertadas(a, HOJE)]).toEqual([chaveDose(HOJE, 1)]);
  });

  it("conteúdo corrompido vira conjunto vazio", () => {
    const a = armazemFalso();
    a.setItem(CHAVE_ALERTADAS, "{nao e lista");
    expect(lerAlertadas(a, HOJE).size).toBe(0);
  });
});
