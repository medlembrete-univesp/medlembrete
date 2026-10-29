"use client";

import Link from "next/link";
import { useActionState, useId, useState } from "react";
import { SENHA_MINIMA, UFS } from "@/lib/validacao";
import { consultarCep, type ResultadoCep } from "@/lib/viacep";
import { ESTADO_CADASTRO_INICIAL, cadastrar } from "./acoes";

function Erro({ id, texto }: { id: string; texto?: string }) {
  if (!texto) return null;
  return (
    <p id={id} className="erro-campo" role="alert">
      {texto}
    </p>
  );
}

export function FormularioCadastro() {
  const [estado, acao, pendente] = useActionState(cadastrar, ESTADO_CADASTRO_INICIAL);
  const [cidade, setCidade] = useState(estado.valores.cidade);
  const [uf, setUf] = useState(estado.valores.uf);
  const [avisoCep, setAvisoCep] = useState<ResultadoCep | null>(null);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const idAvisoCep = useId();

  const nErros = Object.keys(estado.erros).length;

  /** RF02 — ao sair do campo CEP com 8 dígitos, consulta a ViaCEP. */
  async function aoSairDoCep(e: React.FocusEvent<HTMLInputElement>) {
    const cep = e.target.value.replace(/\D/g, "");
    if (cep.length !== 8) {
      setAvisoCep(null);
      return;
    }
    setBuscandoCep(true);
    const r = await consultarCep(cep);
    setBuscandoCep(false);
    setAvisoCep(r);
    if (r.ok) {
      setCidade(r.cidade);
      setUf(r.uf);
    }
  }

  const describedByCep = [estado.erros.cep ? "erro-cep" : null, "ajuda-cep", avisoCep ? idAvisoCep : null]
    .filter(Boolean)
    .join(" ");

  return (
    <form action={acao} className="formulario" noValidate>
      {estado.mensagem && (
        <p className="mensagem mensagem-erro" role="alert">
          {estado.mensagem}
        </p>
      )}
      {nErros > 0 && !estado.mensagem && (
        <p className="mensagem mensagem-erro" role="alert">
          Corrija {nErros === 1 ? "o campo indicado" : `os ${nErros} campos indicados`} abaixo.
        </p>
      )}

      <div className="campo">
        <label htmlFor="nome">Nome</label>
        <input
          id="nome"
          name="nome"
          type="text"
          autoComplete="name"
          required
          maxLength={100}
          defaultValue={estado.valores.nome}
          aria-invalid={estado.erros.nome ? true : undefined}
          aria-describedby={estado.erros.nome ? "erro-nome" : undefined}
        />
        <Erro id="erro-nome" texto={estado.erros.nome} />
      </div>

      <div className="campo">
        <label htmlFor="email">E-mail</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={120}
          defaultValue={estado.valores.email}
          aria-invalid={estado.erros.email ? true : undefined}
          aria-describedby={estado.erros.email ? "erro-email" : undefined}
        />
        <Erro id="erro-email" texto={estado.erros.email} />
      </div>

      <div className="campo">
        <label htmlFor="senha">Senha</label>
        <input
          id="senha"
          name="senha"
          type="password"
          autoComplete="new-password"
          required
          minLength={SENHA_MINIMA}
          aria-invalid={estado.erros.senha ? true : undefined}
          aria-describedby={estado.erros.senha ? "erro-senha ajuda-senha" : "ajuda-senha"}
        />
        <p id="ajuda-senha" className="ajuda">
          Mínimo de {SENHA_MINIMA} caracteres.
        </p>
        <Erro id="erro-senha" texto={estado.erros.senha} />
      </div>

      <div className="campo">
        <label htmlFor="confirmacao">Confirmação de senha</label>
        <input
          id="confirmacao"
          name="confirmacao"
          type="password"
          autoComplete="new-password"
          required
          aria-invalid={estado.erros.confirmacao ? true : undefined}
          aria-describedby={estado.erros.confirmacao ? "erro-confirmacao" : undefined}
        />
        <Erro id="erro-confirmacao" texto={estado.erros.confirmacao} />
      </div>

      <div className="campo">
        <label htmlFor="cep">CEP (opcional)</label>
        <input
          id="cep"
          name="cep"
          type="text"
          inputMode="numeric"
          autoComplete="postal-code"
          maxLength={9}
          placeholder="00000000"
          defaultValue={estado.valores.cep}
          onBlur={aoSairDoCep}
          aria-invalid={estado.erros.cep ? true : undefined}
          aria-describedby={describedByCep}
        />
        <p id="ajuda-cep" className="ajuda">
          Só números. Cidade e UF são preenchidos automaticamente.
        </p>
        <Erro id="erro-cep" texto={estado.erros.cep} />
        <p id={idAvisoCep} className={avisoCep && !avisoCep.ok ? "erro-campo" : "ajuda"} role="status">
          {buscandoCep
            ? "Consultando o CEP…"
            : avisoCep
              ? avisoCep.ok
                ? `Endereço encontrado: ${avisoCep.cidade}/${avisoCep.uf}.`
                : avisoCep.mensagem
              : ""}
        </p>
      </div>

      <div className="linha-campos">
        <div className="campo">
          <label htmlFor="cidade">Cidade (opcional)</label>
          <input
            id="cidade"
            name="cidade"
            type="text"
            autoComplete="address-level2"
            maxLength={100}
            value={cidade}
            onChange={(e) => setCidade(e.target.value)}
            aria-invalid={estado.erros.cidade ? true : undefined}
            aria-describedby={estado.erros.cidade ? "erro-cidade" : undefined}
          />
          <Erro id="erro-cidade" texto={estado.erros.cidade} />
        </div>
        <div className="campo">
          <label htmlFor="uf">UF (opcional)</label>
          <select
            id="uf"
            name="uf"
            autoComplete="address-level1"
            value={uf}
            onChange={(e) => setUf(e.target.value)}
            aria-invalid={estado.erros.uf ? true : undefined}
            aria-describedby={estado.erros.uf ? "erro-uf" : undefined}
          >
            <option value="">—</option>
            {UFS.map((sigla) => (
              <option key={sigla} value={sigla}>
                {sigla}
              </option>
            ))}
          </select>
          <Erro id="erro-uf" texto={estado.erros.uf} />
        </div>
      </div>

      <button type="submit" className="botao botao-grande" disabled={pendente}>
        {pendente ? "Criando conta…" : "Criar conta"}
      </button>

      <p style={{ marginTop: "1.5rem" }}>
        Já tem conta? <Link href="/login">Entrar</Link>.
      </p>
    </form>
  );
}
