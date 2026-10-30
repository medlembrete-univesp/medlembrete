# MedLembrete — Requisitos do MVP

Projeto Integrador II — UNIVESP. Documento de requisitos do MVP, para a stack escolhida (Next.js + Supabase + Vercel).

## Objetivo e escopo

O MedLembrete é um **gestor de medicamentos para profissionais de saúde e cuidadores**.
Quem faz login é o profissional: ele cadastra seus pacientes e, dentro de cada paciente, os
medicamentos com horários e dias da semana. A página do dia reúne as doses de todos os
pacientes, com filtro por paciente, e os lembretes avisam o profissional enquanto a página
estiver aberta.

O MVP deve estar no ar, com HTTPS, permitindo que um profissional se cadastre, registre
pacientes e medicamentos e receba lembretes na tela.

Sete entregas: cadastro e login, CEP preenchido via ViaCEP, CRUD de pacientes, CRUD de
medicamentos com horários e dias da semana, página do dia com o botão "Tomei", lembrete visual e sonoro,
histórico e dashboard de aderência. Tudo usa ferramentas gratuitas.

Regra: se uma funcionalidade travar por mais de 45 minutos, ela é simplificada ou cortada.
O deploy acontece cedo, não no fim.

## O que saiu ou foi simplificado

| Item | Decisão | Motivo |
|---|---|---|
| API da ANVISA | Cortado | Não há API pública oficial e estável. |
| Lembrete com navegador fechado (Push + Service Worker) | Cortado | Exige servidor de push e chaves VAPID. Lembrete funciona com a aba aberta. |
| Recuperação de senha por e-mail | Fora do escopo | O Supabase Auth oferece, mas não entra no MVP. |
| Lembrete "adiar 10 min" | Fora do escopo | Só se sobrar tempo. |

No relatório, registrem o lembrete como "funciona com a página aberta". É uma limitação
conhecida, não um defeito.

## Stack gratuita (versão JavaScript)

| Camada | Ferramenta | Observação |
|---|---|---|
| Linguagem e framework | TypeScript + Next.js 16 (App Router) | Páginas e rotas de API no mesmo projeto. |
| Banco em produção | Supabase (PostgreSQL gratuito) | Persistente, separado do servidor. Projeto pausa após 7 dias sem uso: abrir o site antes da apresentação. |
| Login | Supabase Auth (e-mail + senha) | Senha com hash (bcrypt) feito pelo Supabase; sessão em cookie HttpOnly via `@supabase/ssr`. |
| Segurança por usuário | Row Level Security (RLS) no Postgres | Toda tabela tem política `usuario_id = auth.uid()`. Mesmo que o código erre, o banco não entrega dados de outro usuário. |
| Hospedagem | Vercel (plano Hobby) | HTTPS e deploy automático a cada push na `main`. Não dorme. |
| Fuso horário | `Intl.DateTimeFormat` com `America/Sao_Paulo` | Função única `agora()` em `src/lib/servicos`. |
| Frontend | React (Next.js) + CSS puro | Sem Tailwind; tema padrão e alto contraste em `globals.css`. |
| Gráficos | Chart.js (pacote npm) | Só na página do dashboard. |
| API externa | ViaCEP | Chamada direto do navegador; sem chave. |
| Testes | Vitest | Funções puras de `servicos` testadas sem banco. |
| Versão e CI | Git + GitHub + GitHub Actions | Actions roda lint, typecheck e testes a cada push. |
| Acessibilidade | Lighthouse (Chrome) + NVDA | Ambos gratuitos. |

## Requisitos funcionais

### RF01 — Cadastro de usuário
- Campos: nome, e-mail, senha, confirmação de senha, CEP, cidade, UF.
- E-mail único; senha com no mínimo 8 caracteres; senha salva só como hash.
- Erros aparecem junto do campo, em texto, e são anunciados pelo leitor de tela.

### RF02 — CEP automático (ViaCEP)
- No cadastro do profissional e no cadastro do paciente: ao sair do campo CEP com 8 dígitos, o JavaScript chama `https://viacep.com.br/ws/{cep}/json/` e preenche cidade e UF (e, no paciente, logradouro e bairro).
- CEP inexistente (`"erro": true`) ou falha de rede: mensagem clara e os campos continuam editáveis à mão. O cadastro nunca depende da API.

### RF03 — Login e logout
- Login por e-mail e senha; mensagem genérica em caso de erro ("E-mail ou senha incorretos").
- Todas as páginas, exceto login e cadastro, exigem login.

### RF04 — Cadastro de paciente e de medicamento
- Paciente: nome (obrigatório); data de nascimento, endereço (CEP, logradouro, número, bairro, cidade, UF) e observações (opcionais). O CEP preenche o endereço pela ViaCEP (RF02). Medicamentos são cadastrados dentro de um paciente.
- Medicamento: nome (obrigatório), dose em texto livre (ex.: "1 comprimido de 50 mg"), observação (opcional).
- Um ou mais horários (HH:MM), cada um com os dias da semana marcados em checkboxes. Botão "Adicionar horário" na própria tela.
- Pelo menos um horário e um dia são obrigatórios.

### RF05 — Editar e excluir paciente e medicamento
- Editar medicamento altera nome, dose, observação e horários. Editar paciente altera nome, nascimento e observações.
- Excluir é lógico (`ativo = false`): o registro some das listas e da página do dia, mas o histórico continua.
- Excluir pede confirmação.
- Um profissional nunca vê nem altera pacientes ou medicamentos de outro (retorna 404).

### RF06 — Página do dia
- Lista as doses de hoje de todos os pacientes ativos, em ordem de horário, calculadas pelos horários ativos e pelo dia da semana. Cada dose mostra o nome do paciente; filtro opcional por paciente.
- Cada dose mostra horário, nome, dose e status: Pendente, Tomada (com hora) ou Atrasada (mais de 60 min após o horário sem registro).
- Botão grande "Tomei ✓" em cada dose pendente ou atrasada.

### RF07 — Registrar dose tomada
- O clique em "Tomei" grava a data, o horário previsto e a hora real.
- Registrar duas vezes a mesma dose no mesmo dia não duplica (restrição única no banco).
- A página atualiza o status sem recarregar.

### RF08 — Lembrete na tela
- Botão "Ativar lembretes" na página do dia: pede permissão de notificação e libera o som (o navegador só toca áudio após uma interação do usuário).
- A cada 30 segundos, o JavaScript compara a hora atual com as doses pendentes.
- Quando chega o horário: janela modal com nome e dose, som curto gerado pela Web Audio API (sem arquivo de áudio) e notificação do sistema, se permitida.
- A modal tem os botões "Tomei ✓" e "Fechar". Cada dose dispara o lembrete uma vez só.

### RF09 — Histórico
- Tabela das doses dos últimos 7 dias (filtro opcional por período): data, horário previsto, medicamento, status e hora em que foi tomada.
- Doses programadas sem registro aparecem como "Não tomada".

### RF10 — Dashboard de aderência
- Aderência = doses tomadas ÷ doses programadas até o momento, em %, por paciente e medicamento, nos últimos 7 ou 30 dias.
- Gráfico de barras (Chart.js) e, abaixo, os mesmos números em tabela, para quem usa leitor de tela.
- Sem doses no período: mensagem "Ainda não há dados" em vez de gráfico vazio.

## Requisitos não funcionais

### RNF01 — Acessibilidade (meta: Lighthouse ≥ 90 em todas as páginas)
- `<html lang="pt-BR">`, um `<h1>` por página, landmarks (header, nav, main) e link "Pular para o conteúdo".
- Fonte base de 18 px, contraste mínimo de 4,5:1 e botão "Alto contraste" que alterna um tema escuro com amarelo/branco. A escolha fica salva em `localStorage`.
- Botões e áreas de clique com pelo menos 44 × 44 px; foco sempre visível (`:focus-visible`).
- Todo campo com `<label>` associado; erros ligados ao campo com `aria-describedby`.
- Lembrete: modal com `role="alertdialog"`, foco movido para o botão "Tomei" ao abrir e devolvido ao fechar; Esc fecha. Uma região `aria-live="assertive"` anuncia o lembrete.
- Status de dose em texto e cor, nunca só cor.
- Tudo funciona só com teclado. Teste rápido com NVDA na página do dia e no cadastro de medicamento.

### RNF02 — Segurança
- Senhas com hash (Supabase Auth). Chaves do Supabase só em variáveis de ambiente, nunca no Git.
- Toda consulta filtra pelo usuário logado **e** o banco aplica RLS como segunda barreira.
- Cookies de sessão HttpOnly e Secure em produção (padrão do `@supabase/ssr`).
- Rotas de API validam o corpo da requisição e só aceitam JSON.

### RNF03 — Fuso horário
- O servidor roda em UTC. Toda data e hora de "hoje" vem de uma única função `agora()` que usa `America/Sao_Paulo`.
- Horários previstos são salvos como texto `HH:MM` (horário local). `tomado_em` é salvo como `timestamptz`.
- Sem isso, a página do dia vira à meia-noite errada e os lembretes chegam 3 horas fora.

### RNF04 — Desempenho e compatibilidade
- Páginas funcionam em Chrome, Edge e Firefox atuais, no computador e no celular (layout responsivo de uma coluna).

## Modelo de dados

Cinco tabelas, em `supabase/migrations/`. Doses do dia **não** são gravadas antes: são
calculadas a partir de `horario` e só viram linha em `registro_dose` quando o profissional
clica em "Tomei".

A tabela de usuários do Supabase Auth (`auth.users`) guarda e-mail e hash da senha do
profissional. A tabela `perfil` guarda o resto e é criada automaticamente por trigger.

Cadeia de posse, usada pela RLS: profissional → paciente → medicamento → horario → registro_dose.

### perfil (dados do profissional)
| Campo | Tipo | Regra |
|---|---|---|
| id | uuid | PK, FK → auth.users.id |
| nome | text(100) | obrigatório |
| cep | text(8) | só dígitos, opcional |
| cidade | text(100) | opcional |
| uf | text(2) | opcional |
| criado_em | timestamptz | padrão: now() |

### paciente
| Campo | Tipo | Regra |
|---|---|---|
| id | bigint identity | PK |
| usuario_id | uuid | FK → auth.users.id (o profissional) |
| nome | text(120) | obrigatório |
| data_nascimento | date | opcional |
| cep | text(8) | só dígitos, opcional |
| logradouro | text(150) | opcional |
| numero | text(20) | opcional |
| bairro | text(100) | opcional |
| cidade | text(100) | opcional |
| uf | text(2) | opcional |
| observacao | text(255) | opcional |
| ativo | boolean | padrão: true |
| criado_em | timestamptz | padrão: now() |

### medicamento
| Campo | Tipo | Regra |
|---|---|---|
| id | bigint identity | PK |
| paciente_id | bigint | FK → paciente.id |
| nome | text(120) | obrigatório |
| dose | text(120) | obrigatório |
| observacao | text(255) | opcional |
| ativo | boolean | padrão: true |
| criado_em | timestamptz | padrão: now() |

### horario
| Campo | Tipo | Regra |
|---|---|---|
| id | bigint identity | PK |
| medicamento_id | bigint | FK → medicamento.id |
| hora | text(5) | formato HH:MM |
| dias_semana | text(7) | dígitos de 0 a 6 (0 = segunda); ex.: `01234` = seg a sex |
| ativo | boolean | padrão: true |

### registro_dose
| Campo | Tipo | Regra |
|---|---|---|
| id | bigint identity | PK |
| horario_id | bigint | FK → horario.id |
| data | date | dia da dose |
| tomado_em | timestamptz | hora real do clique |

Restrição única em `registro_dose (horario_id, data)`.

Ao editar um medicamento, horários alterados ou removidos recebem `ativo = false` e os novos
são criados; horários iguais são mantidos. Nunca apaguem horários do banco: o histórico
depende deles.

## Rotas

Páginas (App Router) e endpoints JSON. Todas, exceto cadastro, login e saúde, exigem login.

| Método | Rota | O que faz | RF |
|---|---|---|---|
| GET, POST | /cadastro | Formulário e criação do profissional | RF01, RF02 |
| GET, POST | /login | Formulário e autenticação | RF03 |
| POST | /logout | Encerra a sessão | RF03 |
| GET | / | Redireciona para /hoje | — |
| GET | /hoje | Página do dia (todos os pacientes; `?paciente=id` filtra) | RF06 |
| GET | /pacientes | Lista pacientes ativos | RF04 |
| GET, POST | /pacientes/novo | Cadastro de paciente | RF04 |
| GET | /pacientes/[id] | Paciente e seus medicamentos ativos | RF04 |
| GET, POST | /pacientes/[id]/editar | Edição do paciente | RF05 |
| POST | /pacientes/[id]/excluir | Exclusão lógica do paciente | RF05 |
| GET, POST | /pacientes/[id]/medicamentos/novo | Cadastro de medicamento | RF04 |
| GET, POST | /medicamentos/[id]/editar | Edição do medicamento | RF05 |
| POST | /medicamentos/[id]/excluir | Exclusão lógica do medicamento | RF05 |
| GET | /historico | Histórico; aceita `?inicio=AAAA-MM-DD&fim=AAAA-MM-DD&paciente=id` | RF09 |
| GET | /dashboard | Página do gráfico | RF10 |
| GET | /api/doses/hoje | JSON das doses de hoje com status | RF06, RF08 |
| POST | /api/doses | Registra dose tomada; corpo `{horario_id, data}` | RF07 |
| GET | /api/aderencia?dias=7 | JSON por paciente e medicamento: programadas, tomadas, % | RF10 |
| GET | /api/saude | Retorna ok (para checar o deploy) | — |

Exemplo de item em `/api/doses/hoje`:

```json
{"horario_id": 3, "hora": "08:00", "paciente": "Dona Maria", "medicamento": "Losartana",
 "dose": "1 comprimido 50 mg", "status": "pendente", "tomado_em": null}
```

O cálculo de doses e de aderência fica em `src/lib/servicos/`, em funções puras que recebem
a data e a hora. Assim elas são testáveis sem depender do relógio nem do banco.

## Estrutura

```
medlembrete/
├── src/
│   ├── app/                      # páginas e rotas (App Router)
│   │   ├── layout.tsx            # html lang=pt-BR, header, nav, main, skip link
│   │   ├── globals.css           # tema padrão e alto contraste
│   │   ├── page.tsx              # redireciona para /hoje
│   │   ├── cadastro, login       # públicas
│   │   ├── hoje, pacientes, medicamentos, historico, dashboard
│   │   └── api/saude, api/doses, api/doses/hoje, api/aderencia
│   ├── components/               # componentes React reutilizáveis
│   ├── lib/
│   │   ├── dados/                # acesso ao Supabase (pacientes, medicamentos)
│   │   ├── servicos/             # agora(), dosesDoDia(), aderencia() — funções puras
│   │   └── supabase/             # clientes browser/server
│   └── proxy.ts                  # renova sessão e protege rotas
├── supabase/migrations/          # SQL do esquema, RLS e trigger
├── tests/                        # Vitest
├── docs/                     # guias de deploy e de desenvolvimento
├── .env.example
├── REQUISITOS.md
└── README.md
```

| Variável | Local (`.env.local`) | Produção (Vercel) |
|---|---|---|
| NEXT_PUBLIC_SUPABASE_URL | URL do projeto Supabase | a mesma |
| NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY | chave *publishable* (ou *anon*) do projeto | a mesma |

Não existe chave secreta no app: com RLS, a chave pública basta. Não copiem a
`service_role` para lugar nenhum.

## Testes obrigatórios

Mínimo de 14 testes passando com `npm test` antes do deploy final.

| Arquivo | Teste | RF |
|---|---|---|
| tests/auth.test.ts | Cadastro válido cria usuário e a senha não fica em texto puro | RF01 |
| tests/auth.test.ts | Cadastro com e-mail repetido é recusado | RF01 |
| tests/auth.test.ts | Login com senha errada falha com mensagem genérica | RF03 |
| tests/auth.test.ts | Página protegida sem login redireciona para /login | RF03 |
| tests/medicamentos.test.ts | Criar medicamento com dois horários | RF04 |
| tests/medicamentos.test.ts | Criar sem horário é recusado | RF04 |
| tests/medicamentos.test.ts | Editar mantém horários iguais, desativa alterados e cria novos | RF05 |
| tests/pacientes.test.ts | Paciente exige nome e recusa nascimento no futuro | RF04 |
| (roteiro manual/RLS) | Profissional B recebe 404 ao abrir paciente ou medicamento de A | RF05 |
| (roteiro manual/RLS) | Excluir esconde da lista e mantém os registros | RF05 |
| tests/servicos.test.ts | dosesDoDia numa segunda traz só horários com dia 0 | RF06 |
| tests/servicos.test.ts | Dose sem registro 61 min após o horário fica "atrasada" | RF06 |
| tests/doses.test.ts | POST /api/doses registra e repetir não duplica | RF07 |
| tests/doses.test.ts | Não é possível registrar dose de horário de outro usuário | RF07 |
| tests/servicos.test.ts | Aderência: 3 tomadas de 4 programadas = 75% | RF10 |
| tests/servicos.test.ts | Aderência sem doses programadas não divide por zero | RF10 |

Os testes de `servicos` são puros. Os testes de auth, medicamentos e doses testam a
validação dos formulários e das rotas de API com o cliente Supabase substituído por um
*mock* (sem rede).

## Cronograma (blocos)

| Bloco | Pronto quando |
|---|---|
| 1. Contas (GitHub, Supabase, Vercel), repositório, estrutura, `/api/saude` | `/api/saude` responde ok no endereço da Vercel |
| 2. Esquema SQL, `agora()`, cadastro, login, logout, layout acessível | Criar conta e entrar funciona em produção |
| 3. ViaCEP no cadastro | CEP válido preenche cidade/UF; inválido mostra aviso |
| 4. CRUD de pacientes e de medicamentos com vários horários | Criar, editar e excluir funcionam; testes RF04/RF05 passam |
| 5. `servicos`, página do dia, POST /api/doses, histórico | "Tomei" muda o status sem recarregar; histórico mostra "Não tomada" |
| 6. Lembretes: verificação, modal, som, notificação | Dose cadastrada para daqui a 2 min dispara o lembrete |
| 7. Dashboard com Chart.js e tabela | Percentuais batem com o histórico |
| 8. Acessibilidade: alto contraste, foco, Lighthouse, NVDA | Lighthouse ≥ 90 nas páginas principais |
| 9. Completar testes, README, deploy final, teste no celular | 14 testes passando e checklist completo |

Se atrasar, cortem nesta ordem: dashboard, notificação do sistema (mantendo a modal e o
som), filtro de período do histórico. Nunca cortem acessibilidade nem testes.

## Checklist final

- [ ] Site público na Vercel abre com HTTPS e `/api/saude` responde ok
- [ ] Dados continuam lá depois de um novo deploy (prova de que o banco é o Supabase)
- [ ] Cadastro com CEP, login e logout funcionando em produção
- [ ] CRUD de pacientes e de medicamentos com vários horários e dias
- [ ] Página do dia com status correto no horário de Brasília
- [ ] "Tomei" registra sem duplicar
- [ ] Lembrete dispara com modal, som e notificação
- [ ] Histórico e dashboard batem entre si
- [ ] Lighthouse ≥ 90 em login, hoje e cadastro de medicamento
- [ ] Navegação completa só com teclado e teste com NVDA
- [ ] 14 testes passando
- [ ] Nenhum segredo no repositório; `.env.example` presente
- [ ] README com: o que é, como rodar local, como rodar os testes, link público
- [ ] Prints e vídeo curto salvos para o relatório

Depois, o restante do grupo deve fazer commits próprios para que o histórico do GitHub
mostre a participação de todos.
