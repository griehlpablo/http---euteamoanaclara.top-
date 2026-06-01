-- Supabase schema generated from Firestore usage in project
-- Enable pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Table: chats
CREATE TABLE IF NOT EXISTS chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Table: mensagens (messages, previously a subcollection under chats)
CREATE TABLE IF NOT EXISTS mensagens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  role text,
  content text,
  image_url text,
  file_type text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Table: links
CREATE TABLE IF NOT EXISTS links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text,
  title text,
  description text,
  image text,
  trust integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Table: mural
CREATE TABLE IF NOT EXISTS mural (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text,
  author text,
  image_url text,
  likes text[] DEFAULT ARRAY[]::text[],
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Table: bucketlist
CREATE TABLE IF NOT EXISTS bucketlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text,
  completed boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Table: capsula (capsula do tempo)
CREATE TABLE IF NOT EXISTS capsula (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message text,
  unlock_date timestamptz,
  unlocked boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Table: potepapel
CREATE TABLE IF NOT EXISTS potepapel (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Table: cupons
CREATE TABLE IF NOT EXISTS cupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  description text,
  reward text,
  redeemed boolean DEFAULT false,
  source text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Table: humor (Radar de Humor - armazena carencia, estresse, energia)
CREATE TABLE IF NOT EXISTS humor (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  carencia integer DEFAULT 3,
  estresse integer DEFAULT 1,
  energia integer DEFAULT 3,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Table: satisfacao_current (Termômetro do Amor - nível atual)
CREATE TABLE IF NOT EXISTS satisfacao_current (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  level text DEFAULT 'perfect',
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Table: satisfacao_notes (Fiança da Cadeia - notas/missões)
CREATE TABLE IF NOT EXISTS satisfacao_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  note text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Table: satisfacao_history (Histórico de satisfação)
CREATE TABLE IF NOT EXISTS satisfacao_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_user text NOT NULL,
  level text NOT NULL,
  val integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Compatibility columns for Firestore camelCase field names
ALTER TABLE IF EXISTS chats ADD COLUMN IF NOT EXISTS "createdAt" timestamptz DEFAULT now();

ALTER TABLE IF EXISTS mensagens ADD COLUMN IF NOT EXISTS "createdAt" timestamptz DEFAULT now();
ALTER TABLE IF EXISTS mensagens ADD COLUMN IF NOT EXISTS "imageUrl" text;
ALTER TABLE IF EXISTS mensagens ADD COLUMN IF NOT EXISTS "fileType" text;

ALTER TABLE IF EXISTS links ADD COLUMN IF NOT EXISTS timestamp timestamptz DEFAULT now();

ALTER TABLE IF EXISTS mural ADD COLUMN IF NOT EXISTS "text" text;
ALTER TABLE IF EXISTS mural ADD COLUMN IF NOT EXISTS "imageUrl" text;
ALTER TABLE IF EXISTS mural ALTER COLUMN likes SET DEFAULT ARRAY[]::text[];

ALTER TABLE IF EXISTS bucketlist ADD COLUMN IF NOT EXISTS "createdAt" timestamptz DEFAULT now();
ALTER TABLE IF EXISTS capsula ADD COLUMN IF NOT EXISTS "createdAt" timestamptz DEFAULT now();
ALTER TABLE IF EXISTS potepapel ADD COLUMN IF NOT EXISTS "createdAt" timestamptz DEFAULT now();
ALTER TABLE IF EXISTS cupons ADD COLUMN IF NOT EXISTS "createdAt" timestamptz DEFAULT now();

-- Disable Row Level Security (RLS) for initial testing
ALTER TABLE IF EXISTS chats DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS mensagens DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS links DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS mural DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS bucketlist DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS capsula DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS potepapel DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS cupons DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS humor DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS satisfacao_current DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS satisfacao_notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS satisfacao_history DISABLE ROW LEVEL SECURITY;

-- Optional: small indexes to support common ordering queries
CREATE INDEX IF NOT EXISTS idx_chats_created_at ON chats(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mensagens_chat_created_at ON mensagens(chat_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_links_created_at ON links(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mural_created_at ON mural(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bucketlist_created_at ON bucketlist(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cupons_created_at ON cupons(created_at DESC);

-- End of schema
