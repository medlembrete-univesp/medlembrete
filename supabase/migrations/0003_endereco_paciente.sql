-- MedLembrete — endereço do paciente (preenchido pela API ViaCEP a partir do CEP)
-- Cole no SQL Editor do Supabase e execute uma vez, depois da 0002.

alter table public.paciente
  add column if not exists cep        text check (cep is null or cep ~ '^[0-9]{8}$'),
  add column if not exists logradouro text check (logradouro is null or char_length(logradouro) <= 150),
  add column if not exists numero     text check (numero is null or char_length(numero) <= 20),
  add column if not exists bairro     text check (bairro is null or char_length(bairro) <= 100),
  add column if not exists cidade     text check (cidade is null or char_length(cidade) <= 100),
  add column if not exists uf         text check (uf is null or uf ~ '^[A-Z]{2}$');
