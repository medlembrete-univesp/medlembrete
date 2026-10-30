"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { horaLocalDe, type DoseDoDia, type StatusDose } from "@/lib/servicos";

const ROTULO_STATUS: Record<StatusDose, string> = {
  pendente: "Pendente",
  tomada: "Tomada",
  atrasada: "Atrasada",
};

/** Intervalo em que a lista é recarregada para atualizar os status (RF08: 30 s). */
export const INTERVALO_ATUALIZACAO_MS = 30_000;

interface Props {
  dosesIniciais: DoseDoDia[];
  data: string;
  pacienteId: number | null;
}

/**
 * RF06/RF07 — lista das doses de hoje com o botão "Tomei ✓". O clique chama
 * POST /api/doses e atualiza o item sem recarregar a página.
 */
export function DosesDoDia({ dosesIniciais, data, pacienteId }: Props) {
  const [doses, setDoses] = useState<DoseDoDia[]>(dosesIniciais);
  const [enviando, setEnviando] = useState<number | null>(null);
  const [aviso, setAviso] = useState<{ tipo: "sucesso" | "erro"; texto: string } | null>(null);
  const [atualizadoEm, setAtualizadoEm] = useState<string | null>(null);
  const montado = useRef(true);

  const recarregar = useCallback(async () => {
    try {
      const url = pacienteId ? `/api/doses/hoje?paciente=${pacienteId}` : "/api/doses/hoje";
      const r = await fetch(url, { cache: "no-store" });
      if (!r.ok) return;
      const corpo = (await r.json()) as { data: string; hora: string; doses: DoseDoDia[] };
      if (!montado.current) return;
      if (corpo.data !== data) {
        // Virou o dia (horário de Brasília): recarrega a página inteira.
        window.location.reload();
        return;
      }
      setDoses(corpo.doses);
      setAtualizadoEm(corpo.hora);
    } catch {
      // Sem rede: mantém a lista atual; a próxima tentativa acontece no intervalo seguinte.
    }
  }, [data, pacienteId]);

  useEffect(() => {
    montado.current = true;
    const id = window.setInterval(recarregar, INTERVALO_ATUALIZACAO_MS);
    return () => {
      montado.current = false;
      window.clearInterval(id);
    };
  }, [recarregar]);

  async function tomei(dose: DoseDoDia) {
    setEnviando(dose.horario_id);
    setAviso(null);
    try {
      const r = await fetch("/api/doses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ horario_id: dose.horario_id, data }),
      });
      if (!r.ok) {
        const corpo = (await r.json().catch(() => ({}))) as { erro?: string };
        setAviso({ tipo: "erro", texto: corpo.erro ?? "Não foi possível registrar. Tente de novo." });
        return;
      }
      const registro = (await r.json()) as { tomado_em: string };
      setDoses((atual) =>
        atual.map((d) =>
          d.horario_id === dose.horario_id ? { ...d, status: "tomada", tomado_em: registro.tomado_em } : d,
        ),
      );
      setAviso({
        tipo: "sucesso",
        texto: `${dose.medicamento} de ${dose.paciente ?? "paciente"} registrado às ${horaLocalDe(registro.tomado_em)}.`,
      });
    } catch {
      setAviso({ tipo: "erro", texto: "Sem conexão. Verifique a internet e tente de novo." });
    } finally {
      setEnviando(null);
    }
  }

  const pendentes = doses.filter((d) => d.status !== "tomada").length;

  return (
    <section aria-labelledby="titulo-doses">
      <h2 id="titulo-doses" className="visualmente-oculto">
        Doses de hoje
      </h2>

      <p className="texto-suave" role="status">
        {doses.length === 0
          ? ""
          : pendentes === 0
            ? "Todas as doses de hoje foram registradas."
            : `${pendentes} ${pendentes === 1 ? "dose pendente" : "doses pendentes"} de ${doses.length}.`}
        {atualizadoEm ? ` Atualizado às ${atualizadoEm}.` : ""}
      </p>

      <div aria-live="polite" aria-atomic="true">
        {aviso && <p className={`mensagem mensagem-${aviso.tipo}`}>{aviso.texto}</p>}
      </div>

      {doses.length === 0 ? (
        <div className="cartao">
          <p>Nenhuma dose programada para hoje.</p>
        </div>
      ) : (
        <ul className="lista-doses" aria-label="Doses de hoje">
          {doses.map((d) => (
            <li key={d.horario_id} className={`cartao dose dose-${d.status}`}>
              <div className="dose-hora">
                <span className="hora">{d.hora}</span>
                <span className={`status status-${d.status}`}>
                  {ROTULO_STATUS[d.status]}
                  {d.status === "tomada" && d.tomado_em ? ` às ${horaLocalDe(d.tomado_em)}` : ""}
                </span>
              </div>
              <div className="dose-info">
                {d.paciente && <p className="dose-paciente">{d.paciente}</p>}
                <p className="dose-medicamento">
                  <strong>{d.medicamento}</strong> — {d.dose}
                </p>
                {d.observacao && <p className="texto-suave">{d.observacao}</p>}
              </div>
              <div className="dose-acao">
                {d.status !== "tomada" && (
                  <button
                    type="button"
                    className="botao botao-grande"
                    onClick={() => tomei(d)}
                    disabled={enviando === d.horario_id}
                    aria-label={`Tomei: ${d.medicamento} das ${d.hora}${d.paciente ? `, ${d.paciente}` : ""}`}
                  >
                    {enviando === d.horario_id ? "Registrando…" : "Tomei ✓"}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
