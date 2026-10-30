# Supabase e Vercel

Tudo no plano gratuito. Leva uns 20 minutos.

## 1. Supabase (banco + login)

1. Acesse <https://supabase.com>, entre com o GitHub e clique em **New project**: nome
   `medlembrete`, região **South America (São Paulo)**, senha forte para o banco (guarde-a).
2. Em **Project Settings → API Keys** copie:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Publishable key** (`sb_publishable_...`; a *anon key* antiga também serve) →
     `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - Nunca use a **secret/service_role** no app.
3. **SQL Editor → New query**: cole todo o arquivo `supabase/migrations/0001_schema.sql` e
   clique em **Run**. Repita com `0002_pacientes.sql`, `0003_endereco_paciente.sql` e `0004_horario_criado_em.sql`. Em **Table Editor** devem aparecer
   `perfil`, `paciente`, `medicamento`, `horario` e `registro_dose`.
4. **Authentication → Sign In / Providers → Email**: desligue **Confirm email**. O MVP não
   envia e-mail; assim o cadastro já entra logado.
5. Localmente: copie `.env.example` para `.env.local`, cole os dois valores e rode
   `npm run dev`. Teste criar conta e entrar em <http://localhost:3000>.

O projeto gratuito é **pausado após 7 dias sem uso**. Antes da apresentação, confira no
painel e clique em **Restore** se preciso.

## 2. Vercel (hospedagem)

1. Acesse <https://vercel.com>, entre com o GitHub (plano **Hobby**).
2. **Add New → Project**, importe o repositório `medlembrete`. A Vercel detecta Next.js.
3. Em **Environment Variables**, adicione as duas variáveis com os valores do `.env.local`.
4. **Deploy**. Em 1–2 minutos o site sai em `https://medlembrete-XXXX.vercel.app`.
5. Teste `https://SEU-SITE.vercel.app/api/saude`: deve responder
   `{"status":"ok", ... "supabase_configurado":true}`.
6. Cole o link no README e faça commit.

A cada push na `main` a Vercel faz deploy automático; o histórico fica em **Deployments**.

## 3. GitHub Actions

Já configurado em `.github/workflows/ci.yml`: a cada push roda lint, typecheck, testes e
build. O resultado aparece na aba **Actions**.
