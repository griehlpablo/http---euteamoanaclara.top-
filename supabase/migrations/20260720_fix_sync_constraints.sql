-- Correcoes de compatibilidade e sincronizacao do Supabase
-- Seguro para executar mais de uma vez.

-- 1) O frontend grava 'high', 'medium' e 'low' em links.trust.
-- O schema antigo criou a coluna como integer, causando falha nos inserts.
alter table if exists public.links
  alter column trust drop default;

alter table if exists public.links
  alter column trust type text
  using (
    case coalesce(trust::text, '')
      when '2' then 'high'
      when '1' then 'medium'
      when '0' then 'medium'
      when '' then 'medium'
      else trust::text
    end
  );

alter table if exists public.links
  alter column trust set default 'medium';

-- 2) Os upserts usam onConflict: user_id. Para isso, user_id precisa ser unico.
-- Mantem a linha mais recente em caso de duplicidade.
with ranked as (
  select id,
         row_number() over (partition by user_id order by updated_at desc nulls last, id desc) as rn
  from public.humor
)
delete from public.humor
where id in (select id from ranked where rn > 1);

create unique index if not exists humor_user_id_key
  on public.humor (user_id);

with ranked as (
  select id,
         row_number() over (partition by user_id order by updated_at desc nulls last, id desc) as rn
  from public.satisfacao_current
)
delete from public.satisfacao_current
where id in (select id from ranked where rn > 1);

create unique index if not exists satisfacao_current_user_id_key
  on public.satisfacao_current (user_id);

with ranked as (
  select id,
         row_number() over (partition by user_id order by updated_at desc nulls last, id desc) as rn
  from public.satisfacao_notes
)
delete from public.satisfacao_notes
where id in (select id from ranked where rn > 1);

create unique index if not exists satisfacao_notes_user_id_key
  on public.satisfacao_notes (user_id);

-- 3) Garante a chave usada pelo upsert da dieta.
create unique index if not exists daily_health_logs_person_log_date_key
  on public.daily_health_logs (person, log_date);

-- 4) Habilita o Realtime apenas nas tabelas que podem atualizar a tela
-- sem interromper fluxos longos como o assistente e a dieta.
do $$
declare
  table_name text;
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    raise notice 'Publication supabase_realtime nao encontrada; pulando configuracao de Realtime.';
    return;
  end if;

  foreach table_name in array array[
    'bucketlist',
    'capsula',
    'potepapel',
    'links',
    'mural',
    'cupons',
    'gallery'
  ]
  loop
    if to_regclass(format('public.%I', table_name)) is not null
       and not exists (
         select 1
         from pg_publication_tables
         where pubname = 'supabase_realtime'
           and schemaname = 'public'
           and tablename = table_name
       ) then
      execute format('alter publication supabase_realtime add table public.%I', table_name);
    end if;
  end loop;
end $$;
