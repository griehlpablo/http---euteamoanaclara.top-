CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS daily_health_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  person text NOT NULL CHECK (person IN ('pablo', 'ana_clara')),
  log_date date NOT NULL,
  weight_kg numeric NULL,
  wake_time text NULL,
  sleep_time text NULL,
  water_ml integer DEFAULT 0,
  walked boolean DEFAULT false,
  walked_km numeric NULL,
  used_uber boolean DEFAULT false,
  workout text NULL,
  mood text NULL,
  appetite text NULL,
  notes text NULL,
  meals jsonb NOT NULL DEFAULT '{}'::jsonb,
  totals jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text DEFAULT 'empty',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS daily_health_logs_person_log_date_key
  ON daily_health_logs (person, log_date);

CREATE INDEX IF NOT EXISTS idx_daily_health_logs_log_date
  ON daily_health_logs (log_date DESC);

CREATE OR REPLACE FUNCTION set_daily_health_logs_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_daily_health_logs_updated_at ON daily_health_logs;

CREATE TRIGGER trg_daily_health_logs_updated_at
BEFORE UPDATE ON daily_health_logs
FOR EACH ROW
EXECUTE FUNCTION set_daily_health_logs_updated_at();

-- Current project tables are configured without RLS for simple shared use.
-- To keep the new page working the same way right now:
ALTER TABLE IF EXISTS daily_health_logs DISABLE ROW LEVEL SECURITY;

-- Safer auth-ready setup for later:
-- 1. Enable login in the app.
-- 2. Run the block below instead of the DISABLE statement above.
--
-- ALTER TABLE daily_health_logs ENABLE ROW LEVEL SECURITY;
--
-- CREATE POLICY "Users can read their own health logs"
--   ON daily_health_logs
--   FOR SELECT
--   USING (auth.uid() = user_id);
--
-- CREATE POLICY "Users can insert their own health logs"
--   ON daily_health_logs
--   FOR INSERT
--   WITH CHECK (auth.uid() = user_id);
--
-- CREATE POLICY "Users can update their own health logs"
--   ON daily_health_logs
--   FOR UPDATE
--   USING (auth.uid() = user_id)
--   WITH CHECK (auth.uid() = user_id);
