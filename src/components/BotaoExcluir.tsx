"use client";

/**
 * Botão de exclusão com confirmação (RF05). Envia um POST para `acao`; o diálogo
 * nativo funciona com teclado e leitor de tela.
 */
export function BotaoExcluir({
  acao,
  mensagem,
  rotulo = "Excluir",
}: {
  acao: string;
  mensagem: string;
  rotulo?: string;
}) {
  return (
    <form
      action={acao}
      method="post"
      onSubmit={(e) => {
        if (!window.confirm(mensagem)) e.preventDefault();
      }}
    >
      <button type="submit" className="botao botao-perigo">
        {rotulo}
      </button>
    </form>
  );
}
