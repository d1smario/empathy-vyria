-- AI Adaptive System - Minimal Tables
-- Creates tables without RLS or complex constraints

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
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

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
