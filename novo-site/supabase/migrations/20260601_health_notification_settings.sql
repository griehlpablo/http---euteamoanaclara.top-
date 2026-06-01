create table if not exists public.health_notification_settings (
  id uuid primary key default gen_random_uuid(),
  person text not null check (person in ('pablo', 'ana_clara')),
  water_reminders_enabled boolean not null default true,
  meal_reminders_enabled boolean not null default true,
  goal_reminders_enabled boolean not null default true,
  workout_reminders_enabled boolean not null default true,
  smart_frequency boolean not null default true,
  default_water_interval_minutes integer not null default 60,
  reminder_start_time text not null default '07:00',
  reminder_end_time text not null default '23:00',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (person)
);

alter table public.health_notification_settings enable row level security;

create policy "Allow anon read health notification settings"
  on public.health_notification_settings
  for select
  to anon, authenticated
  using (true);

create policy "Allow anon upsert health notification settings"
  on public.health_notification_settings
  for all
  to anon, authenticated
  using (true)
  with check (true);
