"use client";

import Link from "next/link";
import { useActionState } from "react";
import { entrar, type EstadoLogin } from "./acoes";

// Fica aqui, e não em acoes.ts: arquivos "use server" só podem exportar funções.
const ESTADO_INICIAL: EstadoLogin = { erros: {}, valores: { email: "" } };

export function FormularioLogin({ proximo, aviso }: { proximo?: string; aviso?: string }) {
  const [estado, acao, pendente] = useActionState(entrar, ESTADO_INICIAL);

  return (
    <form action={acao} className="formulario" noValidate>
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

      <div className="campo">
        <label htmlFor="email">E-mail</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={estado.valores.email}
          aria-invalid={estado.erros.email ? true : undefined}
          aria-describedby={estado.erros.email ? "erro-email" : undefined}
        />
        {estado.erros.email && (
          <p id="erro-email" className="erro-campo" role="alert">
            {estado.erros.email}
          </p>
        )}
      </div>

      <div className="campo">
        <label htmlFor="senha">Senha</label>
        <input
          id="senha"
          name="senha"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={estado.erros.senha ? true : undefined}
          aria-describedby={estado.erros.senha ? "erro-senha" : undefined}
        />
        {estado.erros.senha && (
          <p id="erro-senha" className="erro-campo" role="alert">
            {estado.erros.senha}
          </p>
        )}
      </div>

      <button type="submit" className="botao botao-grande" disabled={pendente}>
        {pendente ? "Entrando…" : "Entrar"}
      </button>

      <p style={{ marginTop: "1.5rem" }}>
        Ainda não tem conta? <Link href="/cadastro">Cadastre-se</Link>.
      </p>
    </form>
  );
}
