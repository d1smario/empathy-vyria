-- Extended Activity Tracking Schema
-- Adds support for GPS data, device integrations, and sensor data

-- Activity GPS Data table for storing route coordinates
CREATE TABLE IF NOT EXISTS public.activity_gps_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES public.training_activities(id) ON DELETE CASCADE,
  timestamp_ms BIGINT NOT NULL,
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  altitude_m DECIMAL(6,1),
  speed_kmh DECIMAL(5,2),
  distance_m DECIMAL(10,2),
  heart_rate INTEGER,
  power_watts INTEGER,
  cadence INTEGER,
  temperature_c DECIMAL(4,1),
  core_temp_c DECIMAL(4,2),
  skin_temp_c DECIMAL(4,2),
  smo2_percent DECIMAL(5,2),
  thb DECIMAL(6,3),
  glucose_mgdl INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gps_data_activity ON public.activity_gps_data(activity_id);
CREATE INDEX IF NOT EXISTS idx_gps_data_timestamp ON public.activity_gps_data(timestamp_ms);

-- Activity Laps table for storing lap/interval data
CREATE TABLE IF NOT EXISTS public.activity_laps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES public.training_activities(id) ON DELETE CASCADE,
  lap_number INTEGER NOT NULL,
  start_time_ms BIGINT,
  duration_seconds INTEGER,
  distance_m DECIMAL(10,2),
  avg_power INTEGER,
  max_power INTEGER,
  avg_hr INTEGER,
  max_hr INTEGER,
  avg_cadence INTEGER,
  avg_speed_kmh DECIMAL(5,2),
  elevation_gain_m INTEGER,
  avg_core_temp_c DECIMAL(4,2),
  avg_smo2 DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_laps_activity ON public.activity_laps(activity_id);

-- Device Connections table for storing API credentials
CREATE TABLE IF NOT EXISTS public.device_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- garmin, strava, whoop, core, moxy, abbott, trainingpeaks
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  external_user_id TEXT,
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  sync_settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_device_connections_user ON public.device_connections(user_id);

-- Daily Metrics table for aggregated daily data
CREATE TABLE IF NOT EXISTS public.daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL,
  -- Training Load
  tss_total INTEGER DEFAULT 0,
  atl DECIMAL(6,2), -- Acute Training Load
  ctl DECIMAL(6,2), -- Chronic Training Load
  tsb DECIMAL(6,2), -- Training Stress Balance
  ramp_rate DECIMAL(5,2),
  -- Activity Summary
  total_duration_minutes INTEGER DEFAULT 0,
  total_distance_km DECIMAL(8,2) DEFAULT 0,
  total_elevation_m INTEGER DEFAULT 0,
  total_calories INTEGER DEFAULT 0,
  activities_count INTEGER DEFAULT 0,
  -- Recovery Metrics (from Whoop, Garmin, etc.)
  hrv_ms DECIMAL(6,2),
  hrv_rmssd DECIMAL(6,2),
  resting_hr INTEGER,
  recovery_score INTEGER,
  sleep_score INTEGER,
  sleep_hours DECIMAL(4,2),
  strain_score DECIMAL(4,1),
  readiness_score INTEGER,
  -- Body Metrics
  weight_kg DECIMAL(5,2),
  body_fat_percent DECIMAL(4,1),
  hydration_percent DECIMAL(4,1),
  -- Glucose (from Abbott)
  avg_glucose_mgdl INTEGER,
  min_glucose_mgdl INTEGER,
  max_glucose_mgdl INTEGER,
  time_in_range_percent INTEGER,
  -- Notes
  notes TEXT,
  wellness_feeling INTEGER, -- 1-5 scale
  fatigue_level INTEGER, -- 1-5 scale
  muscle_soreness INTEGER, -- 1-5 scale
  stress_level INTEGER, -- 1-5 scale
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(athlete_id, metric_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_metrics_athlete ON public.daily_metrics(athlete_id);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_date ON public.daily_metrics(metric_date);

-- Extend training_activities with additional fields
ALTER TABLE public.training_activities 
ADD COLUMN IF NOT EXISTS fit_file_url TEXT,
ADD COLUMN IF NOT EXISTS gpx_file_url TEXT,
ADD COLUMN IF NOT EXISTS polyline TEXT,
ADD COLUMN IF NOT EXISTS avg_core_temp_c DECIMAL(4,2),
ADD COLUMN IF NOT EXISTS max_core_temp_c DECIMAL(4,2),
ADD COLUMN IF NOT EXISTS avg_smo2 DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS min_smo2 DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS avg_glucose_mgdl INTEGER,
ADD COLUMN IF NOT EXISTS hrv_post_activity DECIMAL(6,2),
ADD COLUMN IF NOT EXISTS recovery_time_hours INTEGER,
ADD COLUMN IF NOT EXISTS training_effect_aerobic DECIMAL(3,1),
ADD COLUMN IF NOT EXISTS training_effect_anaerobic DECIMAL(3,1),
ADD COLUMN IF NOT EXISTS vo2max_estimate DECIMAL(4,1),
ADD COLUMN IF NOT EXISTS device_name TEXT,
ADD COLUMN IF NOT EXISTS garmin_activity_id TEXT,
ADD COLUMN IF NOT EXISTS whoop_activity_id TEXT,
ADD COLUMN IF NOT EXISTS core_session_id TEXT;

-- RLS Policies for new tables
ALTER TABLE public.activity_gps_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_laps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_metrics ENABLE ROW LEVEL SECURITY;

-- GPS Data policies
CREATE POLICY "Users can view own GPS data" ON public.activity_gps_data
  FOR SELECT USING (activity_id IN (
    SELECT id FROM public.training_activities WHERE athlete_id IN (
      SELECT id FROM public.athletes WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Users can insert own GPS data" ON public.activity_gps_data
  FOR INSERT WITH CHECK (activity_id IN (
    SELECT id FROM public.training_activities WHERE athlete_id IN (
      SELECT id FROM public.athletes WHERE user_id = auth.uid()
    )
  ));

-- Laps policies
CREATE POLICY "Users can view own laps" ON public.activity_laps
  FOR SELECT USING (activity_id IN (
    SELECT id FROM public.training_activities WHERE athlete_id IN (
      SELECT id FROM public.athletes WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Users can insert own laps" ON public.activity_laps
  FOR INSERT WITH CHECK (activity_id IN (
    SELECT id FROM public.training_activities WHERE athlete_id IN (
      SELECT id FROM public.athletes WHERE user_id = auth.uid()
    )
  ));

-- Device connections policies
CREATE POLICY "Users can view own connections" ON public.device_connections
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own connections" ON public.device_connections
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own connections" ON public.device_connections
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own connections" ON public.device_connections
  FOR DELETE USING (user_id = auth.uid());

-- Daily metrics policies
CREATE POLICY "Users can view own metrics" ON public.daily_metrics
  FOR SELECT USING (athlete_id IN (SELECT id FROM public.athletes WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own metrics" ON public.daily_metrics
  FOR INSERT WITH CHECK (athlete_id IN (SELECT id FROM public.athletes WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own metrics" ON public.daily_metrics
  FOR UPDATE USING (athlete_id IN (SELECT id FROM public.athletes WHERE user_id = auth.uid()));
