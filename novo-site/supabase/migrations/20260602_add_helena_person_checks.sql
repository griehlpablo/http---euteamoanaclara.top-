select conname
from pg_constraint
where conrelid = 'public.daily_health_logs'::regclass
and contype = 'c';

do $$
declare
  constraint_name text;
begin
  select conname
  into constraint_name
  from pg_constraint
  where conrelid = 'public.daily_health_logs'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) like '%person%';

  if constraint_name is not null then
    execute format('alter table public.daily_health_logs drop constraint %I', constraint_name);
  end if;

  alter table public.daily_health_logs
  add constraint daily_health_logs_person_check
  check (person in ('pablo', 'ana_clara', 'helena'));
end $$;

do $$
declare
  constraint_name text;
begin
  if to_regclass('public.health_notification_settings') is null then
    return;
  end if;

  select conname
  into constraint_name
  from pg_constraint
  where conrelid = 'public.health_notification_settings'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) like '%person%';

  if constraint_name is not null then
    execute format('alter table public.health_notification_settings drop constraint %I', constraint_name);
  end if;

  alter table public.health_notification_settings
  add constraint health_notification_settings_person_check
  check (person in ('pablo', 'ana_clara', 'helena'));
end $$;
