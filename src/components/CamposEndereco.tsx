"use client";

import { useId, useState } from "react";
import type { Erros } from "@/lib/validacao";
import { UFS } from "@/lib/validacao";
import { consultarCep, type ResultadoCep } from "@/lib/viacep";

export interface ValoresEndereco {
  cep: string;
  logradouro: string;
  numero: string;
  bairro: string;
  cidade: string;
  uf: string;
}

type CampoEndereco = keyof ValoresEndereco;

function Erro({ id, texto }: { id: string; texto?: string }) {
  if (!texto) return null;
  return (
    <p id={id} className="erro-campo" role="alert">
      {texto}
    </p>
  );
}

/**
 * RF02 — bloco de endereço com CEP consultado na ViaCEP ao sair do campo.
 * Os campos continuam editáveis à mão; o cadastro nunca depende da API.
 */
export function CamposEndereco({
  inicial,
  erros,
}: {
  inicial: ValoresEndereco;
  erros: Erros<CampoEndereco>;
}) {
  const [v, setV] = useState<ValoresEndereco>(inicial);
  const [aviso, setAviso] = useState<ResultadoCep | null>(null);
  const [buscando, setBuscando] = useState(false);
  const idAviso = useId();

  function mudar(campo: CampoEndereco, valor: string) {
    setV((atual) => ({ ...atual, [campo]: valor }));
  }

  async function aoSairDoCep(e: React.FocusEvent<HTMLInputElement>) {
    const cep = e.target.value.replace(/\D/g, "");
    if (cep.length !== 8) {
      setAviso(null);
      return;
    }
    setBuscando(true);
    const r = await consultarCep(cep);
    setBuscando(false);
    setAviso(r);
    if (r.ok) {
      setV((atual) => ({
        ...atual,
        logradouro: r.logradouro || atual.logradouro,
        bairro: r.bairro || atual.bairro,
        cidade: r.cidade,
        uf: r.uf,
      }));
    }
  }

  const describedByCep = [erros.cep ? "erro-cep" : null, "ajuda-cep", aviso || buscando ? idAviso : null]
    .filter(Boolean)
    .join(" ");

  return (
    <fieldset className="campo">
      <legend className="legenda">Endereço (opcional)</legend>

      <div className="campo">
        <label htmlFor="cep">CEP</label>
        <input
          id="cep"
          name="cep"
          type="text"
          inputMode="numeric"
          autoComplete="postal-code"
          maxLength={9}
          placeholder="00000000"
          value={v.cep}
          onChange={(e) => mudar("cep", e.target.value)}
          onBlur={aoSairDoCep}
          aria-invalid={erros.cep ? true : undefined}
          aria-describedby={describedByCep}
        />
        <p id="ajuda-cep" className="ajuda">
          Só números. Ao sair do campo, o endereço é preenchido automaticamente pela ViaCEP.
        </p>
        <Erro id="erro-cep" texto={erros.cep} />
        <p id={idAviso} className={aviso && !aviso.ok ? "erro-campo" : "ajuda"} role="status">
          {buscando
            ? "Consultando o CEP…"
            : aviso
              ? aviso.ok
                ? `Endereço encontrado: ${[aviso.logradouro, aviso.bairro].filter(Boolean).join(", ")}${aviso.logradouro || aviso.bairro ? " — " : ""}${aviso.cidade}/${aviso.uf}.`
                : aviso.mensagem
              : ""}
        </p>
      </div>

      <div className="linha-campos linha-campos-3-1">
        <div className="campo">
          <label htmlFor="logradouro">Logradouro</label>
          <input
            id="logradouro"
            name="logradouro"
            type="text"
            autoComplete="address-line1"
            maxLength={150}
            value={v.logradouro}
            onChange={(e) => mudar("logradouro", e.target.value)}
            aria-invalid={erros.logradouro ? true : undefined}
            aria-describedby={erros.logradouro ? "erro-logradouro" : undefined}
          />
          <Erro id="erro-logradouro" texto={erros.logradouro} />
        </div>
        <div className="campo">
          <label htmlFor="numero">Número</label>
          <input
            id="numero"
            name="numero"
            type="text"
            maxLength={20}
            value={v.numero}
            onChange={(e) => mudar("numero", e.target.value)}
            aria-invalid={erros.numero ? true : undefined}
            aria-describedby={erros.numero ? "erro-numero" : undefined}
          />
          <Erro id="erro-numero" texto={erros.numero} />
        </div>
      </div>

      <div className="campo">
        <label htmlFor="bairro">Bairro</label>
        <input
          id="bairro"
          name="bairro"
          type="text"
          autoComplete="address-level3"
          maxLength={100}
          value={v.bairro}
          onChange={(e) => mudar("bairro", e.target.value)}
          aria-invalid={erros.bairro ? true : undefined}
          aria-describedby={erros.bairro ? "erro-bairro" : undefined}
        />
        <Erro id="erro-bairro" texto={erros.bairro} />
      </div>

      <div className="linha-campos">
        <div className="campo">
          <label htmlFor="cidade">Cidade</label>
          <input
            id="cidade"
            name="cidade"
            type="text"
            autoComplete="address-level2"
            maxLength={100}
            value={v.cidade}
            onChange={(e) => mudar("cidade", e.target.value)}
            aria-invalid={erros.cidade ? true : undefined}
            aria-describedby={erros.cidade ? "erro-cidade" : undefined}
          />
          <Erro id="erro-cidade" texto={erros.cidade} />
        </div>
        <div className="campo">
          <label htmlFor="uf">UF</label>
          <select
            id="uf"
            name="uf"
            autoComplete="address-level1"
            value={v.uf}
            onChange={(e) => mudar("uf", e.target.value)}
            aria-invalid={erros.uf ? true : undefined}
            aria-describedby={erros.uf ? "erro-uf" : undefined}
          >
            <option value="">—</option>
            {UFS.map((sigla) => (
              <option key={sigla} value={sigla}>
                {sigla}
              </option>
            ))}
          </select>
          <Erro id="erro-uf" texto={erros.uf} />
        </div>
      </div>
    </fieldset>
  );
}
