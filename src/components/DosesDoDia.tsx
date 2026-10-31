"use client";

import { Bell, BellOff } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  CHAVE_LEMBRETES,
  chaveDose,
  dosesParaAlertar,
  gravarAlertadas,
  lerAlertadas,
  resumoLembrete,
} from "@/lib/lembretes";
import { horaLocalDe, minutosDe, type DoseDoDia as Dose, type StatusDose } from "@/lib/servicos";
import { destravarSom, tocarAlerta } from "@/lib/som";
import { ModalLembrete } from "./ModalLembrete";
import { Cartao, CartaoCabecalho } from "./ui/Cartao";
import { Selo, type TomSelo } from "./ui/Selo";

const ROTULO_STATUS: Record<StatusDose, string> = {
  pendente: "Pendente",
  tomada: "Tomada",
  atrasada: "Atrasada",
};
const TOM_STATUS: Record<StatusDose, TomSelo> = { pendente: "neutro", tomada: "ok", atrasada: "danger" };

/** Intervalo em que a lista é recarregada e os lembretes são verificados (RF08: 30 s). */
export const INTERVALO_ATUALIZACAO_MS = 30_000;

interface Props {
  dosesIniciais: Dose[];
  data: string;
  horaInicial: string;
  pacienteId: number | null;
  /** Cartões extras da coluna da direita (ex.: pacientes), renderizados no servidor. */
  children?: ReactNode;
}

type EstadoLembretes = "desconhecido" | "inativo" | "ativo";

/** Selo de status; quando tomada, inclui a hora. */
export function SeloDose({ dose }: { dose: Dose }) {
  return (
    <Selo tom={TOM_STATUS[dose.status]}>
      {ROTULO_STATUS[dose.status]}
      {dose.status === "tomada" && dose.tomado_em ? ` às ${horaLocalDe(dose.tomado_em)}` : ""}
    </Selo>
  );
}

/**
 * RF06/RF07/RF08 — doses de hoje com o botão "Tomei ✓" e os lembretes (spec 6.3).
 * O clique chama POST /api/doses e atualiza o item sem recarregar a página.
 * A cada 30 s a lista é recarregada e as doses pendentes ou atrasadas cujo
 * horário chegou disparam o lembrete (modal + som + notificação), uma vez só.
 */
export function DosesDoDia({ dosesIniciais, data, horaInicial, pacienteId, children }: Props) {
  const [doses, setDoses] = useState<Dose[]>(dosesIniciais);
  const [horaServidor, setHoraServidor] = useState(horaInicial);
  const [enviando, setEnviando] = useState<number | null>(null);
  const [aviso, setAviso] = useState<{ tipo: "sucesso" | "erro"; texto: string } | null>(null);
  const [lembretes, setLembretes] = useState<EstadoLembretes>("desconhecido");
  const [notificacao, setNotificacao] = useState<"indisponivel" | "pedir" | "granted" | "denied">("pedir");
  const [modal, setModal] = useState<number[] | null>(null);
  const [anuncio, setAnuncio] = useState("");
  const alertadas = useRef<Set<string>>(new Set());
  const montado = useRef(true);

  useEffect(() => {
    alertadas.current = lerAlertadas(window.sessionStorage, data);
    const guardado = window.localStorage.getItem(CHAVE_LEMBRETES);
    // setState em effect é intencional: lê armazenamento do navegador, indisponível no servidor.
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
      const corpo = (await r.json()) as { data: string; hora: string; doses: Dose[] };
      if (!montado.current) return;
      if (corpo.data !== data) {
        window.location.reload();
        return;
      }
      setDoses(corpo.doses);
      setHoraServidor(corpo.hora);
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
      texto: `Lembretes ativados${somOk ? " com som" : ""}${permissao === "granted" ? " e notificação do sistema" : ""}. Mantenha esta página aberta.`,
    });
  }

  function desativarLembretes() {
    window.localStorage.setItem(CHAVE_LEMBRETES, "inativo");
    setLembretes("inativo");
    setModal(null);
    setAviso({ tipo: "sucesso", texto: "Lembretes desativados." });
  }

  async function tomei(dose: Dose) {
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
        atual.map((d) => (d.horario_id === dose.horario_id ? { ...d, status: "tomada", tomado_em: registro.tomado_em } : d)),
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
  const agoraMin = minutosDe(horaServidor);
  const proxima = doses.find((d) => d.status !== "tomada" && minutosDe(d.hora) >= agoraMin) ?? null;
  const atrasadas = doses.filter((d) => d.status === "atrasada").length;
  const dosesDoModal = modal ? doses.filter((d) => modal.includes(d.horario_id)) : [];

  return (
    <div className="grade grade-hoje">
      <Cartao as="section" className="hoje-doses" aria-labelledby="titulo-doses">
        <CartaoCabecalho titulo="Doses de hoje" id="titulo-doses">
          <span className="texto-suave hora-agora" role="status">
            Agora: <span className="hora">{horaServidor}</span>
          </span>
        </CartaoCabecalho>

        <div aria-live="polite" aria-atomic="true">
          {aviso && <p className={`mensagem mensagem-${aviso.tipo}`}>{aviso.texto}</p>}
        </div>
        <div aria-live="assertive" aria-atomic="true" className="visualmente-oculto">
          {anuncio}
        </div>

        {doses.length === 0 ? (
          <p className="texto-suave">Nenhuma dose programada para hoje.</p>
        ) : (
          <>
            <p className="texto-suave resumo-doses" role="status">
              {pendentes === 0
                ? "Todas as doses de hoje foram registradas."
                : `${pendentes} ${pendentes === 1 ? "dose pendente" : "doses pendentes"} de ${doses.length}.`}
            </p>
            <ul className="lista-doses" aria-label="Doses de hoje">
              {doses.map((d) => (
                <li key={d.horario_id} className={`dose-linha dose-${d.status}`}>
                  <span className="dose-hora hora">{d.hora}</span>
                  <div className="dose-info">
                    <p className="dose-medicamento">
                      <strong>{d.medicamento}</strong> <span className="texto-suave">· {d.dose}</span>
                    </p>
                    <p className="texto-suave dose-paciente">
                      {d.paciente}
                      {d.observacao ? ` · ${d.observacao}` : ""}
                    </p>
                  </div>
                  <div className="dose-acoes">
                    <SeloDose dose={d} />
                    {d.status !== "tomada" && (
                      <button
                        type="button"
                        className="botao"
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
          </>
        )}
      </Cartao>

      <div className="pilha hoje-lateral">
        <Cartao destaque as="section" aria-labelledby="titulo-proxima">
          <h2 id="titulo-proxima" className="cartao-destaque-titulo">
            Próxima dose
          </h2>
          {proxima ? (
            <>
              <p className="proxima-hora hora">{proxima.hora}</p>
              <p className="proxima-medicamento">
                <strong>{proxima.medicamento}</strong> · {proxima.dose}
              </p>
              {proxima.paciente && <p className="texto-suave">{proxima.paciente}</p>}
            </>
          ) : atrasadas > 0 ? (
            <p className="proxima-medicamento">
              Nenhuma dose futura hoje. {atrasadas} {atrasadas === 1 ? "dose atrasada" : "doses atrasadas"} aguardando registro.
            </p>
          ) : (
            <p className="proxima-medicamento">
              {doses.length === 0 ? "Nenhuma dose programada para hoje." : "Todas as doses de hoje foram registradas."}
            </p>
          )}
        </Cartao>

        {children}

        <Cartao as="section" aria-labelledby="titulo-lembretes" className="cartao-lembretes">
          <h2 id="titulo-lembretes">Lembretes</h2>
          {lembretes === "ativo" ? (
            <>
              <p className="texto-suave" role="status">
                Ativos enquanto esta página estiver aberta
                {notificacao === "granted" ? ", com notificação do sistema" : ""}.
              </p>
              {notificacao === "denied" && (
                <p className="ajuda">A notificação do sistema foi bloqueada no navegador; o aviso na tela e o som continuam.</p>
              )}
              <button type="button" className="botao botao-secundario" onClick={desativarLembretes}>
                <BellOff size={20} strokeWidth={2} aria-hidden="true" />
                <span>Desativar lembretes</span>
              </button>
            </>
          ) : lembretes === "inativo" ? (
            <>
              <p className="texto-suave">Ative para receber um aviso na tela, com som, quando chegar a hora de uma dose.</p>
              <button type="button" className="botao" onClick={ativarLembretes}>
                <Bell size={20} strokeWidth={2} aria-hidden="true" />
                <span>Ativar lembretes</span>
              </button>
            </>
          ) : (
            <p className="texto-suave">Os lembretes funcionam enquanto a página estiver aberta.</p>
          )}
        </Cartao>
      </div>

      {modal && dosesDoModal.length > 0 && (
        <ModalLembrete doses={dosesDoModal} enviando={enviando} aoTomar={tomei} aoFechar={() => setModal(null)} />
      )}
    </div>
  );
}
