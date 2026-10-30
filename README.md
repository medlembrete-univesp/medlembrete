# MedLembrete

Gestor de medicamentos acessível para profissionais de saúde e cuidadores: o profissional
cadastra seus pacientes e os medicamentos de cada um, recebe lembretes na hora da dose,
registra as doses tomadas e acompanha a aderência ao tratamento. Projeto Integrador II — UNIVESP.

Os lembretes (modal, som e notificação) funcionam **enquanto a página estiver aberta**.
Essa é uma limitação conhecida do MVP, não um defeito.

- Requisitos completos: [REQUISITOS.md](REQUISITOS.md)
- Como configurar Supabase e Vercel: [docs/DEPLOY.md](docs/DEPLOY.md)
- Regras para quem desenvolve: [docs/DESENVOLVIMENTO.md](docs/DESENVOLVIMENTO.md)

## Stack

| Camada | Ferramenta |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript + React 19 |
| Banco e login | Supabase (PostgreSQL + Auth + Row Level Security) |
| Hospedagem | Vercel (plano Hobby, HTTPS, deploy a cada push) |
| Gráficos | Chart.js |
| Testes | Vitest |
| CI | GitHub Actions (lint, typecheck, testes, build) |

Tudo no plano gratuito.

## Rodar localmente

Pré-requisitos: Node.js 20 ou mais novo e um projeto no Supabase (veja `docs/DEPLOY.md`).

```bash
npm install
cp .env.example .env.local      # no Windows: copy .env.example .env.local
# edite .env.local com a URL e a chave publishable do seu projeto Supabase
npm run dev
```

Abra <http://localhost:3000>. Sem sessão, o app redireciona para `/login`.
`/api/saude` responde mesmo sem login e informa se o Supabase está configurado.

## Banco de dados

Execute, em ordem, os arquivos de [supabase/migrations/](supabase/migrations/) no **SQL Editor**
do Supabase: `0001_schema.sql` (tabelas, trigger de perfil e RLS) e `0002_pacientes.sql`
(tabela de pacientes e RLS pela cadeia profissional → paciente). Cada um roda uma vez.

No painel do Supabase, em **Authentication → Sign In / Providers → Email**, desligue
**Confirm email**: o MVP não envia e-mails.

## Testes e verificações

```bash
npm test            # Vitest (funções puras de serviço e validação)
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit
npm run build       # build de produção
```

## Estrutura

```
src/app/            páginas e rotas de API (App Router)
src/components/     componentes React
src/lib/dados/      acesso ao Supabase (pacientes, medicamentos)
src/lib/servicos/   agora(), dosesDoDia(), historico(), aderencia() — funções puras
src/lib/supabase/   clientes Supabase (navegador e servidor)
src/lib/validacao.ts, src/lib/viacep.ts
src/proxy.ts        renova a sessão e protege as rotas
supabase/migrations SQL do esquema
tests/              Vitest
docs/               guias de deploy e de desenvolvimento
```

## Progresso

| Bloco | Situação |
|---|---|
| 1. Estrutura, `/api/saude`, CI | feito |
| 2. Esquema SQL, `agora()`, cadastro, login, logout, layout acessível | feito e testado com o Supabase |
| 3. ViaCEP no cadastro | feito |
| 4. CRUD de pacientes e de medicamentos | feito |
| 5. Página do dia, "Tomei", histórico | serviços puros prontos e testados; páginas a fazer |
| 6. Lembretes | a fazer |
| 7. Dashboard | a fazer |
| 8. Acessibilidade (Lighthouse, NVDA) | base pronta; auditoria a fazer |
| 9. Testes finais, deploy, celular | a fazer |

Link público: _(preencher após o primeiro deploy na Vercel)_
