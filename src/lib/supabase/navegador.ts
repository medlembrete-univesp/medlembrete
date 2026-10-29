import { createBrowserClient } from "@supabase/ssr";
import { exigirConfigSupabase } from "./config";

/** Cliente Supabase para componentes que rodam no navegador ("use client"). */
export function criarClienteNavegador() {
  const { url, chave } = exigirConfigSupabase();
  return createBrowserClient(url, chave);
}
