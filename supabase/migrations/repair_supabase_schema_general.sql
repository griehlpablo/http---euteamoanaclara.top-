-- Ajustes de compatibilidade do schema.
-- Não remove dados nem altera as tabelas de humor e satisfação.

create extension if not exists "pgcrypto";

-- chats
create table if not exists public.chats (
  id uuid primary key default gen_random_uuid(),
  title text,
  created_at timestamptz not null default now(),
  "createdAt" timestamptz default now()
);

alter table public.chats add column if not exists title text;
alter table public.chats add column if not exists created_at timestamptz not null default now();
alter table public.chats add column if not exists "createdAt" timestamptz default now();
alter table public.chats alter column created_at set default now();
alter table public.chats alter column "createdAt" set default now();

-- mensagens
create table if not exists public.mensagens (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid,
  role text,
  content text,
  text text,
  image_url text,
  "imageUrl" text,
  file_type text,
  "fileType" text,
  created_at timestamptz not null default now(),
  "createdAt" timestamptz default now()
);

alter table public.mensagens add column if not exists chat_id uuid;
alter table public.mensagens add column if not exists role text;
alter table public.mensagens add column if not exists content text;
alter table public.mensagens add column if not exists text text;
alter table public.mensagens add column if not exists image_url text;
alter table public.mensagens add column if not exists "imageUrl" text;
alter table public.mensagens add column if not exists file_type text;
alter table public.mensagens add column if not exists "fileType" text;
alter table public.mensagens add column if not exists created_at timestamptz not null default now();
alter table public.mensagens add column if not exists "createdAt" timestamptz default now();
alter table public.mensagens alter column created_at set default now();
alter table public.mensagens alter column "createdAt" set default now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'mensagens_chat_id_fkey'
      and conrelid = 'public.mensagens'::regclass
  ) then
    alter table public.mensagens
      add constraint mensagens_chat_id_fkey
      foreign key (chat_id) references public.chats(id) on delete cascade;
  end if;
exception
  when others then
    raise notice 'Skipping mensagens.chat_id foreign key: %', sqlerrm;
end $$;

-- links
create table if not exists public.links (
  id uuid primary key default gen_random_uuid(),
  url text,
  title text,
  description text,
  image text,
  trust integer default 0,
  created_at timestamptz not null default now(),
  timestamp timestamptz default now()
);

alter table public.links add column if not exists url text;
alter table public.links add column if not exists title text;
alter table public.links add column if not exists description text;
alter table public.links add column if not exists image text;
alter table public.links add column if not exists trust integer default 0;
alter table public.links add column if not exists created_at timestamptz not null default now();
alter table public.links add column if not exists timestamp timestamptz default now();
alter table public.links alter column trust set default 0;
alter table public.links alter column created_at set default now();
alter table public.links alter column timestamp set default now();

-- mural
create table if not exists public.mural (
  id uuid primary key default gen_random_uuid(),
  content text,
  text text,
  author text,
  image_url text,
  "imageUrl" text,
  likes text[] default array[]::text[],
  created_at timestamptz not null default now(),
  timestamp timestamptz default now()
);

alter table public.mural add column if not exists content text;
alter table public.mural add column if not exists text text;
alter table public.mural add column if not exists author text;
alter table public.mural add column if not exists image_url text;
alter table public.mural add column if not exists "imageUrl" text;
alter table public.mural add column if not exists likes text[] default array[]::text[];
alter table public.mural add column if not exists created_at timestamptz not null default now();
alter table public.mural add column if not exists timestamp timestamptz default now();
alter table public.mural alter column likes set default array[]::text[];
alter table public.mural alter column created_at set default now();
alter table public.mural alter column timestamp set default now();

-- bucketlist
create table if not exists public.bucketlist (
  id uuid primary key default gen_random_uuid(),
  content text,
  text text,
  completed boolean default false,
  created_at timestamptz not null default now(),
  "createdAt" timestamptz default now()
);

alter table public.bucketlist add column if not exists content text;
alter table public.bucketlist add column if not exists text text;
alter table public.bucketlist add column if not exists completed boolean default false;
alter table public.bucketlist add column if not exists created_at timestamptz not null default now();
alter table public.bucketlist add column if not exists "createdAt" timestamptz default now();
alter table public.bucketlist alter column completed set default false;
alter table public.bucketlist alter column created_at set default now();
alter table public.bucketlist alter column "createdAt" set default now();

-- capsula
create table if not exists public.capsula (
  id uuid primary key default gen_random_uuid(),
  message text,
  unlock_date timestamptz,
  "unlockDate" timestamptz,
  unlocked boolean default false,
  created_at timestamptz not null default now(),
  "createdAt" timestamptz default now()
);

alter table public.capsula add column if not exists message text;
alter table public.capsula add column if not exists unlock_date timestamptz;
alter table public.capsula add column if not exists "unlockDate" timestamptz;
alter table public.capsula add column if not exists unlocked boolean default false;
alter table public.capsula add column if not exists created_at timestamptz not null default now();
alter table public.capsula add column if not exists "createdAt" timestamptz default now();
alter table public.capsula alter column unlocked set default false;
alter table public.capsula alter column created_at set default now();
alter table public.capsula alter column "createdAt" set default now();

-- potepapel
create table if not exists public.potepapel (
  id uuid primary key default gen_random_uuid(),
  message text,
  created_at timestamptz not null default now(),
  "createdAt" timestamptz default now()
);

alter table public.potepapel add column if not exists message text;
alter table public.potepapel add column if not exists created_at timestamptz not null default now();
alter table public.potepapel add column if not exists "createdAt" timestamptz default now();
alter table public.potepapel alter column created_at set default now();
alter table public.potepapel alter column "createdAt" set default now();

-- cupons
create table if not exists public.cupons (
  id uuid primary key default gen_random_uuid(),
  title text,
  description text,
  reward text,
  redeemed boolean default false,
  source text,
  created_at timestamptz not null default now(),
  "createdAt" timestamptz default now()
);

alter table public.cupons add column if not exists title text;
alter table public.cupons add column if not exists description text;
alter table public.cupons add column if not exists reward text;
alter table public.cupons add column if not exists redeemed boolean default false;
alter table public.cupons add column if not exists source text;
alter table public.cupons add column if not exists created_at timestamptz not null default now();
alter table public.cupons add column if not exists "createdAt" timestamptz default now();
alter table public.cupons alter column redeemed set default false;
alter table public.cupons alter column created_at set default now();
alter table public.cupons alter column "createdAt" set default now();

-- gallery
create table if not exists public.gallery (
  id uuid primary key default gen_random_uuid(),
  url text,
  album text default 'Memórias',
  title text,
  description text,
  created_at timestamptz not null default now()
);

alter table public.gallery add column if not exists url text;
alter table public.gallery add column if not exists album text default 'Memórias';
alter table public.gallery add column if not exists title text;
alter table public.gallery add column if not exists description text;
alter table public.gallery add column if not exists created_at timestamptz not null default now();
alter table public.gallery alter column album set default 'Memórias';
alter table public.gallery alter column created_at set default now();

-- indexes
create index if not exists idx_chats_created_at on public.chats(created_at desc);
create index if not exists idx_mensagens_chat_created_at on public.mensagens(chat_id, created_at desc);
create index if not exists idx_links_created_at on public.links(created_at desc);
create index if not exists idx_mural_created_at on public.mural(created_at desc);
create index if not exists idx_bucketlist_created_at on public.bucketlist(created_at desc);
create index if not exists idx_capsula_created_at on public.capsula(created_at desc);
create index if not exists idx_potepapel_created_at on public.potepapel(created_at desc);
create index if not exists idx_cupons_created_at on public.cupons(created_at desc);
create index if not exists idx_gallery_created_at on public.gallery(created_at desc);

-- O site usa acesso compartilhado sem autenticação.
alter table if exists public.chats disable row level security;
alter table if exists public.mensagens disable row level security;
alter table if exists public.links disable row level security;
alter table if exists public.mural disable row level security;
alter table if exists public.bucketlist disable row level security;
alter table if exists public.capsula disable row level security;
alter table if exists public.potepapel disable row level security;
alter table if exists public.cupons disable row level security;
alter table if exists public.gallery disable row level security;
