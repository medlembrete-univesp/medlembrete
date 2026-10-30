/**
 * RF08 — som curto gerado pela Web Audio API, sem arquivo de áudio.
 * O navegador só toca áudio depois de uma interação do usuário: `destravarSom()`
 * deve ser chamado no clique de "Ativar lembretes".
 */

let contexto: AudioContext | null = null;

function obterContexto(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!contexto) {
    const Ctor = window.AudioContext;
    if (!Ctor) return null;
    contexto = new Ctor();
  }
  return contexto;
}

/** Cria/retoma o AudioContext dentro de um gesto do usuário. */
export async function destravarSom(): Promise<boolean> {
  const ctx = obterContexto();
  if (!ctx) return false;
  if (ctx.state === "suspended") {
    try {
      await ctx.resume();
    } catch {
      return false;
    }
  }
  return ctx.state === "running";
}

/** Três bipes curtos e suaves (cerca de 1 s no total). */
export function tocarAlerta(): void {
  const ctx = obterContexto();
  if (!ctx || ctx.state !== "running") return;
  const inicio = ctx.currentTime;
  const notas = [880, 1100, 880];
  notas.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const ganho = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    const t = inicio + i * 0.32;
    ganho.gain.setValueAtTime(0, t);
    ganho.gain.linearRampToValueAtTime(0.25, t + 0.03);
    ganho.gain.linearRampToValueAtTime(0, t + 0.25);
    osc.connect(ganho).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.27);
  });
}
