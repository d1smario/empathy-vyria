-- EMPATHY Biometrics & Adaptive System Schema
-- Daily biometrics from devices (Garmin, Whoop, Oura, Apple, etc.)

CREATE TABLE IF NOT EXISTS daily_biometrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  -- HRV & Heart
  hrv_rmssd DECIMAL,
  hrv_sdnn DECIMAL,
  hr_resting INTEGER,
  hr_sleeping_avg INTEGER,
  hr_sleeping_min INTEGER,
  hr_max_day INTEGER,
  
  -- Respiratory
  respiratory_rate DECIMAL,
  spo2_avg DECIMAL,
  spo2_min DECIMAL,
  
  -- Sleep
  sleep_duration_min INTEGER,
  sleep_deep_min INTEGER,
  sleep_rem_min INTEGER,
  sleep_light_min INTEGER,
  sleep_awake_min INTEGER,
  sleep_score INTEGER,
  sleep_start_time TIME,
  sleep_end_time TIME,
  
  -- Other vitals
  blood_pressure_sys INTEGER,
  blood_pressure_dia INTEGER,
  body_temperature DECIMAL,
  skin_temperature DECIMAL,
  weight_kg DECIMAL,
  body_fat_pct DECIMAL,
  
  -- Metabolic (CGM, lab)
  glucose_avg INTEGER,
  glucose_min INTEGER,
  glucose_max INTEGER,
  glucose_variability DECIMAL,
  cortisol DECIMAL,
  
  -- Calculated scores
  readiness_score INTEGER,
  strain_score DECIMAL,
  recovery_score INTEGER,
  stress_score INTEGER,
  
  -- Source tracking
  source_device VARCHAR(50),
  raw_data JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, date)
);

-- Plan adaptations tracking
CREATE TABLE IF NOT EXISTS plan_adaptations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  activity_id UUID REFERENCES training_activities(id) ON DELETE SET NULL,
  
  original_tss INTEGER,
  adapted_tss INTEGER,
  original_duration_min INTEGER,
  adapted_duration_min INTEGER,
  adaptation_reason VARCHAR(50),
  adaptation_pct DECIMAL,
  
  readiness_score INTEGER,
  vyria_suggestion JSONB,
  coach_override BOOLEAN DEFAULT FALSE,
  coach_notes TEXT,
  
  applied BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Extend training_activities with actual workout data and feedback
ALTER TABLE training_activities 
ADD COLUMN IF NOT EXISTS actual_duration_min INTEGER,
ADD COLUMN IF NOT EXISTS actual_tss INTEGER,
ADD COLUMN IF NOT EXISTS actual_np INTEGER,
ADD COLUMN IF NOT EXISTS actual_if DECIMAL,
ADD COLUMN IF NOT EXISTS actual_kj INTEGER,
ADD COLUMN IF NOT EXISTS hr_avg INTEGER,
ADD COLUMN IF NOT EXISTS hr_max INTEGER,
ADD COLUMN IF NOT EXISTS hr_zones JSONB,
ADD COLUMN IF NOT EXISTS hr_recovery_1min INTEGER,
ADD COLUMN IF NOT EXISTS hrv_post_workout INTEGER,
ADD COLUMN IF NOT EXISTS rpe INTEGER,
ADD COLUMN IF NOT EXISTS feeling VARCHAR(20),
ADD COLUMN IF NOT EXISTS feedback_notes TEXT,
ADD COLUMN IF NOT EXISTS compliance_pct INTEGER,
ADD COLUMN IF NOT EXISTS source VARCHAR(20) DEFAULT 'planned',
ADD COLUMN IF NOT EXISTS fit_file_id UUID;

-- Workout library/templates
CREATE TABLE IF NOT EXISTS workout_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  name VARCHAR(200) NOT NULL,
  sport VARCHAR(50) NOT NULL,
  workout_type VARCHAR(50),
  
  duration_min INTEGER,
  tss_target INTEGER,
  intensity_factor DECIMAL,
  
  description TEXT,
  structure JSONB,
  zones_distribution JSONB,
  
  tags TEXT[],
  is_template BOOLEAN DEFAULT FALSE,
  is_public BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE daily_biometrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_adaptations ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own biometrics" ON daily_biometrics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own biometrics" ON daily_biometrics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own biometrics" ON daily_biometrics
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own adaptations" ON plan_adaptations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own adaptations" ON plan_adaptations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own library" ON workout_library
  FOR SELECT USING (auth.uid() = user_id OR is_public = TRUE);

CREATE POLICY "Users can manage own library" ON workout_library
  FOR ALL USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_biometrics_user_date ON daily_biometrics(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_adaptations_user_date ON plan_adaptations(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_library_user_sport ON workout_library(user_id, sport);
CREATE INDEX IF NOT EXISTS idx_library_tags ON workout_library USING GIN(tags);
