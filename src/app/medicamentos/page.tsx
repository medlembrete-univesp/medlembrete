import { redirect } from "next/navigation";

/** Medicamentos são cadastrados dentro de cada paciente. */
export default function PaginaMedicamentos() {
  redirect("/pacientes");
}
