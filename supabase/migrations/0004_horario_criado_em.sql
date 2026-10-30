-- MedLembrete — data de criação do horário
-- Doses só são programadas a partir do dia em que o medicamento e o horário foram
-- criados; antes disso não existiam, então não contam como "não tomadas" no histórico
-- nem na aderência. medicamento já tem criado_em; horario ganha o seu aqui.
-- Cole no SQL Editor do Supabase e execute uma vez, depois da 0003.

alter table public.horario
  add column if not exists criado_em timestamptz not null default now();
