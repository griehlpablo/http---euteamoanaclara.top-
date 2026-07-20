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
