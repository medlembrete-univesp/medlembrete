/** Lê as variáveis públicas do Supabase. Devolve null se ainda não foram configuradas. */
export function configSupabase(): { url: string; chave: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !chave) return null;
  return { url, chave };
}

export function exigirConfigSupabase(): { url: string; chave: string } {
  const cfg = configSupabase();
  if (!cfg) {
    throw new Error(
      "Supabase não configurado: defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY em .env.local (veja .env.example).",
    );
  }
  return cfg;
}
