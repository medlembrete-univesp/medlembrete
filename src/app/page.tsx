import { redirect } from "next/navigation";

/** GET / → /hoje. O proxy manda para /login se não houver sessão. */
export default function PaginaInicial() {
  redirect("/hoje");
}
