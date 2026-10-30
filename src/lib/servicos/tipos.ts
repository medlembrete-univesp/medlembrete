/** Tipos usados pelas funções puras de serviço. Espelham as tabelas do banco. */

export interface Horario {
  id: number;
  /** HH:MM local */
  hora: string;
  /** dígitos 0..6, 0 = segunda */
  dias_semana: string;
  ativo: boolean;
}

export interface PacienteResumo {
  id: number;
  nome: string;
}

export interface MedicamentoComHorarios {
  id: number;
  nome: string;
  dose: string;
  observacao?: string | null;
  ativo: boolean;
  horarios: Horario[];
  /** Paciente dono do medicamento (ausente só em testes antigos). */
  paciente?: PacienteResumo | null;
}

export interface RegistroDose {
  horario_id: number;
  /** AAAA-MM-DD */
  data: string;
  /** ISO 8601 com fuso */
  tomado_em: string;
}

export type StatusDose = "pendente" | "tomada" | "atrasada";

export interface DoseDoDia {
  horario_id: number;
  hora: string;
  paciente_id: number | null;
  paciente: string | null;
  medicamento_id: number;
  medicamento: string;
  dose: string;
  observacao: string | null;
  status: StatusDose;
  tomado_em: string | null;
}

export type StatusHistorico = "tomada" | "nao_tomada" | "pendente";

export interface LinhaHistorico {
  data: string;
  hora: string;
  horario_id: number;
  paciente_id: number | null;
  paciente: string | null;
  medicamento_id: number;
  medicamento: string;
  dose: string;
  status: StatusHistorico;
  tomado_em: string | null;
}

export interface Aderencia {
  paciente_id: number | null;
  paciente: string | null;
  medicamento_id: number;
  medicamento: string;
  programadas: number;
  tomadas: number;
  /** 0 a 100, inteiro. 0 quando não há doses programadas. */
  percentual: number;
}
