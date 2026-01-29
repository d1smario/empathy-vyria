-- AI Adaptive System Tables (Simplified)
-- Run this to create the core AI adaptation tables

-- 1. Activity Deltas - tracks planned vs actual differences
CREATE TABLE IF NOT EXISTS activity_deltas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL,
  activity_id UUID,
  delta_date DATE NOT NULL,
  planned_duration_min INT DEFAULT 0,
  planned_tss INT DEFAULT 0,
  planned_kcal INT DEFAULT 0,
  planned_zone TEXT,
  actual_duration_min INT DEFAULT 0,
  actual_tss INT DEFAULT 0,
  actual_kcal INT DEFAULT 0,
  actual_avg_zone TEXT,
  delta_duration_min INT DEFAULT 0,
  delta_tss INT DEFAULT 0,
  delta_kcal INT DEFAULT 0,
  delta_fatigue_score DECIMAL(5,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Athlete Daily State - dynamic daily status
CREATE TABLE IF NOT EXISTS athlete_daily_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL,
  state_date DATE NOT NULL,
  fatigue_score INT DEFAULT 50,
  recovery_need TEXT DEFAULT 'medium',
  glycogen_status TEXT DEFAULT 'normal',
  kcal_target INT DEFAULT 2000,
  kcal_debt INT DEFAULT 0,
  cho_target_g INT DEFAULT 300,
  pro_target_g INT DEFAULT 120,
  fat_target_g INT DEFAULT 80,
  tss_capacity_today INT DEFAULT 100,
  recommended_zone TEXT DEFAULT 'Z2',
  training_recommendation TEXT,
  nutrition_adjustments JSONB DEFAULT '{}',
  fueling_adjustments JSONB DEFAULT '{}',
  ai_notes TEXT,
  factors_json JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(athlete_id, state_date)
);

-- 3. AI Adaptations Log - history of AI decisions
CREATE TABLE IF NOT EXISTS ai_adaptations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL,
  adaptation_date DATE NOT NULL,
  trigger_type TEXT NOT NULL,
  trigger_data JSONB DEFAULT '{}',
  adaptations JSONB DEFAULT '{}',
  applied BOOLEAN DEFAULT false,
  applied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE activity_deltas ENABLE ROW LEVEL SECURITY;
ALTER TABLE athlete_daily_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_adaptations ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_activity_deltas_athlete_date ON activity_deltas(athlete_id, delta_date);
CREATE INDEX IF NOT EXISTS idx_daily_state_athlete_date ON athlete_daily_state(athlete_id, state_date);
CREATE INDEX IF NOT EXISTS idx_ai_adaptations_athlete_date ON ai_adaptations(athlete_id, adaptation_date);
