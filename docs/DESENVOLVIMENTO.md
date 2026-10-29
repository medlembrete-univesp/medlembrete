# Regras de desenvolvimento

Valem para todo o grupo. Leia `REQUISITOS.md` antes de implementar qualquer coisa e
implemente um bloco por vez, citando os RFs no commit.

- Stack: Next.js 16 (App Router, TypeScript) + Supabase (Postgres + Auth + RLS) + Vercel. Tudo no plano gratuito.
- Toda data e hora de "hoje" vem de `agora()` em `src/lib/servicos` (fuso `America/Sao_Paulo`). Nunca use `new Date()` direto para decidir o dia ou o status de uma dose.
- Cálculo de doses e aderência: funções puras em `src/lib/servicos`, que recebem data/hora como parâmetro. Sem acesso a banco ali.
- Toda consulta filtra pelo usuário logado, mesmo com RLS ativo. Rotas de API devolvem 401 sem sessão e 404 para recurso de outro usuário.
- Horários nunca são apagados: edição desativa (`ativo = false`) e cria novos.
- Acessibilidade conforme RNF01: `lang="pt-BR"`, um `h1` por página, labels, `aria-describedby` em erros, foco visível, 44 px de área clicável, status em texto e cor.
- Textos da interface em português do Brasil. Nomes de arquivos, variáveis e tabelas também em português, sem acento.
- Segredos só em `.env.local` (ignorado pelo Git) e nas variáveis da Vercel. Nunca comitar a chave `service_role`.
- Antes de encerrar um bloco: `npm run lint`, `npm run typecheck`, `npm test` e `npm run build` passando.
- Commits em português, uma frase no imperativo, um commit por bloco concluído.
