"use client";

import { Contrast } from "lucide-react";
import { useSyncExternalStore } from "react";

export const CHAVE_TEMA = "medlembrete:tema";

// O "estado" do tema vive no <html data-theme>; este store só avisa o React quando muda.
const ouvintes = new Set<() => void>();

function inscrever(avisar: () => void) {
  ouvintes.add(avisar);
  return () => {
    ouvintes.delete(avisar);
  };
}

function lerAtivo(): boolean {
  return document.documentElement.dataset.theme === "hc";
}

function lerNoServidor(): boolean {
  return false;
}

/**
 * Alterna o tema de alto contraste (RNF01). A escolha fica em localStorage e é
 * aplicada antes da primeira pintura pelo script inline do layout.
 */
export function BotaoContraste({ className = "botao botao-secundario" }: { className?: string }) {
  const ativo = useSyncExternalStore(inscrever, lerAtivo, lerNoServidor);

  function alternar() {
    if (ativo) {
      delete document.documentElement.dataset.theme;
      localStorage.setItem(CHAVE_TEMA, "padrao");
    } else {
      document.documentElement.dataset.theme = "hc";
      localStorage.setItem(CHAVE_TEMA, "hc");
    }
    for (const avisar of ouvintes) avisar();
  }

  return (
    <button type="button" className={className} onClick={alternar} aria-pressed={ativo}>
      <Contrast size={20} strokeWidth={2} aria-hidden="true" />
      <span>Alto contraste</span>
    </button>
  );
}
