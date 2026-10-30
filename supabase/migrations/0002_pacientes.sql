-- MedLembrete — pacientes
-- O sistema é um gestor de medicamentos para profissionais: quem faz login cadastra
-- pacientes e, dentro de cada um, os medicamentos. Esta migration cria a tabela
-- paciente, move medicamento.usuario_id para medicamento.paciente_id e refaz a RLS
-- para seguir a cadeia profissional -> paciente -> medicamento -> horario -> registro.
-- Cole no SQL Editor do Supabase e execute uma vez, depois da 0001.

-- ---------------------------------------------------------------------------
-- Tabela paciente
-- ---------------------------------------------------------------------------
create table if not exists public.paciente (
  id               bigint generated always as identity primary key,
  usuario_id       uuid not null references auth.users (id) on delete cascade,
  nome             text not null check (char_length(nome) between 1 and 120),
  data_nascimento  date,
  observacao       text check (observacao is null or char_length(observacao) <= 255),
  ativo            boolean not null default true,
  criado_em        timestamptz not null default now()
);
create index if not exists paciente_usuario_idx
  on public.paciente (usuario_id) where ativo;

-- ---------------------------------------------------------------------------
-- medicamento: usuario_id -> paciente_id
-- ---------------------------------------------------------------------------
alter table public.medicamento
  add column if not exists paciente_id bigint references public.paciente (id) on delete cascade;

-- As políticas antigas dependem de medicamento.usuario_id; saem antes de a coluna sair.
-- Todas são recriadas mais abaixo, já pela cadeia paciente -> profissional.
drop policy if exists "medicamento: dono le"    on public.medicamento;
drop policy if exists "medicamento: dono cria"  on public.medicamento;
drop policy if exists "medicamento: dono edita" on public.medicamento;
drop policy if exists "horario: dono le"        on public.horario;
drop policy if exists "horario: dono cria"      on public.horario;
drop policy if exists "horario: dono edita"     on public.horario;
drop policy if exists "registro: dono le"       on public.registro_dose;
drop policy if exists "registro: dono cria"     on public.registro_dose;

-- Medicamentos criados antes desta migration (dados de teste) ganham um paciente
-- genérico por profissional, para não perder histórico.
do $$
declare
  u record;
  pid bigint;
begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'medicamento' and column_name = 'usuario_id') then
    for u in select distinct usuario_id from public.medicamento where paciente_id is null loop
      insert into public.paciente (usuario_id, nome, observacao)
      values (u.usuario_id, 'Paciente (migrado)', 'Criado automaticamente ao migrar medicamentos antigos.')
      returning id into pid;
      update public.medicamento set paciente_id = pid
      where usuario_id = u.usuario_id and paciente_id is null;
    end loop;
    alter table public.medicamento drop column usuario_id;
  end if;
end $$;

alter table public.medicamento alter column paciente_id set not null;
drop index if exists public.medicamento_usuario_idx;
create index if not exists medicamento_paciente_idx
  on public.medicamento (paciente_id) where ativo;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.paciente enable row level security;

drop policy if exists "paciente: dono le"    on public.paciente;
drop policy if exists "paciente: dono cria"  on public.paciente;
drop policy if exists "paciente: dono edita" on public.paciente;
create policy "paciente: dono le" on public.paciente
  for select to authenticated using (usuario_id = auth.uid());
create policy "paciente: dono cria" on public.paciente
  for insert to authenticated with check (usuario_id = auth.uid());
create policy "paciente: dono edita" on public.paciente
  for update to authenticated using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

-- Função auxiliar: o paciente pertence ao profissional logado?
create or replace function public.paciente_do_usuario(p_id bigint)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (select 1 from public.paciente p where p.id = p_id and p.usuario_id = auth.uid());
$$;

drop policy if exists "medicamento: dono le"    on public.medicamento;
drop policy if exists "medicamento: dono cria"  on public.medicamento;
drop policy if exists "medicamento: dono edita" on public.medicamento;
create policy "medicamento: dono le" on public.medicamento
  for select to authenticated using (public.paciente_do_usuario(paciente_id));
create policy "medicamento: dono cria" on public.medicamento
  for insert to authenticated with check (public.paciente_do_usuario(paciente_id));
create policy "medicamento: dono edita" on public.medicamento
  for update to authenticated using (public.paciente_do_usuario(paciente_id))
  with check (public.paciente_do_usuario(paciente_id));

drop policy if exists "horario: dono le"    on public.horario;
drop policy if exists "horario: dono cria"  on public.horario;
drop policy if exists "horario: dono edita" on public.horario;
create policy "horario: dono le" on public.horario
  for select to authenticated using (
    exists (select 1 from public.medicamento m
            where m.id = horario.medicamento_id and public.paciente_do_usuario(m.paciente_id)));
create policy "horario: dono cria" on public.horario
  for insert to authenticated with check (
    exists (select 1 from public.medicamento m
            where m.id = horario.medicamento_id and public.paciente_do_usuario(m.paciente_id)));
create policy "horario: dono edita" on public.horario
  for update to authenticated using (
    exists (select 1 from public.medicamento m
            where m.id = horario.medicamento_id and public.paciente_do_usuario(m.paciente_id)));

drop policy if exists "registro: dono le"   on public.registro_dose;
drop policy if exists "registro: dono cria" on public.registro_dose;
create policy "registro: dono le" on public.registro_dose
  for select to authenticated using (
    exists (select 1 from public.horario h
            join public.medicamento m on m.id = h.medicamento_id
            where h.id = registro_dose.horario_id and public.paciente_do_usuario(m.paciente_id)));
create policy "registro: dono cria" on public.registro_dose
  for insert to authenticated with check (
    exists (select 1 from public.horario h
            join public.medicamento m on m.id = h.medicamento_id
            where h.id = registro_dose.horario_id and public.paciente_do_usuario(m.paciente_id)));
