create table if not exists public.diet_foods (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  category text not null default 'outro',
  kcal_per_100 numeric not null default 0,
  protein_per_100 numeric not null default 0,
  sugar_per_100 numeric not null default 0,
  default_unit text not null default 'g',
  default_grams_or_ml numeric not null default 100,
  is_liquid boolean not null default false,
  has_added_sugar boolean not null default false,
  is_ultraprocessed boolean not null default false,
  is_energy_drink boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.diet_foods enable row level security;

create policy "Allow read diet foods"
  on public.diet_foods
  for select
  to anon, authenticated
  using (active = true);

create policy "Allow manage diet foods"
  on public.diet_foods
  for all
  to authenticated
  using (true)
  with check (true);
