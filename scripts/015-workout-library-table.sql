-- Tabella Biblioteca Allenamenti
-- Esegui questo script per creare la tabella workout_library

-- Crea tabella workout_library
CREATE TABLE IF NOT EXISTS workout_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES auth.users(id),
  is_public BOOLEAN DEFAULT false,
  name TEXT NOT NULL,
  sport TEXT NOT NULL DEFAULT 'cycling',
  workout_type TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER,
  tss_estimate INTEGER,
  if_estimate DECIMAL(3,2),
  primary_zone TEXT,
  zone_distribution JSONB,
  intervals JSONB,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_workout_library_created_by ON workout_library(created_by);
CREATE INDEX IF NOT EXISTS idx_workout_library_sport ON workout_library(sport);
CREATE INDEX IF NOT EXISTS idx_workout_library_workout_type ON workout_library(workout_type);
CREATE INDEX IF NOT EXISTS idx_workout_library_is_public ON workout_library(is_public);

-- Abilita RLS
ALTER TABLE workout_library ENABLE ROW LEVEL SECURITY;

-- Policy: Visualizza template pubblici o propri
DROP POLICY IF EXISTS "View public workout templates" ON workout_library;
CREATE POLICY "View public workout templates" ON workout_library
  FOR SELECT USING (is_public = true OR created_by = auth.uid());

-- Policy: Gestisci propri template
DROP POLICY IF EXISTS "Manage own workout templates" ON workout_library;
CREATE POLICY "Manage own workout templates" ON workout_library
  FOR ALL USING (created_by = auth.uid());

-- Policy: Coach possono vedere template dei loro atleti
DROP POLICY IF EXISTS "Coaches view athlete templates" ON workout_library;
CREATE POLICY "Coaches view athlete templates" ON workout_library
  FOR SELECT USING (
    created_by IN (
      SELECT user_id FROM athletes 
      WHERE coach_id IN (SELECT id FROM coaches WHERE user_id = auth.uid())
    )
  );

-- Trigger per updated_at
CREATE OR REPLACE FUNCTION update_workout_library_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS workout_library_updated_at ON workout_library;
CREATE TRIGGER workout_library_updated_at
  BEFORE UPDATE ON workout_library
  FOR EACH ROW
  EXECUTE FUNCTION update_workout_library_updated_at();
