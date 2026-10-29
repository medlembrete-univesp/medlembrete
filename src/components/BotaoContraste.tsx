"use client";

import { useSyncExternalStore } from "react";

export const CHAVE_TEMA = "medlembrete-tema";

// O "estado" do tema vive no <html data-tema>; este store só avisa o React quando muda.
const ouvintes = new Set<() => void>();

function inscrever(avisar: () => void) {
  ouvintes.add(avisar);
  return () => {
    ouvintes.delete(avisar);
  };
}

function lerAtivo(): boolean {
  return document.documentElement.dataset.tema === "contraste";
}

function lerNoServidor(): boolean {
  return false;
}

/**
 * Alterna o tema de alto contraste (RNF01). A escolha fica em localStorage e é
 * aplicada antes da primeira pintura pelo script inline do layout.
 */
export function BotaoContraste() {
  const ativo = useSyncExternalStore(inscrever, lerAtivo, lerNoServidor);

  function alternar() {
    if (ativo) {
      delete document.documentElement.dataset.tema;
      localStorage.setItem(CHAVE_TEMA, "padrao");
    } else {
      document.documentElement.dataset.tema = "contraste";
      localStorage.setItem(CHAVE_TEMA, "contraste");
    }
    for (const avisar of ouvintes) avisar();
  }

  return (
    <button
      type="button"
      className="botao botao-secundario"
      onClick={alternar}
      aria-pressed={ativo}
    >
      Alto contraste
    </button>
  );
}
