-- =====================================================
-- ROOK INTEGRATION - SETUP COMPLETO
-- Esegui questo script in Supabase SQL Editor
-- =====================================================

-- 1. TABELLA PRINCIPALE: user_data_connections
-- Memorizza le connessioni utente ai provider esterni via Rook
CREATE TABLE IF NOT EXISTS user_data_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  athlete_id UUID REFERENCES athletes(id) ON DELETE SET NULL,
  
  -- Provider info
  provider TEXT NOT NULL,
  provider_user_id TEXT,
  
  -- Rook-specific fields
  rook_user_id TEXT NOT NULL,
  
  -- Connection status
  authorized BOOLEAN DEFAULT false,
  connected_at TIMESTAMPTZ,
  last_sync_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'syncing', 'success', 'error', 'disconnected')),
  sync_error TEXT,
  
  -- Metadata
  scopes TEXT[],
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, provider)
);

-- 2. TABELLA: imported_health_data
CREATE TABLE IF NOT EXISTS imported_health_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  athlete_id UUID REFERENCES athletes(id) ON DELETE SET NULL,
  provider TEXT NOT NULL,
  data_type TEXT NOT NULL,
  data_date DATE NOT NULL,
  payload JSONB NOT NULL,
  rook_event_id TEXT,
  rook_user_id TEXT,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider, data_type, data_date, COALESCE(rook_event_id, ''))
);

-- 3. TABELLA: imported_activities
CREATE TABLE IF NOT EXISTS imported_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  athlete_id UUID REFERENCES athletes(id) ON DELETE SET NULL,
  source_provider TEXT NOT NULL,
  source_id TEXT,
  source_url TEXT,
  activity_date DATE NOT NULL,
  activity_datetime TIMESTAMPTZ,
  activity_type TEXT,
  activity_subtype TEXT,
  title TEXT,
  description TEXT,
  duration_seconds INT,
  moving_time_seconds INT,
  elapsed_time_seconds INT,
  distance_meters FLOAT,
  elevation_gain_meters FLOAT,
  calories INT,
  avg_heart_rate INT,
  max_heart_rate INT,
  avg_power INT,
  normalized_power INT,
  tss FLOAT,
  intensity_factor FLOAT,
  training_load FLOAT,
  raw_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, source_provider, source_id)
);

-- 4. TABELLA: imported_sleep_data
CREATE TABLE IF NOT EXISTS imported_sleep_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  athlete_id UUID REFERENCES athletes(id) ON DELETE SET NULL,
  source_provider TEXT NOT NULL,
  sleep_date DATE NOT NULL,
  sleep_start TIMESTAMPTZ,
  sleep_end TIMESTAMPTZ,
  total_sleep_seconds INT,
  deep_sleep_seconds INT,
  light_sleep_seconds INT,
  rem_sleep_seconds INT,
  awake_seconds INT,
  sleep_score INT,
  sleep_efficiency FLOAT,
  avg_heart_rate INT,
  min_heart_rate INT,
  avg_hrv FLOAT,
  respiratory_rate FLOAT,
  raw_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, source_provider, sleep_date)
);

-- 5. TABELLA: imported_body_metrics
CREATE TABLE IF NOT EXISTS imported_body_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  athlete_id UUID REFERENCES athletes(id) ON DELETE SET NULL,
  source_provider TEXT NOT NULL,
  metric_date DATE NOT NULL,
  weight_kg FLOAT,
  body_fat_percent FLOAT,
  muscle_mass_kg FLOAT,
  bone_mass_kg FLOAT,
  water_percent FLOAT,
  bmi FLOAT,
  resting_heart_rate INT,
  hrv_rmssd FLOAT,
  hrv_sdnn FLOAT,
  blood_oxygen FLOAT,
  respiratory_rate FLOAT,
  raw_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, source_provider, metric_date)
);

-- =====================================================
-- INDICI PER PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_udc_user_id ON user_data_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_udc_provider ON user_data_connections(provider);
CREATE INDEX IF NOT EXISTS idx_udc_rook_user_id ON user_data_connections(rook_user_id);
CREATE INDEX IF NOT EXISTS idx_udc_sync_status ON user_data_connections(sync_status);

CREATE INDEX IF NOT EXISTS idx_ihd_user_id ON imported_health_data(user_id);
CREATE INDEX IF NOT EXISTS idx_ihd_data_date ON imported_health_data(data_date);
CREATE INDEX IF NOT EXISTS idx_ihd_data_type ON imported_health_data(data_type);

CREATE INDEX IF NOT EXISTS idx_ia_user_id ON imported_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_ia_activity_date ON imported_activities(activity_date);
CREATE INDEX IF NOT EXISTS idx_ia_source_provider ON imported_activities(source_provider);

CREATE INDEX IF NOT EXISTS idx_isd_user_id ON imported_sleep_data(user_id);
CREATE INDEX IF NOT EXISTS idx_isd_sleep_date ON imported_sleep_data(sleep_date);

CREATE INDEX IF NOT EXISTS idx_ibm_user_id ON imported_body_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_ibm_metric_date ON imported_body_metrics(metric_date);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE user_data_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE imported_health_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE imported_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE imported_sleep_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE imported_body_metrics ENABLE ROW LEVEL SECURITY;

-- user_data_connections policies
DROP POLICY IF EXISTS "Users can view own connections" ON user_data_connections;
CREATE POLICY "Users can view own connections" ON user_data_connections
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own connections" ON user_data_connections;
CREATE POLICY "Users can insert own connections" ON user_data_connections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own connections" ON user_data_connections;
CREATE POLICY "Users can update own connections" ON user_data_connections
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own connections" ON user_data_connections;
CREATE POLICY "Users can delete own connections" ON user_data_connections
  FOR DELETE USING (auth.uid() = user_id);

-- imported_health_data policies
DROP POLICY IF EXISTS "Users can view own health data" ON imported_health_data;
CREATE POLICY "Users can view own health data" ON imported_health_data
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own health data" ON imported_health_data;
CREATE POLICY "Users can insert own health data" ON imported_health_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- imported_activities policies
DROP POLICY IF EXISTS "Users can view own activities" ON imported_activities;
CREATE POLICY "Users can view own activities" ON imported_activities
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own activities" ON imported_activities;
CREATE POLICY "Users can insert own activities" ON imported_activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own activities" ON imported_activities;
CREATE POLICY "Users can update own activities" ON imported_activities
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own activities" ON imported_activities;
CREATE POLICY "Users can delete own activities" ON imported_activities
  FOR DELETE USING (auth.uid() = user_id);

-- imported_sleep_data policies
DROP POLICY IF EXISTS "Users can view own sleep data" ON imported_sleep_data;
CREATE POLICY "Users can view own sleep data" ON imported_sleep_data
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own sleep data" ON imported_sleep_data;
CREATE POLICY "Users can insert own sleep data" ON imported_sleep_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- imported_body_metrics policies
DROP POLICY IF EXISTS "Users can view own body metrics" ON imported_body_metrics;
CREATE POLICY "Users can view own body metrics" ON imported_body_metrics
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own body metrics" ON imported_body_metrics;
CREATE POLICY "Users can insert own body metrics" ON imported_body_metrics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- SERVICE ROLE POLICIES (per webhook e API)
-- =====================================================

DROP POLICY IF EXISTS "Service role full access connections" ON user_data_connections;
CREATE POLICY "Service role full access connections" ON user_data_connections
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "Service role full access health data" ON imported_health_data;
CREATE POLICY "Service role full access health data" ON imported_health_data
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "Service role full access activities" ON imported_activities;
CREATE POLICY "Service role full access activities" ON imported_activities
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "Service role full access sleep" ON imported_sleep_data;
CREATE POLICY "Service role full access sleep" ON imported_sleep_data
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "Service role full access body metrics" ON imported_body_metrics;
CREATE POLICY "Service role full access body metrics" ON imported_body_metrics
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- TRIGGER PER UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_user_data_connections_updated_at ON user_data_connections;
CREATE TRIGGER update_user_data_connections_updated_at
  BEFORE UPDATE ON user_data_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_imported_activities_updated_at ON imported_activities;
CREATE TRIGGER update_imported_activities_updated_at
  BEFORE UPDATE ON imported_activities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VERIFICA FINALE
-- =====================================================
SELECT 'Rook integration tables created successfully!' as status;
