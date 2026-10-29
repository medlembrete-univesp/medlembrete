-- MedLembrete — esquema inicial (perfil, medicamento, horario, registro_dose)
-- Cole este arquivo inteiro no SQL Editor do Supabase e execute uma vez.
-- Pode ser executado de novo sem erro: tudo usa "if not exists" ou "or replace".

-- ---------------------------------------------------------------------------
-- Tabelas
-- ---------------------------------------------------------------------------

-- "usuario" do PDF. E-mail e hash da senha ficam em auth.users (Supabase Auth);
-- aqui ficam os demais campos do cadastro.
create table if not exists public.perfil (
  id         uuid primary key references auth.users (id) on delete cascade,
  nome       text not null check (char_length(nome) between 1 and 100),
  cep        text check (cep is null or cep ~ '^[0-9]{8}$'),
  cidade     text check (cidade is null or char_length(cidade) <= 100),
  uf         text check (uf is null or uf ~ '^[A-Z]{2}$'),
  criado_em  timestamptz not null default now()
);

create table if not exists public.medicamento (
  id          bigint generated always as identity primary key,
  usuario_id  uuid not null references auth.users (id) on delete cascade,
  nome        text not null check (char_length(nome) between 1 and 120),
  dose        text not null check (char_length(dose) between 1 and 120),
  observacao  text check (observacao is null or char_length(observacao) <= 255),
  ativo       boolean not null default true,
  criado_em   timestamptz not null default now()
);
create index if not exists medicamento_usuario_idx
  on public.medicamento (usuario_id) where ativo;

create table if not exists public.horario (
  id              bigint generated always as identity primary key,
  medicamento_id  bigint not null references public.medicamento (id) on delete cascade,
  -- HH:MM no horário local (America/Sao_Paulo)
  hora            text not null check (hora ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  -- dígitos 0..6, 0 = segunda-feira; ex.: '01234' = seg a sex
  dias_semana     text not null check (dias_semana ~ '^[0-6]{1,7}$'),
  ativo           boolean not null default true
);
create index if not exists horario_medicamento_idx
  on public.horario (medicamento_id);

create table if not exists public.registro_dose (
  id          bigint generated always as identity primary key,
  horario_id  bigint not null references public.horario (id) on delete cascade,
  data        date not null,
  tomado_em   timestamptz not null default now(),
  unique (horario_id, data)
);
create index if not exists registro_dose_data_idx
  on public.registro_dose (data);

-- ---------------------------------------------------------------------------
-- Trigger: cria o perfil assim que o usuário se cadastra no Supabase Auth.
-- Os campos extras do formulário chegam em raw_user_meta_data.
-- ---------------------------------------------------------------------------
create or replace function public.criar_perfil()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfil (id, nome, cep, cidade, uf)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'nome'), ''),
             split_part(new.email, '@', 1)),
    nullif(regexp_replace(coalesce(new.raw_user_meta_data ->> 'cep', ''), '\D', '', 'g'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'cidade'), ''),
    nullif(upper(trim(new.raw_user_meta_data ->> 'uf')), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists ao_criar_usuario on auth.users;
create trigger ao_criar_usuario
  after insert on auth.users
  for each row execute function public.criar_perfil();

-- ---------------------------------------------------------------------------
-- Row Level Security: cada usuário só vê e altera o que é dele.
-- Não há política de DELETE em medicamento/horario: exclusão é lógica (ativo = false).
-- Não há UPDATE/DELETE em registro_dose: o registro é imutável.
-- ---------------------------------------------------------------------------
alter table public.perfil         enable row level security;
alter table public.medicamento    enable row level security;
alter table public.horario        enable row level security;
alter table public.registro_dose  enable row level security;

drop policy if exists "perfil: dono le"    on public.perfil;
drop policy if exists "perfil: dono edita" on public.perfil;
create policy "perfil: dono le" on public.perfil
  for select to authenticated using (id = auth.uid());
create policy "perfil: dono edita" on public.perfil
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "medicamento: dono le"     on public.medicamento;
drop policy if exists "medicamento: dono cria"   on public.medicamento;
drop policy if exists "medicamento: dono edita"  on public.medicamento;
create policy "medicamento: dono le" on public.medicamento
  for select to authenticated using (usuario_id = auth.uid());
create policy "medicamento: dono cria" on public.medicamento
  for insert to authenticated with check (usuario_id = auth.uid());
create policy "medicamento: dono edita" on public.medicamento
  for update to authenticated using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

drop policy if exists "horario: dono le"    on public.horario;
drop policy if exists "horario: dono cria"  on public.horario;
drop policy if exists "horario: dono edita" on public.horario;
create policy "horario: dono le" on public.horario
  for select to authenticated using (
    exists (select 1 from public.medicamento m
            where m.id = horario.medicamento_id and m.usuario_id = auth.uid()));
create policy "horario: dono cria" on public.horario
  for insert to authenticated with check (
    exists (select 1 from public.medicamento m
            where m.id = horario.medicamento_id and m.usuario_id = auth.uid()));
create policy "horario: dono edita" on public.horario
  for update to authenticated using (
    exists (select 1 from public.medicamento m
            where m.id = horario.medicamento_id and m.usuario_id = auth.uid()));

drop policy if exists "registro: dono le"   on public.registro_dose;
drop policy if exists "registro: dono cria" on public.registro_dose;
create policy "registro: dono le" on public.registro_dose
  for select to authenticated using (
    exists (select 1 from public.horario h
            join public.medicamento m on m.id = h.medicamento_id
            where h.id = registro_dose.horario_id and m.usuario_id = auth.uid()));
create policy "registro: dono cria" on public.registro_dose
  for insert to authenticated with check (
    exists (select 1 from public.horario h
            join public.medicamento m on m.id = h.medicamento_id
            where h.id = registro_dose.horario_id and m.usuario_id = auth.uid()));
