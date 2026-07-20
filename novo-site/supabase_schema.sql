-- Estrutura principal das tabelas do site.
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

-- Table: gallery (Galeria de fotos para páginas de imagem)
CREATE TABLE IF NOT EXISTS gallery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  album text DEFAULT 'Memórias',
  title text,
  description text,
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

-- O acesso compartilhado atual depende de RLS desativado.
ALTER TABLE IF EXISTS chats DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS mensagens DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS links DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS mural DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS bucketlist DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS capsula DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS potepapel DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS cupons DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS gallery DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS humor DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS satisfacao_current DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS satisfacao_notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS satisfacao_history DISABLE ROW LEVEL SECURITY;

-- Índices usados nas ordenações mais frequentes.
CREATE INDEX IF NOT EXISTS idx_chats_created_at ON chats(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mensagens_chat_created_at ON mensagens(chat_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_links_created_at ON links(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mural_created_at ON mural(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bucketlist_created_at ON bucketlist(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cupons_created_at ON cupons(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gallery_created_at ON gallery(created_at DESC);


-- Ajustes de compatibilidade do schema.
-- Não remove dados nem altera as tabelas de humor e satisfação.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  created_at timestamptz NOT NULL DEFAULT now(),
  "createdAt" timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mensagens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid,
  role text,
  content text,
  text text,
  image_url text,
  "imageUrl" text,
  file_type text,
  "fileType" text,
  created_at timestamptz NOT NULL DEFAULT now(),
  "createdAt" timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text,
  title text,
  description text,
  image text,
  trust integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  timestamp timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mural (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text,
  text text,
  author text,
  image_url text,
  "imageUrl" text,
  likes text[] DEFAULT ARRAY[]::text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  timestamp timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bucketlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text,
  text text,
  completed boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  "createdAt" timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS capsula (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message text,
  unlock_date timestamptz,
  "unlockDate" timestamptz,
  unlocked boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  "createdAt" timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS potepapel (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  "createdAt" timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  description text,
  reward text,
  redeemed boolean DEFAULT false,
  source text,
  created_at timestamptz NOT NULL DEFAULT now(),
  "createdAt" timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS gallery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text,
  album text DEFAULT 'Memórias',
  title text,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE chats ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE chats ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE chats ADD COLUMN IF NOT EXISTS "createdAt" timestamptz DEFAULT now();
ALTER TABLE chats ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE chats ALTER COLUMN "createdAt" SET DEFAULT now();

ALTER TABLE mensagens ADD COLUMN IF NOT EXISTS chat_id uuid;
ALTER TABLE mensagens ADD COLUMN IF NOT EXISTS role text;
ALTER TABLE mensagens ADD COLUMN IF NOT EXISTS content text;
ALTER TABLE mensagens ADD COLUMN IF NOT EXISTS text text;
ALTER TABLE mensagens ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE mensagens ADD COLUMN IF NOT EXISTS "imageUrl" text;
ALTER TABLE mensagens ADD COLUMN IF NOT EXISTS file_type text;
ALTER TABLE mensagens ADD COLUMN IF NOT EXISTS "fileType" text;
ALTER TABLE mensagens ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE mensagens ADD COLUMN IF NOT EXISTS "createdAt" timestamptz DEFAULT now();
ALTER TABLE mensagens ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE mensagens ALTER COLUMN "createdAt" SET DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'mensagens_chat_id_fkey'
      AND conrelid = 'mensagens'::regclass
  ) THEN
    ALTER TABLE mensagens
      ADD CONSTRAINT mensagens_chat_id_fkey
      FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Skipping mensagens.chat_id foreign key: %', SQLERRM;
END $$;

ALTER TABLE links ADD COLUMN IF NOT EXISTS url text;
ALTER TABLE links ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE links ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE links ADD COLUMN IF NOT EXISTS image text;
ALTER TABLE links ADD COLUMN IF NOT EXISTS trust integer DEFAULT 0;
ALTER TABLE links ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE links ADD COLUMN IF NOT EXISTS timestamp timestamptz DEFAULT now();
ALTER TABLE links ALTER COLUMN trust SET DEFAULT 0;
ALTER TABLE links ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE links ALTER COLUMN timestamp SET DEFAULT now();

ALTER TABLE mural ADD COLUMN IF NOT EXISTS content text;
ALTER TABLE mural ADD COLUMN IF NOT EXISTS text text;
ALTER TABLE mural ADD COLUMN IF NOT EXISTS author text;
ALTER TABLE mural ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE mural ADD COLUMN IF NOT EXISTS "imageUrl" text;
ALTER TABLE mural ADD COLUMN IF NOT EXISTS likes text[] DEFAULT ARRAY[]::text[];
ALTER TABLE mural ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE mural ADD COLUMN IF NOT EXISTS timestamp timestamptz DEFAULT now();
ALTER TABLE mural ALTER COLUMN likes SET DEFAULT ARRAY[]::text[];
ALTER TABLE mural ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE mural ALTER COLUMN timestamp SET DEFAULT now();

ALTER TABLE bucketlist ADD COLUMN IF NOT EXISTS content text;
ALTER TABLE bucketlist ADD COLUMN IF NOT EXISTS text text;
ALTER TABLE bucketlist ADD COLUMN IF NOT EXISTS completed boolean DEFAULT false;
ALTER TABLE bucketlist ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE bucketlist ADD COLUMN IF NOT EXISTS "createdAt" timestamptz DEFAULT now();
ALTER TABLE bucketlist ALTER COLUMN completed SET DEFAULT false;
ALTER TABLE bucketlist ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE bucketlist ALTER COLUMN "createdAt" SET DEFAULT now();

ALTER TABLE capsula ADD COLUMN IF NOT EXISTS message text;
ALTER TABLE capsula ADD COLUMN IF NOT EXISTS unlock_date timestamptz;
ALTER TABLE capsula ADD COLUMN IF NOT EXISTS "unlockDate" timestamptz;
ALTER TABLE capsula ADD COLUMN IF NOT EXISTS unlocked boolean DEFAULT false;
ALTER TABLE capsula ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE capsula ADD COLUMN IF NOT EXISTS "createdAt" timestamptz DEFAULT now();
ALTER TABLE capsula ALTER COLUMN unlocked SET DEFAULT false;
ALTER TABLE capsula ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE capsula ALTER COLUMN "createdAt" SET DEFAULT now();

ALTER TABLE potepapel ADD COLUMN IF NOT EXISTS message text;
ALTER TABLE potepapel ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE potepapel ADD COLUMN IF NOT EXISTS "createdAt" timestamptz DEFAULT now();
ALTER TABLE potepapel ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE potepapel ALTER COLUMN "createdAt" SET DEFAULT now();

ALTER TABLE cupons ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE cupons ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE cupons ADD COLUMN IF NOT EXISTS reward text;
ALTER TABLE cupons ADD COLUMN IF NOT EXISTS redeemed boolean DEFAULT false;
ALTER TABLE cupons ADD COLUMN IF NOT EXISTS source text;
ALTER TABLE cupons ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE cupons ADD COLUMN IF NOT EXISTS "createdAt" timestamptz DEFAULT now();
ALTER TABLE cupons ALTER COLUMN redeemed SET DEFAULT false;
ALTER TABLE cupons ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE cupons ALTER COLUMN "createdAt" SET DEFAULT now();

ALTER TABLE gallery ADD COLUMN IF NOT EXISTS url text;
ALTER TABLE gallery ADD COLUMN IF NOT EXISTS album text DEFAULT 'Memórias';
ALTER TABLE gallery ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE gallery ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE gallery ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE gallery ALTER COLUMN album SET DEFAULT 'Memórias';
ALTER TABLE gallery ALTER COLUMN created_at SET DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_chats_created_at ON chats(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mensagens_chat_created_at ON mensagens(chat_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_links_created_at ON links(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mural_created_at ON mural(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bucketlist_created_at ON bucketlist(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_capsula_created_at ON capsula(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_potepapel_created_at ON potepapel(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cupons_created_at ON cupons(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gallery_created_at ON gallery(created_at DESC);

ALTER TABLE IF EXISTS chats DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS mensagens DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS links DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS mural DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS bucketlist DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS capsula DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS potepapel DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS cupons DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS gallery DISABLE ROW LEVEL SECURITY;
