import { describe, expect, it } from "vitest";
import {
  ATRASO_MINUTOS,
  aderencia,
  agora,
  dataValida,
  diaSemanaDe,
  dosesDoDia,
  historico,
  horaValida,
  intervaloDeDatas,
  somarDias,
  type MedicamentoComHorarios,
  type RegistroDose,
} from "@/lib/servicos";

// 2026-10-26 é segunda-feira; 2026-10-27, terça.
const SEGUNDA = "2026-10-26";
const TERCA = "2026-10-27";

const losartana: MedicamentoComHorarios = {
  id: 1,
  nome: "Losartana",
  dose: "1 comprimido 50 mg",
  ativo: true,
  horarios: [
    { id: 10, hora: "08:00", dias_semana: "0123456", ativo: true },
    { id: 11, hora: "20:00", dias_semana: "0", ativo: true }, // só segunda
    { id: 12, hora: "12:00", dias_semana: "0123456", ativo: false }, // desativado
  ],
};

const metformina: MedicamentoComHorarios = {
  id: 2,
  nome: "Metformina",
  dose: "500 mg",
  ativo: true,
  horarios: [{ id: 20, hora: "07:30", dias_semana: "1", ativo: true }], // só terça
};

const excluido: MedicamentoComHorarios = {
  id: 3,
  nome: "Antigo",
  dose: "1 gota",
  ativo: false,
  horarios: [{ id: 30, hora: "09:00", dias_semana: "0123456", ativo: true }],
};

describe("agora() e utilitários de data (RNF03)", () => {
  it("converte UTC para o horário de Brasília", () => {
    // 02:30 UTC de 27/10 ainda é 23:30 de 26/10 em São Paulo (UTC-3)
    const a = agora(new Date("2026-10-27T02:30:00Z"));
    expect(a.data).toBe("2026-10-26");
    expect(a.hora).toBe("23:30");
    expect(a.diaSemana).toBe(0); // segunda
    expect(a.minutos).toBe(23 * 60 + 30);
  });

  it("diaSemanaDe usa 0 = segunda, 6 = domingo", () => {
    expect(diaSemanaDe("2026-10-26")).toBe(0);
    expect(diaSemanaDe("2026-11-01")).toBe(6);
  });

  it("somarDias e intervaloDeDatas atravessam o mês", () => {
    expect(somarDias("2026-10-30", 2)).toBe("2026-11-01");
    expect(somarDias("2026-11-01", -7)).toBe("2026-10-25");
    expect(intervaloDeDatas("2026-10-30", "2026-11-01")).toEqual([
      "2026-10-30",
      "2026-10-31",
      "2026-11-01",
    ]);
  });

  it("valida datas e horas de forma estrita", () => {
    expect(dataValida("2026-02-30")).toBe(false);
    expect(dataValida("2026-02-28")).toBe(true);
    expect(horaValida("24:00")).toBe(false);
    expect(horaValida("23:59")).toBe(true);
    expect(horaValida("8:00")).toBe(false);
  });
});

describe("dosesDoDia (RF06)", () => {
  it("numa segunda traz só horários com dia 0, em ordem de hora", () => {
    const doses = dosesDoDia([losartana, metformina, excluido], [], {
      data: SEGUNDA,
      hora: "06:00",
    });
    expect(doses.map((d) => d.horario_id)).toEqual([10, 11]);
    expect(doses.map((d) => d.hora)).toEqual(["08:00", "20:00"]);
    expect(doses.every((d) => d.status === "pendente")).toBe(true);
  });

  it("numa terça traz os horários com dia 1 e ignora medicamento excluído", () => {
    const doses = dosesDoDia([losartana, metformina, excluido], [], {
      data: TERCA,
      hora: "06:00",
    });
    expect(doses.map((d) => d.horario_id)).toEqual([20, 10]);
  });

  it("dose sem registro 61 min após o horário fica atrasada; 60 min ainda é pendente", () => {
    const [as0901] = dosesDoDia([losartana], [], { data: SEGUNDA, hora: "09:01" });
    expect(as0901.status).toBe("atrasada");
    const [as0900] = dosesDoDia([losartana], [], { data: SEGUNDA, hora: "09:00" });
    expect(as0900.status).toBe("pendente");
    expect(ATRASO_MINUTOS).toBe(60);
  });

  it("dose com registro fica tomada e traz tomado_em", () => {
    const registros: RegistroDose[] = [
      { horario_id: 10, data: SEGUNDA, tomado_em: "2026-10-26T11:05:00Z" },
    ];
    const doses = dosesDoDia([losartana], registros, { data: SEGUNDA, hora: "23:00" });
    expect(doses[0]).toMatchObject({ status: "tomada", tomado_em: "2026-10-26T11:05:00Z" });
    expect(doses[1].status).toBe("atrasada");
  });

  it("devolve o formato esperado pela API", () => {
    const [d] = dosesDoDia([losartana], [], { data: SEGUNDA, hora: "07:00" });
    expect(d).toEqual({
      horario_id: 10,
      hora: "08:00",
      paciente_id: null,
      paciente: null,
      medicamento_id: 1,
      medicamento: "Losartana",
      dose: "1 comprimido 50 mg",
      observacao: null,
      status: "pendente",
      tomado_em: null,
    });
  });
});

describe("historico (RF09)", () => {
  it("marca doses programadas sem registro como nao_tomada e não lista o futuro", () => {
    const linhas = historico([losartana], [], SEGUNDA, TERCA, { data: TERCA, hora: "09:30" });
    // terça 08:00 (passou 90 min), segunda 20:00 e segunda 08:00
    expect(linhas.map((l) => [l.data, l.hora, l.status])).toEqual([
      [TERCA, "08:00", "nao_tomada"],
      [SEGUNDA, "08:00", "nao_tomada"],
      [SEGUNDA, "20:00", "nao_tomada"],
    ]);
  });

  it("mantém registros de horário desativado como tomada", () => {
    const registros: RegistroDose[] = [
      { horario_id: 12, data: SEGUNDA, tomado_em: "2026-10-26T15:00:00Z" },
    ];
    const linhas = historico([losartana], registros, SEGUNDA, SEGUNDA, {
      data: TERCA,
      hora: "09:30",
    });
    const linha12 = linhas.find((l) => l.horario_id === 12);
    expect(linha12).toMatchObject({ hora: "12:00", status: "tomada" });
  });

  it("dose de hoje dentro da janela de 60 min aparece como pendente", () => {
    const linhas = historico([losartana], [], SEGUNDA, SEGUNDA, { data: SEGUNDA, hora: "08:30" });
    expect(linhas).toHaveLength(1);
    expect(linhas[0].status).toBe("pendente");
  });
});

describe("aderencia (RF10)", () => {
  it("3 tomadas de 4 programadas = 75%", () => {
    // Losartana 08:00 todos os dias; de seg a qui = 4 doses (20:00 só na segunda: desativar para o teste)
    const soManha: MedicamentoComHorarios = {
      ...losartana,
      horarios: [losartana.horarios[0]],
    };
    const registros: RegistroDose[] = ["2026-10-26", "2026-10-27", "2026-10-28"].map((data) => ({
      horario_id: 10,
      data,
      tomado_em: `${data}T11:00:00Z`,
    }));
    const [a] = aderencia([soManha], registros, "2026-10-26", "2026-10-29", {
      data: "2026-10-29",
      hora: "23:00",
    });
    expect(a).toEqual({
      paciente_id: null,
      paciente: null,
      medicamento_id: 1,
      medicamento: "Losartana",
      programadas: 4,
      tomadas: 3,
      percentual: 75,
    });
  });

  it("sem doses programadas não divide por zero", () => {
    const [a] = aderencia([metformina], [], SEGUNDA, SEGUNDA, { data: SEGUNDA, hora: "23:00" });
    expect(a).toMatchObject({ programadas: 0, tomadas: 0, percentual: 0 });
    expect(Number.isFinite(a.percentual)).toBe(true);
  });

  it("só conta doses cujo horário já chegou", () => {
    const [a] = aderencia([losartana], [], SEGUNDA, SEGUNDA, { data: SEGUNDA, hora: "10:00" });
    expect(a.programadas).toBe(1); // 08:00 passou; 20:00 ainda não
  });

  it("ignora medicamentos excluídos", () => {
    const lista = aderencia([losartana, excluido], [], SEGUNDA, SEGUNDA, {
      data: SEGUNDA,
      hora: "23:00",
    });
    expect(lista.map((a) => a.medicamento)).toEqual(["Losartana"]);
  });
});
