import Link from "next/link";

export default function NaoEncontrado() {
  return (
    <>
      <h1>Página não encontrada</h1>
      <p>O endereço não existe ou o registro não pertence à sua conta.</p>
      <p>
        <Link href="/hoje" className="botao">
          Ir para Hoje
        </Link>
      </p>
    </>
  );
}
