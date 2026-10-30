"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CHAVE_LEMBRETES,
  chaveDose,
  dosesParaAlertar,
  gravarAlertadas,
  lerAlertadas,
  resumoLembrete,
} from "@/lib/lembretes";
import { horaLocalDe, type DoseDoDia, type StatusDose } from "@/lib/servicos";
import { destravarSom, tocarAlerta } from "@/lib/som";
import { ModalLembrete } from "./ModalLembrete";

const ROTULO_STATUS: Record<StatusDose, string> = {
  pendente: "Pendente",
  tomada: "Tomada",
  atrasada: "Atrasada",
};

/** Intervalo em que a lista é recarregada e os lembretes são verificados (RF08: 30 s). */
export const INTERVALO_ATUALIZACAO_MS = 30_000;

interface Props {
  dosesIniciais: DoseDoDia[];
  data: string;
  horaInicial: string;
  pacienteId: number | null;
}

type EstadoLembretes = "desconhecido" | "inativo" | "ativo";

/**
 * RF06/RF07/RF08 — lista das doses de hoje com o botão "Tomei ✓" e os lembretes.
 * O clique chama POST /api/doses e atualiza o item sem recarregar a página.
 * A cada 30 s a lista é recarregada e as doses cujo horário chegou disparam o
 * lembrete (modal + som + notificação), uma vez só por dose.
 */
export function DosesDoDia({ dosesIniciais, data, horaInicial, pacienteId }: Props) {
  const [doses, setDoses] = useState<DoseDoDia[]>(dosesIniciais);
  const [horaServidor, setHoraServidor] = useState(horaInicial);
  const [enviando, setEnviando] = useState<number | null>(null);
  const [aviso, setAviso] = useState<{ tipo: "sucesso" | "erro"; texto: string } | null>(null);
  const [atualizadoEm, setAtualizadoEm] = useState<string | null>(null);
  const [lembretes, setLembretes] = useState<EstadoLembretes>("desconhecido");
  const [notificacao, setNotificacao] = useState<"indisponivel" | "pedir" | "granted" | "denied">("pedir");
  const [modal, setModal] = useState<number[] | null>(null); // horario_ids no lembrete aberto
  const [anuncio, setAnuncio] = useState("");
  const alertadas = useRef<Set<string>>(new Set());
  const montado = useRef(true);

  // Preferências guardadas no navegador (só no cliente, depois da hidratação).
  useEffect(() => {
    alertadas.current = lerAlertadas(window.sessionStorage, data);
    const guardado = window.localStorage.getItem(CHAVE_LEMBRETES);
    // setState em effect é intencional aqui: lê armazenamento do navegador, indisponível no servidor.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLembretes(guardado === "ativo" ? "ativo" : "inativo");
    if (!("Notification" in window)) setNotificacao("indisponivel");
    else if (Notification.permission === "granted") setNotificacao("granted");
    else if (Notification.permission === "denied") setNotificacao("denied");
  }, [data]);

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
      setHoraServidor(corpo.hora);
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

  // RF08 — verificação dos lembretes sempre que a lista ou a hora do servidor mudam.
  useEffect(() => {
    if (lembretes !== "ativo") return;
    const devidas = dosesParaAlertar(doses, data, horaServidor, alertadas.current);
    if (devidas.length === 0) return;
    for (const d of devidas) alertadas.current.add(chaveDose(data, d.horario_id));
    gravarAlertadas(window.sessionStorage, alertadas.current);

    setModal((atual) => [...(atual ?? []), ...devidas.map((d) => d.horario_id)]);
    setAnuncio(`Hora do medicamento. ${resumoLembrete(devidas)}`);
    tocarAlerta();
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        new Notification("MedLembrete — hora do medicamento", {
          body: resumoLembrete(devidas),
          tag: `medlembrete-${data}-${devidas.map((d) => d.horario_id).join("-")}`,
        });
      } catch {
        // alguns navegadores móveis só permitem notificação via Service Worker
      }
    }
  }, [doses, horaServidor, lembretes, data]);

  async function ativarLembretes() {
    const somOk = await destravarSom();
    let permissao: typeof notificacao = notificacao;
    if ("Notification" in window && Notification.permission === "default") {
      try {
        permissao = (await Notification.requestPermission()) === "granted" ? "granted" : "denied";
      } catch {
        permissao = "denied";
      }
      setNotificacao(permissao);
    }
    window.localStorage.setItem(CHAVE_LEMBRETES, "ativo");
    setLembretes("ativo");
    if (somOk) tocarAlerta();
    setAviso({
      tipo: "sucesso",
      texto: `Lembretes ativados${somOk ? " com som" : ""}${
        permissao === "granted" ? " e notificação do sistema" : ""
      }. Mantenha esta página aberta.`,
    });
  }

  function desativarLembretes() {
    window.localStorage.setItem(CHAVE_LEMBRETES, "inativo");
    setLembretes("inativo");
    setModal(null);
    setAviso({ tipo: "sucesso", texto: "Lembretes desativados." });
  }

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
  const dosesDoModal = modal ? doses.filter((d) => modal.includes(d.horario_id)) : [];

  return (
    <section aria-labelledby="titulo-doses">
      <h2 id="titulo-doses" className="visualmente-oculto">
        Doses de hoje
      </h2>

      <div className="painel-lembretes">
        {lembretes === "ativo" ? (
          <>
            <p className="texto-suave" role="status">
              Lembretes ativos enquanto esta página estiver aberta
              {notificacao === "granted" ? ", com notificação do sistema" : ""}.
            </p>
            <button type="button" className="botao botao-secundario" onClick={desativarLembretes}>
              Desativar lembretes
            </button>
          </>
        ) : lembretes === "inativo" ? (
          <>
            <p className="texto-suave">
              Ative para receber um aviso na tela, com som, quando chegar a hora de uma dose.
            </p>
            <button type="button" className="botao" onClick={ativarLembretes}>
              Ativar lembretes
            </button>
          </>
        ) : null}
        {notificacao === "denied" && lembretes === "ativo" && (
          <p className="ajuda">
            A notificação do sistema foi bloqueada no navegador; o aviso na tela e o som continuam
            funcionando.
          </p>
        )}
      </div>

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
      <div aria-live="assertive" aria-atomic="true" className="visualmente-oculto">
        {anuncio}
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

      {modal && dosesDoModal.length > 0 && (
        <ModalLembrete doses={dosesDoModal} enviando={enviando} aoTomar={tomei} aoFechar={() => setModal(null)} />
      )}
    </section>
  );
}
