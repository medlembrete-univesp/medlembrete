"use client";

import { ErroCampo } from "@/components/ui/CampoTexto";

import Link from "next/link";
import { useActionState } from "react";
import type { Erros } from "@/lib/validacao";
import type { CampoPaciente, DadosPaciente } from "@/lib/validacao-paciente";
import { CamposEndereco } from "./CamposEndereco";

export interface EstadoPaciente {
  erros: Erros<CampoPaciente>;
  mensagem?: string;
  valores: DadosPaciente;
}

export type AcaoPaciente = (anterior: EstadoPaciente, fd: FormData) => Promise<EstadoPaciente>;


export function FormularioPaciente({
  acao,
  inicial,
  textoBotao,
  voltarPara,
}: {
  acao: AcaoPaciente;
  inicial: DadosPaciente;
  textoBotao: string;
  voltarPara: string;
}) {
  const [estado, enviar, pendente] = useActionState(acao, { erros: {}, valores: inicial });
  const nErros = Object.keys(estado.erros).length;

  return (
    <form action={enviar} className="formulario" noValidate>
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
        <label htmlFor="nome">Nome do paciente</label>
        <input
          id="nome"
          name="nome"
          type="text"
          required
          maxLength={120}
          autoComplete="off"
          defaultValue={estado.valores.nome}
          aria-invalid={estado.erros.nome ? true : undefined}
          aria-describedby={estado.erros.nome ? "erro-nome" : undefined}
        />
        <ErroCampo id="erro-nome" texto={estado.erros.nome} />
      </div>

      <div className="campo">
        <label htmlFor="data_nascimento">Data de nascimento (opcional)</label>
        <input
          id="data_nascimento"
          name="data_nascimento"
          type="date"
          min="1900-01-01"
          defaultValue={estado.valores.data_nascimento}
          aria-invalid={estado.erros.data_nascimento ? true : undefined}
          aria-describedby={estado.erros.data_nascimento ? "erro-data_nascimento" : undefined}
        />
        <ErroCampo id="erro-data_nascimento" texto={estado.erros.data_nascimento} />
      </div>

      <CamposEndereco
        inicial={{
          cep: estado.valores.cep,
          logradouro: estado.valores.logradouro,
          numero: estado.valores.numero,
          bairro: estado.valores.bairro,
          cidade: estado.valores.cidade,
          uf: estado.valores.uf,
        }}
        erros={estado.erros}
      />

      <div className="campo">
        <label htmlFor="observacao">Observações (opcional)</label>
        <textarea
          id="observacao"
          name="observacao"
          rows={3}
          maxLength={255}
          defaultValue={estado.valores.observacao}
          aria-invalid={estado.erros.observacao ? true : undefined}
          aria-describedby={estado.erros.observacao ? "erro-observacao ajuda-observacao" : "ajuda-observacao"}
        />
        <p id="ajuda-observacao" className="ajuda">
          Alergias, cuidados, contato do responsável. Até 255 caracteres.
        </p>
        <ErroCampo id="erro-observacao" texto={estado.erros.observacao} />
      </div>

      <div className="acoes-linha">
        <button type="submit" className="botao botao-grande" disabled={pendente}>
          {pendente ? "Salvando…" : textoBotao}
        </button>
        <Link href={voltarPara} className="botao botao-secundario">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
