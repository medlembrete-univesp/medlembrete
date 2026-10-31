"use client";

import { Chart, type ChartConfiguration, type Plugin } from "chart.js/auto";
import { useEffect, useRef } from "react";
import type { Aderencia } from "@/lib/servicos";

interface Props {
  itens: Aderencia[];
  /** Mostrar o nome do paciente no rótulo (quando há mais de um paciente). */
  comPaciente: boolean;
  descricao: string;
}

/** Lê as cores do tema atual (padrão ou alto contraste) direto das variáveis CSS. */
function coresDoTema() {
  const estilo = getComputedStyle(document.documentElement);
  const ler = (nome: string, padrao: string) => estilo.getPropertyValue(nome).trim() || padrao;
  return {
    // Série única: uma cor só, a primária do tema. No alto contraste é o amarelo do
    // RNF01 (fora da faixa usual de luminosidade, de propósito: é um tema de baixa visão).
    barra: ler("--primary", "#0b7a76"),
    texto: ler("--ink", "#14302e"),
    textoSuave: ler("--muted", "#4d6563"),
    grade: ler("--line", "#d3e3e1"),
    fundo: ler("--surface", "#ffffff"),
  };
}

/** Valor em % na ponta de cada barra, em cor de texto (nunca na cor da série). */
const rotulosNaPonta: Plugin<"bar"> = {
  id: "rotulosNaPonta",
  afterDatasetsDraw(chart) {
    const { ctx } = chart;
    const meta = chart.getDatasetMeta(0);
    const cor = (chart.options.plugins as { rotulosNaPonta?: { cor?: string } } | undefined)?.rotulosNaPonta?.cor ?? "#000";
    ctx.save();
    ctx.font = "700 14px system-ui, sans-serif";
    ctx.fillStyle = cor;
    ctx.textBaseline = "middle";
    meta.data.forEach((barra, i) => {
      const valor = chart.data.datasets[0].data[i] as number;
      const x = barra.x + 6;
      const texto = `${valor}%`;
      // só desenha se couber dentro da área do gráfico
      if (x + ctx.measureText(texto).width <= chart.chartArea.right) ctx.fillText(texto, x, barra.y);
    });
    ctx.restore();
  },
};

/**
 * RF10 — gráfico de barras horizontais com a aderência (%) por medicamento.
 * A tabela logo abaixo da página é a alternativa acessível; o canvas é só imagem.
 */
export function GraficoAderencia({ itens, comPaciente, descricao }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const grafico = useRef<Chart<"bar"> | null>(null);

  useEffect(() => {
    if (!canvas.current) return;
    const rotulos = itens.map((a) => (comPaciente && a.paciente ? `${a.paciente} — ${a.medicamento}` : a.medicamento));
    const valores = itens.map((a) => a.percentual);

    function montarConfig(): ChartConfiguration<"bar"> {
      const c = coresDoTema();
      return {
        type: "bar",
        data: {
          labels: rotulos,
          datasets: [
            {
              label: "Aderência (%)",
              data: valores,
              backgroundColor: c.barra,
              borderRadius: 4,
              borderSkipped: "start",
              barThickness: 20,
              maxBarThickness: 24,
            },
          ],
        },
        options: {
          indexAxis: "y",
          responsive: true,
          maintainAspectRatio: false,
          animation: false,
          layout: { padding: { right: 48 } },
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (item) => {
                  const a = itens[item.dataIndex];
                  return ` ${a.tomadas} de ${a.programadas} doses (${a.percentual}%)`;
                },
              },
            },
            ...({ rotulosNaPonta: { cor: c.texto } } as object),
          },
          scales: {
            x: {
              min: 0,
              max: 100,
              ticks: { color: c.textoSuave, callback: (v) => `${v}%`, stepSize: 25 },
              grid: { color: c.grade, lineWidth: 1 },
              border: { display: false },
            },
            y: {
              ticks: { color: c.texto, font: { size: 14 }, autoSkip: false },
              grid: { display: false },
              border: { display: false },
            },
          },
        },
        plugins: [rotulosNaPonta],
      };
    }

    grafico.current?.destroy();
    grafico.current = new Chart(canvas.current, montarConfig());

    // Troca de tema (alto contraste) sem recarregar: refaz as cores.
    const observador = new MutationObserver(() => {
      if (!canvas.current) return;
      grafico.current?.destroy();
      grafico.current = new Chart(canvas.current, montarConfig());
    });
    observador.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    return () => {
      observador.disconnect();
      grafico.current?.destroy();
      grafico.current = null;
    };
  }, [itens, comPaciente]);

  const altura = Math.max(160, 48 * itens.length + 60);

  return (
    <div className="grafico" style={{ height: altura }}>
      <canvas ref={canvas} role="img" aria-label={descricao} />
    </div>
  );
}
