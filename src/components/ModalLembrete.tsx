"use client";

import { useEffect, useRef } from "react";
import type { DoseDoDia } from "@/lib/servicos";

interface Props {
  doses: DoseDoDia[];
  enviando: number | null;
  aoTomar: (dose: DoseDoDia) => void;
  aoFechar: () => void;
}

/**
 * RF08 / RNF01 — janela modal do lembrete: role="alertdialog", foco vai para o
 * primeiro botão "Tomei" ao abrir e volta ao elemento anterior ao fechar; Esc fecha;
 * Tab fica preso dentro da janela.
 */
export function ModalLembrete({ doses, enviando, aoTomar, aoFechar }: Props) {
  const caixa = useRef<HTMLDivElement>(null);
  const primeiroBotao = useRef<HTMLButtonElement>(null);
  const focoAnterior = useRef<Element | null>(null);

  useEffect(() => {
    focoAnterior.current = document.activeElement;
    primeiroBotao.current?.focus();
    return () => {
      if (focoAnterior.current instanceof HTMLElement) focoAnterior.current.focus();
    };
  }, []);

  function aoTeclar(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      aoFechar();
      return;
    }
    if (e.key === "Tab" && caixa.current) {
      const focaveis = caixa.current.querySelectorAll<HTMLElement>("button:not([disabled])");
      if (focaveis.length === 0) return;
      const primeiro = focaveis[0];
      const ultimo = focaveis[focaveis.length - 1];
      if (e.shiftKey && document.activeElement === primeiro) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primeiro.focus();
      }
    }
  }

  const pendentes = doses.filter((d) => d.status !== "tomada");

  return (
    <div className="modal-fundo" onKeyDown={aoTeclar}>
      <div
        ref={caixa}
        className="modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="modal-titulo"
        aria-describedby="modal-descricao"
      >
        <h2 id="modal-titulo">Hora do medicamento</h2>
        <p id="modal-descricao">
          {pendentes.length === 0
            ? "Todas as doses deste lembrete foram registradas."
            : pendentes.length === 1
              ? "Uma dose chegou ao horário."
              : `${pendentes.length} doses chegaram ao horário.`}
        </p>
        <ul className="modal-doses">
          {doses.map((d, i) => (
            <li key={d.horario_id} className={`modal-dose ${d.status === "tomada" ? "modal-dose-tomada" : ""}`}>
              <div>
                <p className="dose-paciente">{d.paciente}</p>
                <p className="dose-medicamento">
                  <span className="hora">{d.hora}</span> — <strong>{d.medicamento}</strong>, {d.dose}
                </p>
                {d.observacao && <p className="texto-suave">{d.observacao}</p>}
              </div>
              {d.status === "tomada" ? (
                <span className="status status-tomada">Tomada</span>
              ) : (
                <button
                  ref={i === doses.findIndex((x) => x.status !== "tomada") ? primeiroBotao : undefined}
                  type="button"
                  className="botao botao-grande"
                  onClick={() => aoTomar(d)}
                  disabled={enviando === d.horario_id}
                  aria-label={`Tomei: ${d.medicamento} das ${d.hora}${d.paciente ? `, ${d.paciente}` : ""}`}
                >
                  {enviando === d.horario_id ? "Registrando…" : "Tomei ✓"}
                </button>
              )}
            </li>
          ))}
        </ul>
        <div className="acoes-linha">
          <button
            ref={pendentes.length === 0 ? primeiroBotao : undefined}
            type="button"
            className="botao botao-secundario"
            onClick={aoFechar}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
