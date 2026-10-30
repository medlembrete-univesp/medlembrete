import type { Paciente } from "@/lib/dados/pacientes";

/**
 * Filtro por paciente como formulário GET: funciona sem JavaScript e mantém a
 * URL compartilhável. `extras` preserva outros parâmetros (ex.: período).
 */
export function FiltroPaciente({
  pacientes,
  selecionado,
  acao,
  extras = {},
}: {
  pacientes: Paciente[];
  selecionado: number | null;
  acao: string;
  extras?: Record<string, string>;
}) {
  if (pacientes.length < 2) return null;
  return (
    <form method="get" action={acao} className="filtro">
      {Object.entries(extras).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <label htmlFor="filtro-paciente">Paciente</label>
      <select id="filtro-paciente" name="paciente" defaultValue={selecionado ?? ""}>
        <option value="">Todos os pacientes</option>
        {pacientes.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nome}
          </option>
        ))}
      </select>
      <button type="submit" className="botao botao-secundario">
        Filtrar
      </button>
    </form>
  );
}
