/** RF02 — consulta à API pública ViaCEP, direto do navegador. Nunca lança exceção. */

export interface EnderecoCep {
  cidade: string;
  uf: string;
  logradouro: string;
  bairro: string;
}

export type ResultadoCep = ({ ok: true } & EnderecoCep) | { ok: false; mensagem: string };

interface RespostaViaCep {
  erro?: boolean | string;
  localidade?: string;
  uf?: string;
  logradouro?: string;
  bairro?: string;
}

export async function consultarCep(
  cep: string,
  fetchFn: typeof fetch = fetch,
): Promise<ResultadoCep> {
  const digitos = cep.replace(/\D/g, "");
  if (digitos.length !== 8) {
    return { ok: false, mensagem: "O CEP deve ter 8 números." };
  }
  try {
    const resposta = await fetchFn(`https://viacep.com.br/ws/${digitos}/json/`);
    if (!resposta.ok) {
      return { ok: false, mensagem: "Não foi possível consultar o CEP. Preencha o endereço à mão." };
    }
    const dados = (await resposta.json()) as RespostaViaCep;
    if (dados.erro || !dados.localidade || !dados.uf) {
      return { ok: false, mensagem: "CEP não encontrado. Preencha o endereço à mão." };
    }
    return {
      ok: true,
      cidade: dados.localidade,
      uf: dados.uf.toUpperCase(),
      logradouro: dados.logradouro ?? "",
      bairro: dados.bairro ?? "",
    };
  } catch {
    return { ok: false, mensagem: "Sem conexão com a ViaCEP. Preencha o endereço à mão." };
  }
}

/** Formata 01001000 como 01001-000 para exibição. */
export function formatarCep(cep: string | null | undefined): string {
  if (!cep) return "";
  const d = cep.replace(/\D/g, "");
  return d.length === 8 ? `${d.slice(0, 5)}-${d.slice(5)}` : cep;
}
