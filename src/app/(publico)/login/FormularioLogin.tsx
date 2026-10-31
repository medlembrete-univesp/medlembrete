"use client";

import { useActionState } from "react";
import { CampoTexto } from "@/components/ui/CampoTexto";
import { entrar, type EstadoLogin } from "./acoes";

// Fica aqui, e não em acoes.ts: arquivos "use server" só podem exportar funções.
const ESTADO_INICIAL: EstadoLogin = { erros: {}, valores: { email: "" } };

export function FormularioLogin({ proximo, aviso }: { proximo?: string; aviso?: string }) {
  const [estado, acao, pendente] = useActionState(entrar, ESTADO_INICIAL);

  return (
    <form action={acao} className="formulario formulario-login" noValidate>
      <h1 className="titulo-login">Entrar</h1>
      {aviso && (
        <p className="mensagem mensagem-sucesso" role="status">
          {aviso}
        </p>
      )}
      {estado.mensagem && (
        <p className="mensagem mensagem-erro" role="alert">
          {estado.mensagem}
        </p>
      )}
      {proximo && <input type="hidden" name="proximo" value={proximo} />}

      <CampoTexto
        id="email"
        name="email"
        rotulo="E-mail"
        type="email"
        autoComplete="email"
        required
        linha
        defaultValue={estado.valores.email}
        erro={estado.erros.email}
      />
      <CampoTexto
        id="senha"
        name="senha"
        rotulo="Senha"
        type="password"
        autoComplete="current-password"
        required
        linha
        erro={estado.erros.senha}
      />

      <div className="login-acoes">
        <button type="submit" className="botao botao-pilula botao-grande" disabled={pendente}>
          {pendente ? "Entrando…" : "Entrar"}
        </button>
      </div>
    </form>
  );
}
