-- =====================================================
-- ROOK INTEGRATIONS SCHEMA
-- TryRook.io integration for health/fitness data aggregation
-- =====================================================

-- Table: user_data_connections
-- Stores user connections to external data providers via Rook
CREATE TABLE IF NOT EXISTS user_data_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  athlete_id UUID REFERENCES athletes(id) ON DELETE SET NULL,
  
  -- Provider info
  provider TEXT NOT NULL, -- 'garmin', 'strava', 'whoop', 'polar', 'oura', 'fitbit', 'trainingpeaks', etc.
  provider_user_id TEXT, -- User ID from the provider (if available)
  
  -- Rook-specific fields
  rook_user_id TEXT NOT NULL, -- User ID in Rook system
  
  -- Connection status
  authorized BOOLEAN DEFAULT false,
  connected_at TIMESTAMPTZ,
  last_sync_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'syncing', 'success', 'error', 'disconnected')),
  sync_error TEXT,
  
  -- Metadata
  scopes TEXT[], -- Authorized scopes
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, provider)
);

-- Table: imported_health_data
-- Raw health data imported from Rook (cached locally)
CREATE TABLE IF NOT EXISTS imported_health_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  athlete_id UUID REFERENCES athletes(id) ON DELETE SET NULL,
  
  -- Source info
  provider TEXT NOT NULL,
  data_type TEXT NOT NULL, -- 'physical_summary', 'sleep_summary', 'body_summary', 'activity_event', etc.
  
  -- Data
  data_date DATE NOT NULL,
  payload JSONB NOT NULL,
  
  -- Rook tracking
  rook_event_id TEXT,
  rook_user_id TEXT,
  
  -- Processing status
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints - prevent duplicates
  UNIQUE(user_id, provider, data_type, data_date, COALESCE(rook_event_id, ''))
);

-- Table: imported_activities
-- Activities imported from external sources, mapped to EMPATHY schema
CREATE TABLE IF NOT EXISTS imported_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  athlete_id UUID REFERENCES athletes(id) ON DELETE SET NULL,
  
  -- Source info
  source_provider TEXT NOT NULL, -- 'garmin', 'strava', 'trainingpeaks', etc.
  source_id TEXT, -- Original activity ID from provider
  source_url TEXT, -- Link to original activity
  
  -- Activity details
  activity_date DATE NOT NULL,
  activity_datetime TIMESTAMPTZ,
  activity_type TEXT, -- 'run', 'bike', 'swim', 'strength', etc.
  activity_subtype TEXT, -- 'easy_run', 'interval', 'long_ride', etc.
  title TEXT,
  description TEXT,
  
  -- Duration & Distance
  duration_seconds INT,
  moving_time_seconds INT,
  elapsed_time_seconds INT,
  distance_meters FLOAT,
  elevation_gain_meters FLOAT,
  elevation_loss_meters FLOAT,
  
  -- Physiological data
  calories INT,
  avg_heart_rate INT,
  max_heart_rate INT,
  min_heart_rate INT,
  avg_cadence FLOAT,
  avg_speed_mps FLOAT, -- meters per second
  max_speed_mps FLOAT,
  
  -- Power data (cycling)
  avg_power_watts FLOAT,
  max_power_watts FLOAT,
  normalized_power FLOAT,
  intensity_factor FLOAT,
  variability_index FLOAT,
  
  -- Training metrics
  tss FLOAT, -- Training Stress Score
  training_load FLOAT,
  trimp FLOAT, -- Training Impulse
  hrss FLOAT, -- Heart Rate Stress Score
  
  -- Zones (as JSONB for flexibility)
  hr_zones JSONB, -- {z1: 300, z2: 600, z3: 400, ...} in seconds
  power_zones JSONB,
  pace_zones JSONB,
  
  -- Location
  start_lat FLOAT,
  start_lng FLOAT,
  end_lat FLOAT,
  end_lng FLOAT,
  polyline TEXT, -- Encoded polyline for map
  
  -- Weather (if available)
  weather_temp_c FLOAT,
  weather_humidity INT,
  weather_wind_mps FLOAT,
  weather_conditions TEXT,
  
  -- Equipment
  gear_id TEXT,
  gear_name TEXT,
  
  -- Raw data
  raw_data JSONB,
  
  -- Linking to planned workouts
  linked_workout_id UUID REFERENCES athlete_workouts(id) ON DELETE SET NULL,
  compliance_score FLOAT, -- 0-100, how well actual matched planned
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, source_provider, source_id)
);

-- Table: imported_sleep_data
-- Sleep data from wearables
CREATE TABLE IF NOT EXISTS imported_sleep_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  athlete_id UUID REFERENCES athletes(id) ON DELETE SET NULL,
  
  -- Source
  source_provider TEXT NOT NULL,
  source_id TEXT,
  
  -- Sleep timing
  sleep_date DATE NOT NULL, -- Date the sleep is attributed to
  bed_time TIMESTAMPTZ,
  wake_time TIMESTAMPTZ,
  
  -- Duration (in minutes)
  total_sleep_minutes INT,
  time_in_bed_minutes INT,
  time_to_fall_asleep_minutes INT,
  awake_minutes INT,
  
  -- Sleep stages (in minutes)
  light_sleep_minutes INT,
  deep_sleep_minutes INT,
  rem_sleep_minutes INT,
  
  -- Quality metrics
  sleep_efficiency FLOAT, -- Percentage
  sleep_score INT, -- 0-100 if provider gives one
  restfulness_score FLOAT,
  
  -- Physiological during sleep
  avg_heart_rate INT,
  min_heart_rate INT,
  avg_hrv_ms FLOAT, -- Heart Rate Variability
  avg_respiratory_rate FLOAT,
  avg_spo2 FLOAT, -- Blood oxygen
  
  -- Raw data
  raw_data JSONB,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, source_provider, sleep_date)
);

-- Table: imported_body_metrics
-- Body composition and daily metrics
CREATE TABLE IF NOT EXISTS imported_body_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  athlete_id UUID REFERENCES athletes(id) ON DELETE SET NULL,
  
  -- Source
  source_provider TEXT NOT NULL,
  
  -- Date
  metric_date DATE NOT NULL,
  
  -- Body composition
  weight_kg FLOAT,
  body_fat_percentage FLOAT,
  muscle_mass_kg FLOAT,
  bone_mass_kg FLOAT,
  water_percentage FLOAT,
  bmi FLOAT,
  
  -- Daily vitals
  resting_heart_rate INT,
  hrv_ms FLOAT,
  respiratory_rate FLOAT,
  spo2 FLOAT,
  blood_pressure_systolic INT,
  blood_pressure_diastolic INT,
  
  -- Recovery/Readiness scores (from Whoop, Oura, etc.)
  recovery_score FLOAT, -- 0-100
  readiness_score FLOAT, -- 0-100
  strain_score FLOAT, -- Whoop strain
  
  -- Activity summary
  steps INT,
  active_calories INT,
  total_calories INT,
  active_minutes INT,
  floors_climbed INT,
  
  -- Raw data
  raw_data JSONB,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, source_provider, metric_date)
);

-- Table: rook_webhook_logs
-- Log all incoming webhooks for debugging
CREATE TABLE IF NOT EXISTS rook_webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Webhook info
  event_type TEXT NOT NULL,
  rook_user_id TEXT,
  provider TEXT,
  
  -- Payload
  payload JSONB NOT NULL,
  headers JSONB,
  
  -- Processing
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  processing_error TEXT,
  
  -- Timestamps
  received_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

-- user_data_connections
CREATE INDEX IF NOT EXISTS idx_udc_user_id ON user_data_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_udc_provider ON user_data_connections(provider);
CREATE INDEX IF NOT EXISTS idx_udc_rook_user_id ON user_data_connections(rook_user_id);
CREATE INDEX IF NOT EXISTS idx_udc_sync_status ON user_data_connections(sync_status);

-- imported_health_data
CREATE INDEX IF NOT EXISTS idx_ihd_user_id ON imported_health_data(user_id);
CREATE INDEX IF NOT EXISTS idx_ihd_data_date ON imported_health_data(data_date);
CREATE INDEX IF NOT EXISTS idx_ihd_data_type ON imported_health_data(data_type);
CREATE INDEX IF NOT EXISTS idx_ihd_provider ON imported_health_data(provider);
CREATE INDEX IF NOT EXISTS idx_ihd_processed ON imported_health_data(processed) WHERE processed = false;

-- imported_activities
CREATE INDEX IF NOT EXISTS idx_ia_user_id ON imported_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_ia_athlete_id ON imported_activities(athlete_id);
CREATE INDEX IF NOT EXISTS idx_ia_activity_date ON imported_activities(activity_date);
CREATE INDEX IF NOT EXISTS idx_ia_provider ON imported_activities(source_provider);
CREATE INDEX IF NOT EXISTS idx_ia_type ON imported_activities(activity_type);

-- imported_sleep_data
CREATE INDEX IF NOT EXISTS idx_isd_user_id ON imported_sleep_data(user_id);
CREATE INDEX IF NOT EXISTS idx_isd_sleep_date ON imported_sleep_data(sleep_date);

-- imported_body_metrics
CREATE INDEX IF NOT EXISTS idx_ibm_user_id ON imported_body_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_ibm_metric_date ON imported_body_metrics(metric_date);

-- rook_webhook_logs
CREATE INDEX IF NOT EXISTS idx_rwl_event_type ON rook_webhook_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_rwl_received_at ON rook_webhook_logs(received_at);
CREATE INDEX IF NOT EXISTS idx_rwl_processed ON rook_webhook_logs(processed) WHERE processed = false;

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE user_data_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE imported_health_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE imported_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE imported_sleep_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE imported_body_metrics ENABLE ROW LEVEL SECURITY;

-- user_data_connections policies
CREATE POLICY "Users can view own connections" ON user_data_connections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own connections" ON user_data_connections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own connections" ON user_data_connections
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own connections" ON user_data_connections
  FOR DELETE USING (auth.uid() = user_id);

-- imported_health_data policies
CREATE POLICY "Users can view own health data" ON imported_health_data
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert health data" ON imported_health_data
  FOR INSERT WITH CHECK (true); -- Webhook inserts with service role

-- imported_activities policies
CREATE POLICY "Users can view own activities" ON imported_activities
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own activities" ON imported_activities
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert activities" ON imported_activities
  FOR INSERT WITH CHECK (true);

-- imported_sleep_data policies
CREATE POLICY "Users can view own sleep data" ON imported_sleep_data
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert sleep data" ON imported_sleep_data
  FOR INSERT WITH CHECK (true);

-- imported_body_metrics policies
CREATE POLICY "Users can view own body metrics" ON imported_body_metrics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert body metrics" ON imported_body_metrics
  FOR INSERT WITH CHECK (true);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
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

-- Function to get user's Rook ID (creates one if doesn't exist)
CREATE OR REPLACE FUNCTION get_or_create_rook_user_id(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_rook_user_id TEXT;
BEGIN
  -- Check if user already has a Rook ID in any connection
  SELECT rook_user_id INTO v_rook_user_id
  FROM user_data_connections
  WHERE user_id = p_user_id
  LIMIT 1;
  
  -- If not found, generate one based on user UUID
  IF v_rook_user_id IS NULL THEN
    v_rook_user_id := 'empathy_' || REPLACE(p_user_id::TEXT, '-', '');
  END IF;
  
  RETURN v_rook_user_id;
END;
$$ LANGUAGE plpgsql;
