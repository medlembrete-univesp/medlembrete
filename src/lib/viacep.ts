/** RF02 — consulta à API pública ViaCEP, direto do navegador. Nunca lança exceção. */

export type ResultadoCep =
  | { ok: true; cidade: string; uf: string }
  | { ok: false; mensagem: string };

interface RespostaViaCep {
  erro?: boolean | string;
  localidade?: string;
  uf?: string;
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
      return { ok: false, mensagem: "Não foi possível consultar o CEP. Preencha cidade e UF à mão." };
    }
    const dados = (await resposta.json()) as RespostaViaCep;
    if (dados.erro || !dados.localidade || !dados.uf) {
      return { ok: false, mensagem: "CEP não encontrado. Preencha cidade e UF à mão." };
    }
    return { ok: true, cidade: dados.localidade, uf: dados.uf.toUpperCase() };
  } catch {
    return { ok: false, mensagem: "Sem conexão com a ViaCEP. Preencha cidade e UF à mão." };
  }
}
