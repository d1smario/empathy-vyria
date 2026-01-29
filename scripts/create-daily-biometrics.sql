-- Daily biometrics table for HRV, sleep, vitals, and calculated scores
CREATE TABLE IF NOT EXISTS daily_biometrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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
  
  -- Other vitals
  blood_pressure_sys INTEGER,
  blood_pressure_dia INTEGER,
  body_temperature DECIMAL,
  weight_kg DECIMAL,
  body_fat_pct DECIMAL,
  
  -- Metabolic
  glucose_avg INTEGER,
  glucose_variability DECIMAL,
  cortisol DECIMAL,
  
  -- Calculated scores
  readiness_score INTEGER,
  strain_score DECIMAL,
  recovery_score INTEGER,
  stress_score INTEGER,
  
  -- Source
  source_device VARCHAR(50),
  raw_data JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, date)
);

-- Enable RLS
ALTER TABLE daily_biometrics ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own biometrics" ON daily_biometrics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own biometrics" ON daily_biometrics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own biometrics" ON daily_biometrics
  FOR UPDATE USING (auth.uid() = user_id);

-- Index for fast date lookups
CREATE INDEX IF NOT EXISTS idx_biometrics_user_date ON daily_biometrics(user_id, date DESC);
