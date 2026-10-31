import type { Metadata, Viewport } from "next";
import { Figtree } from "next/font/google";
import type { ReactNode } from "react";
import { CHAVE_TEMA } from "@/components/BotaoContraste";
import "./tokens.css";
import "./globals.css";

const figtree = Figtree({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-figtree",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "MedLembrete", template: "%s — MedLembrete" },
  description: "Gestor de medicamentos acessível para quem cuida de alguém: lembretes, registro de doses e aderência.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b6e6a",
};

// Aplica o tema salvo antes da primeira pintura, para não piscar.
const scriptTema = `try{if(localStorage.getItem(${JSON.stringify(CHAVE_TEMA)})==="hc"){document.documentElement.dataset.theme="hc"}}catch(e){}`;

export default function LayoutRaiz({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={figtree.variable}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: scriptTema }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
