"use client";

import { useActionState, useId, useState } from "react";
import { CampoSelecao, CampoTexto } from "@/components/ui/CampoTexto";
import { SENHA_MINIMA, UFS } from "@/lib/validacao";
import { consultarCep, type ResultadoCep } from "@/lib/viacep";
import { cadastrar, type EstadoCadastro } from "./acoes";

// Fica aqui, e não em acoes.ts: arquivos "use server" só podem exportar funções.
const ESTADO_INICIAL: EstadoCadastro = {
  erros: {},
  valores: { nome: "", email: "", cep: "", cidade: "", uf: "" },
};

export function FormularioCadastro() {
  const [estado, acao, pendente] = useActionState(cadastrar, ESTADO_INICIAL);
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

  return (
    <form action={acao} className="formulario formulario-login" noValidate>
      <h1 className="titulo-login">Criar conta</h1>
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

      <CampoTexto id="nome" name="nome" rotulo="Nome" type="text" autoComplete="name" required maxLength={100} linha defaultValue={estado.valores.nome} erro={estado.erros.nome} />
      <CampoTexto id="email" name="email" rotulo="E-mail" type="email" autoComplete="email" required maxLength={120} linha defaultValue={estado.valores.email} erro={estado.erros.email} />
      <CampoTexto
        id="senha"
        name="senha"
        rotulo="Senha"
        type="password"
        autoComplete="new-password"
        required
        minLength={SENHA_MINIMA}
        linha
        ajuda={`Mínimo de ${SENHA_MINIMA} caracteres.`}
        erro={estado.erros.senha}
      />
      <CampoTexto id="confirmacao" name="confirmacao" rotulo="Confirmação de senha" type="password" autoComplete="new-password" required linha erro={estado.erros.confirmacao} />

      <CampoTexto
        id="cep"
        name="cep"
        rotulo="CEP (opcional)"
        type="text"
        inputMode="numeric"
        autoComplete="postal-code"
        maxLength={9}
        placeholder="00000000"
        linha
        defaultValue={estado.valores.cep}
        onBlur={aoSairDoCep}
        ajuda="Só números. Cidade e UF são preenchidos automaticamente."
        erro={estado.erros.cep}
        aria-describedby={idAvisoCep}
      />
      <p id={idAvisoCep} className={avisoCep && !avisoCep.ok ? "erro-campo" : "ajuda"} role="status">
        {buscandoCep
          ? "Consultando o CEP…"
          : avisoCep
            ? avisoCep.ok
              ? `Endereço encontrado: ${avisoCep.cidade}/${avisoCep.uf}.`
              : avisoCep.mensagem
            : ""}
      </p>

      <div className="linha-campos">
        <CampoTexto id="cidade" name="cidade" rotulo="Cidade (opcional)" type="text" autoComplete="address-level2" maxLength={100} linha value={cidade} onChange={(e) => setCidade(e.target.value)} erro={estado.erros.cidade} />
        <CampoSelecao id="uf" name="uf" rotulo="UF (opcional)" autoComplete="address-level1" linha value={uf} onChange={(e) => setUf(e.target.value)} erro={estado.erros.uf}>
          <option value="">—</option>
          {UFS.map((sigla) => (
            <option key={sigla} value={sigla}>
              {sigla}
            </option>
          ))}
        </CampoSelecao>
      </div>

      <div className="login-acoes">
        <button type="submit" className="botao botao-pilula botao-grande" disabled={pendente}>
          {pendente ? "Criando conta…" : "Cadastrar"}
        </button>
      </div>
    </form>
  );
}
