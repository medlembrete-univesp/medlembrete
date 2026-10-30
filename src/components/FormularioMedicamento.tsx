"use client";

import Link from "next/link";
import { useActionState, useId, useState } from "react";
import { NOMES_DIAS, NOMES_DIAS_LONGOS } from "@/lib/servicos";
import type { Erros } from "@/lib/validacao";
import { MAX_HORARIOS, type CampoMedicamento, type DadosMedicamento } from "@/lib/validacao-medicamento";

export interface EstadoMedicamento {
  erros: Erros<CampoMedicamento>;
  errosHorarios: (string | undefined)[];
  mensagem?: string;
  valores: DadosMedicamento;
}

export type AcaoMedicamento = (anterior: EstadoMedicamento, fd: FormData) => Promise<EstadoMedicamento>;

interface LinhaHorario {
  chave: number;
  hora: string;
  dias: boolean[];
}

function Erro({ id, texto }: { id: string; texto?: string }) {
  if (!texto) return null;
  return (
    <p id={id} className="erro-campo" role="alert">
      {texto}
    </p>
  );
}

function paraLinhas(valores: DadosMedicamento): LinhaHorario[] {
  if (valores.horarios.length === 0) return [novaLinha(0)];
  return valores.horarios.map((h, i) => ({
    chave: i,
    hora: h.hora,
    dias: Array.from({ length: 7 }, (_, d) => h.dias_semana.includes(String(d))),
  }));
}

function novaLinha(chave: number): LinhaHorario {
  return { chave, hora: "", dias: [true, true, true, true, true, true, true] };
}

export function FormularioMedicamento({
  acao,
  inicial,
  textoBotao,
  voltarPara,
}: {
  acao: AcaoMedicamento;
  inicial: DadosMedicamento;
  textoBotao: string;
  voltarPara: string;
}) {
  const [estado, enviar, pendente] = useActionState(acao, {
    erros: {},
    errosHorarios: [],
    valores: inicial,
  });
  const [linhas, setLinhas] = useState<LinhaHorario[]>(() => paraLinhas(inicial));
  const [proximaChave, setProximaChave] = useState(linhas.length);
  const idGrupo = useId();
  const nErros = Object.keys(estado.erros).length;

  function adicionar() {
    if (linhas.length >= MAX_HORARIOS) return;
    setLinhas([...linhas, novaLinha(proximaChave)]);
    setProximaChave(proximaChave + 1);
  }
  function remover(i: number) {
    setLinhas(linhas.filter((_, j) => j !== i));
  }
  function mudarHora(i: number, hora: string) {
    setLinhas(linhas.map((l, j) => (j === i ? { ...l, hora } : l)));
  }
  function mudarDia(i: number, d: number, marcado: boolean) {
    setLinhas(linhas.map((l, j) => (j === i ? { ...l, dias: l.dias.map((v, k) => (k === d ? marcado : v)) } : l)));
  }
  function marcarTodos(i: number, marcado: boolean) {
    setLinhas(linhas.map((l, j) => (j === i ? { ...l, dias: l.dias.map(() => marcado) } : l)));
  }

  return (
    <form action={enviar} className="formulario formulario-largo" noValidate>
      {estado.mensagem && (
        <p className="mensagem mensagem-erro" role="alert">
          {estado.mensagem}
        </p>
      )}
      {nErros > 0 && !estado.mensagem && (
        <p className="mensagem mensagem-erro" role="alert">
          Corrija {nErros === 1 ? "o campo indicado" : `os ${nErros} campos indicados`} abaixo.
        </p>
      )}

      <div className="campo">
        <label htmlFor="nome">Nome do medicamento</label>
        <input
          id="nome"
          name="nome"
          type="text"
          required
          maxLength={120}
          autoComplete="off"
          defaultValue={estado.valores.nome}
          aria-invalid={estado.erros.nome ? true : undefined}
          aria-describedby={estado.erros.nome ? "erro-nome" : undefined}
        />
        <Erro id="erro-nome" texto={estado.erros.nome} />
      </div>

      <div className="campo">
        <label htmlFor="dose">Dose</label>
        <input
          id="dose"
          name="dose"
          type="text"
          required
          maxLength={120}
          placeholder="Ex.: 1 comprimido de 50 mg"
          autoComplete="off"
          defaultValue={estado.valores.dose}
          aria-invalid={estado.erros.dose ? true : undefined}
          aria-describedby={estado.erros.dose ? "erro-dose" : undefined}
        />
        <Erro id="erro-dose" texto={estado.erros.dose} />
      </div>

      <div className="campo">
        <label htmlFor="observacao">Observação (opcional)</label>
        <input
          id="observacao"
          name="observacao"
          type="text"
          maxLength={255}
          placeholder="Ex.: tomar com água, após o café"
          autoComplete="off"
          defaultValue={estado.valores.observacao}
          aria-invalid={estado.erros.observacao ? true : undefined}
          aria-describedby={estado.erros.observacao ? "erro-observacao" : undefined}
        />
        <Erro id="erro-observacao" texto={estado.erros.observacao} />
      </div>

      <fieldset className="campo horarios" aria-describedby={estado.erros.horarios ? "erro-horarios" : undefined}>
        <legend className="legenda">Horários e dias da semana</legend>
        <Erro id="erro-horarios" texto={estado.erros.horarios} />
        <input type="hidden" name="qtd_horarios" value={linhas.length} />

        {linhas.map((linha, i) => {
          const idHora = `${idGrupo}-hora-${linha.chave}`;
          const idErro = `${idGrupo}-erro-${linha.chave}`;
          const erro = estado.errosHorarios[i];
          const todos = linha.dias.every(Boolean);
          return (
            <fieldset key={linha.chave} className="horario-linha">
              <legend className="visualmente-oculto">Horário {i + 1}</legend>
              <div className="horario-topo">
                <div>
                  <label htmlFor={idHora}>Horário {i + 1}</label>
                  <input
                    id={idHora}
                    name={`hora_${i}`}
                    type="time"
                    required
                    step={60}
                    value={linha.hora}
                    onChange={(e) => mudarHora(i, e.target.value)}
                    aria-invalid={erro ? true : undefined}
                    aria-describedby={erro ? idErro : undefined}
                  />
                </div>
                <div className="horario-acoes">
                  <button type="button" className="botao botao-secundario" onClick={() => marcarTodos(i, !todos)}>
                    {todos ? "Desmarcar todos os dias" : "Todos os dias"}
                  </button>
                  {linhas.length > 1 && (
                    <button
                      type="button"
                      className="botao botao-secundario"
                      onClick={() => remover(i)}
                      aria-label={`Remover horário ${i + 1}`}
                    >
                      Remover
                    </button>
                  )}
                </div>
              </div>
              <div className="dias" role="group" aria-label={`Dias da semana do horário ${i + 1}`}>
                {NOMES_DIAS.map((nome, d) => {
                  const idDia = `${idGrupo}-dia-${linha.chave}-${d}`;
                  return (
                    <label key={d} htmlFor={idDia} className={`dia ${linha.dias[d] ? "dia-marcado" : ""}`}>
                      <input
                        id={idDia}
                        type="checkbox"
                        name={`dias_${i}`}
                        value={String(d)}
                        checked={linha.dias[d]}
                        onChange={(e) => mudarDia(i, d, e.target.checked)}
                        aria-label={NOMES_DIAS_LONGOS[d]}
                      />
                      <span aria-hidden="true">{nome}</span>
                    </label>
                  );
                })}
              </div>
              <Erro id={idErro} texto={erro} />
            </fieldset>
          );
        })}

        <button
          type="button"
          className="botao botao-secundario"
          onClick={adicionar}
          disabled={linhas.length >= MAX_HORARIOS}
        >
          + Adicionar horário
        </button>
      </fieldset>

      <div className="acoes-linha">
        <button type="submit" className="botao botao-grande" disabled={pendente}>
          {pendente ? "Salvando…" : textoBotao}
        </button>
        <Link href={voltarPara} className="botao botao-secundario">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
