/**
 * Fuso horário único do sistema (RNF03). O servidor roda em UTC; todo "hoje",
 * "agora" e "dia da semana" passa por aqui.
 */
export const FUSO = "America/Sao_Paulo";

/** Instante atual já convertido para o horário de Brasília. */
export interface Agora {
  /** Data local no formato AAAA-MM-DD */
  data: string;
  /** Hora local no formato HH:MM */
  hora: string;
  /** 0 = segunda ... 6 = domingo (igual ao date.weekday() do Python) */
  diaSemana: number;
  /** Minutos desde a meia-noite local */
  minutos: number;
  /** Instante original (UTC), para gravar tomado_em */
  instante: Date;
}

const formatador = new Intl.DateTimeFormat("en-CA", {
  timeZone: FUSO,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/**
 * Única fonte de data e hora do sistema. Aceita um instante para os testes.
 */
export function agora(instante: Date = new Date()): Agora {
  const partes: Record<string, string> = {};
  for (const p of formatador.formatToParts(instante)) {
    if (p.type !== "literal") partes[p.type] = p.value;
  }
  const data = `${partes.year}-${partes.month}-${partes.day}`;
  const hora = `${partes.hour}:${partes.minute}`;
  return {
    data,
    hora,
    diaSemana: diaSemanaDe(data),
    minutos: minutosDe(hora),
    instante,
  };
}

/** Dia da semana de uma data AAAA-MM-DD: 0 = segunda ... 6 = domingo. */
export function diaSemanaDe(data: string): number {
  const [a, m, d] = data.split("-").map(Number);
  const jsDia = new Date(Date.UTC(a, m - 1, d)).getUTCDay(); // 0 = domingo
  return (jsDia + 6) % 7;
}

/** Soma (ou subtrai) dias a uma data AAAA-MM-DD, sem efeito de fuso. */
export function somarDias(data: string, dias: number): string {
  const [a, m, d] = data.split("-").map(Number);
  const dt = new Date(Date.UTC(a, m - 1, d + dias));
  return dt.toISOString().slice(0, 10);
}

/** Converte HH:MM em minutos desde a meia-noite. */
export function minutosDe(hora: string): number {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

/** Lista as datas de inicio a fim (inclusive), em ordem crescente. */
export function intervaloDeDatas(inicio: string, fim: string): string[] {
  const datas: string[] = [];
  let atual = inicio;
  while (atual <= fim) {
    datas.push(atual);
    atual = somarDias(atual, 1);
  }
  return datas;
}

/** Valida AAAA-MM-DD de forma estrita (rejeita 2026-02-30). */
export function dataValida(texto: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return false;
  const [a, m, d] = texto.split("-").map(Number);
  const dt = new Date(Date.UTC(a, m - 1, d));
  return dt.getUTCFullYear() === a && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

/** Valida HH:MM (00:00 a 23:59). */
export function horaValida(texto: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(texto);
}

const formatadorHora = new Intl.DateTimeFormat("pt-BR", {
  timeZone: FUSO,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** HH:MM local de um instante ISO (ex.: tomado_em). */
export function horaLocalDe(iso: string | Date): string {
  return formatadorHora.format(typeof iso === "string" ? new Date(iso) : iso);
}

/** AAAA-MM-DD → DD/MM/AAAA, sem passar por Date. */
export function dataBR(data: string): string {
  const [a, m, d] = data.split("-");
  return `${d}/${m}/${a}`;
}

export const NOMES_DIAS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"] as const;
export const NOMES_DIAS_LONGOS = [
  "segunda-feira",
  "terça-feira",
  "quarta-feira",
  "quinta-feira",
  "sexta-feira",
  "sábado",
  "domingo",
] as const;
