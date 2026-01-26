-- =====================================================
-- EMPATHY AI ADAPTIVE SYSTEM SCHEMA
-- Version 1.0
-- =====================================================
-- This schema enables real-time adaptation based on
-- planned vs actual training deltas
-- =====================================================

-- 1. ACTIVITY DELTAS
-- Tracks difference between planned and executed workouts
CREATE TABLE IF NOT EXISTS activity_deltas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES training_activities(id) ON DELETE SET NULL,
  planned_workout_id UUID REFERENCES planned_workouts(id) ON DELETE SET NULL,
  delta_date DATE NOT NULL,
  
  -- Planned values
  planned_duration_min INT DEFAULT 0,
  planned_tss INT DEFAULT 0,
  planned_kcal INT DEFAULT 0,
  planned_zone TEXT,
  planned_intensity TEXT, -- 'recovery', 'endurance', 'tempo', 'threshold', 'vo2max'
  
  -- Actual values  
  actual_duration_min INT DEFAULT 0,
  actual_tss INT DEFAULT 0,
  actual_kcal INT DEFAULT 0,
  actual_avg_zone TEXT,
  actual_avg_hr INT,
  actual_avg_power INT,
  actual_np INT, -- normalized power
  actual_if DECIMAL(3,2), -- intensity factor
  
  -- Calculated deltas
  delta_duration_min INT GENERATED ALWAYS AS (actual_duration_min - planned_duration_min) STORED,
  delta_tss INT GENERATED ALWAYS AS (actual_tss - planned_tss) STORED,
  delta_kcal INT GENERATED ALWAYS AS (actual_kcal - planned_kcal) STORED,
  
  -- Fatigue impact score (calculated by system)
  fatigue_impact_score DECIMAL(5,2) DEFAULT 0,
  glycogen_impact TEXT, -- 'high_depletion', 'moderate', 'low', 'none'
  
  -- Metadata
  sync_source TEXT, -- 'garmin', 'strava', 'wahoo', 'manual'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes for fast queries
  CONSTRAINT unique_activity_delta UNIQUE(athlete_id, activity_id)
);

CREATE INDEX IF NOT EXISTS idx_activity_deltas_athlete_date ON activity_deltas(athlete_id, delta_date DESC);
CREATE INDEX IF NOT EXISTS idx_activity_deltas_date ON activity_deltas(delta_date DESC);


-- 2. ATHLETE DAILY STATE
-- Dynamic daily snapshot that drives all generation logic
CREATE TABLE IF NOT EXISTS athlete_daily_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  state_date DATE NOT NULL,
  
  -- ===== FATIGUE & RECOVERY =====
  fatigue_score INT DEFAULT 50, -- 0-100, higher = more fatigued
  acute_fatigue INT DEFAULT 0, -- ATL-like, short term load
  chronic_fitness INT DEFAULT 0, -- CTL-like, long term fitness
  form_score INT DEFAULT 0, -- TSB-like, freshness
  recovery_need TEXT DEFAULT 'medium', -- 'critical', 'high', 'medium', 'low', 'none'
  hours_since_last_workout INT,
  
  -- ===== ENERGY STATUS =====
  glycogen_status TEXT DEFAULT 'normal', -- 'depleted', 'low', 'normal', 'loaded', 'supercompensated'
  glycogen_percent INT DEFAULT 70, -- 0-100% estimated muscle glycogen
  hydration_status TEXT DEFAULT 'normal', -- 'dehydrated', 'low', 'normal', 'optimal'
  
  -- ===== CALORIC BALANCE =====
  bmr_today INT, -- basal metabolic rate for today
  tdee_today INT, -- total daily energy expenditure target
  kcal_target INT, -- daily caloric target (TDEE + adjustments)
  kcal_consumed INT DEFAULT 0, -- tracked intake
  kcal_burned_activity INT DEFAULT 0, -- from activities
  kcal_balance INT DEFAULT 0, -- surplus/deficit
  kcal_debt_accumulated INT DEFAULT 0, -- multi-day deficit to recover
  
  -- ===== MACROS TARGETS (adjusted) =====
  cho_target_g INT, -- carbs target
  pro_target_g INT, -- protein target
  fat_target_g INT, -- fat target
  cho_per_kg DECIMAL(4,2), -- g/kg body weight
  pro_per_kg DECIMAL(4,2),
  fat_per_kg DECIMAL(4,2),
  
  -- ===== TRAINING CAPACITY =====
  tss_capacity_today INT, -- max TSS recommended
  max_zone_today INT DEFAULT 5, -- highest zone allowed
  recommended_workout_type TEXT, -- 'rest', 'recovery', 'endurance', 'tempo', 'intervals'
  training_readiness_score INT DEFAULT 70, -- 0-100
  
  -- ===== FUELING ADJUSTMENTS =====
  pre_workout_cho_g INT, -- adjusted pre-workout carbs
  intra_workout_cho_per_hour INT, -- g/hour during workout
  post_workout_pro_g INT, -- recovery protein
  hydration_ml_per_hour INT, -- fluid intake target
  
  -- ===== SLEEP & HRV (from wearables) =====
  sleep_score INT, -- 0-100
  sleep_hours DECIMAL(4,2),
  hrv_msec INT,
  resting_hr INT,
  hrv_trend TEXT, -- 'declining', 'stable', 'improving'
  
  -- ===== AI REASONING =====
  ai_summary TEXT, -- human readable summary
  adaptation_factors JSONB, -- factors that influenced this state
  confidence_score INT DEFAULT 80, -- 0-100, how confident AI is
  
  -- Metadata
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_athlete_daily_state UNIQUE(athlete_id, state_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_state_athlete_date ON athlete_daily_state(athlete_id, state_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_state_date ON athlete_daily_state(state_date DESC);


-- 3. AI ADAPTATIONS LOG
-- Audit trail of all AI decisions and parameter changes
CREATE TABLE IF NOT EXISTS ai_adaptations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  
  -- Trigger info
  trigger_type TEXT NOT NULL, -- 'activity_sync', 'test_upload', 'daily_refresh', 'manual', 'wearable_sync'
  trigger_source TEXT, -- 'garmin', 'strava', 'coach', 'system'
  trigger_data JSONB, -- raw data that triggered adaptation
  
  -- What was adapted
  affected_sections TEXT[], -- ['nutrition', 'training', 'fueling', 'recovery']
  adaptations JSONB NOT NULL, -- detailed changes per section
  /*
    Example adaptations JSONB:
    {
      "nutrition": {
        "kcal_delta": +400,
        "cho_delta_percent": +10,
        "reason": "compensate 600 kcal deficit from yesterday"
      },
      "training": {
        "tss_multiplier": 0.6,
        "max_zone": 2,
        "reason": "high fatigue score, need recovery"
      },
      "fueling": {
        "pre_cho_delta": +20,
        "intra_cho_delta": +10,
        "reason": "glycogen depleted"
      }
    }
  */
  
  -- State before/after
  state_before JSONB, -- snapshot of daily_state before
  state_after JSONB, -- snapshot after adaptations
  
  -- Status
  status TEXT DEFAULT 'applied', -- 'pending', 'applied', 'rejected', 'expired'
  applied_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ, -- when this adaptation is no longer valid
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_adaptations_athlete ON ai_adaptations(athlete_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_adaptations_trigger ON ai_adaptations(trigger_type);
CREATE INDEX IF NOT EXISTS idx_adaptations_status ON ai_adaptations(status);


-- 4. EMPATHY RULES ENGINE
-- Configurable rules that define how AI adapts
CREATE TABLE IF NOT EXISTS empathy_adaptation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name TEXT NOT NULL UNIQUE,
  rule_category TEXT NOT NULL, -- 'fatigue', 'nutrition', 'recovery', 'performance'
  
  -- Condition (when to apply)
  condition_field TEXT NOT NULL, -- e.g., 'fatigue_score', 'glycogen_status', 'delta_tss'
  condition_operator TEXT NOT NULL, -- '>', '<', '>=', '<=', '==', 'in'
  condition_value TEXT NOT NULL, -- the threshold value
  
  -- Action (what to do)
  action_section TEXT NOT NULL, -- 'nutrition', 'training', 'fueling', 'recovery'
  action_field TEXT NOT NULL, -- e.g., 'kcal_target', 'tss_capacity', 'cho_target_g'
  action_operator TEXT NOT NULL, -- 'add', 'subtract', 'multiply', 'set'
  action_value TEXT NOT NULL, -- the adjustment value
  
  -- Priority and metadata
  priority INT DEFAULT 50, -- higher = applied first
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default EMPATHY rules
INSERT INTO empathy_adaptation_rules (rule_name, rule_category, condition_field, condition_operator, condition_value, action_section, action_field, action_operator, action_value, priority, description) VALUES
-- Fatigue rules
('high_fatigue_reduce_tss', 'fatigue', 'fatigue_score', '>=', '75', 'training', 'tss_capacity_today', 'multiply', '0.5', 100, 'Reduce TSS capacity by 50% when fatigue is high'),
('high_fatigue_limit_zone', 'fatigue', 'fatigue_score', '>=', '75', 'training', 'max_zone_today', 'set', '2', 99, 'Limit to Z2 when highly fatigued'),
('moderate_fatigue_reduce_tss', 'fatigue', 'fatigue_score', '>=', '60', 'training', 'tss_capacity_today', 'multiply', '0.75', 80, 'Reduce TSS by 25% when moderately fatigued'),

-- Glycogen rules
('depleted_glycogen_boost_cho', 'nutrition', 'glycogen_status', '==', 'depleted', 'nutrition', 'cho_per_kg', 'set', '8', 95, 'Boost carbs to 8g/kg when glycogen depleted'),
('low_glycogen_increase_cho', 'nutrition', 'glycogen_status', '==', 'low', 'nutrition', 'cho_per_kg', 'set', '6', 85, 'Increase carbs to 6g/kg when glycogen low'),
('depleted_glycogen_pre_workout', 'nutrition', 'glycogen_status', '==', 'depleted', 'fueling', 'pre_workout_cho_g', 'add', '30', 90, 'Add 30g pre-workout CHO when depleted'),

-- Caloric deficit rules  
('large_deficit_compensate', 'nutrition', 'kcal_debt_accumulated', '>=', '500', 'nutrition', 'kcal_target', 'add', '400', 85, 'Add 400 kcal when deficit exceeds 500'),
('moderate_deficit_compensate', 'nutrition', 'kcal_debt_accumulated', '>=', '300', 'nutrition', 'kcal_target', 'add', '200', 75, 'Add 200 kcal when deficit exceeds 300'),

-- Recovery rules
('critical_recovery_rest', 'recovery', 'recovery_need', '==', 'critical', 'training', 'recommended_workout_type', 'set', 'rest', 100, 'Force rest day when recovery is critical'),
('high_recovery_easy', 'recovery', 'recovery_need', '==', 'high', 'training', 'recommended_workout_type', 'set', 'recovery', 90, 'Only recovery workouts when recovery need is high'),

-- HRV rules
('low_hrv_reduce_intensity', 'recovery', 'hrv_trend', '==', 'declining', 'training', 'tss_capacity_today', 'multiply', '0.7', 85, 'Reduce TSS when HRV is declining'),
('low_hrv_limit_zone', 'recovery', 'hrv_trend', '==', 'declining', 'training', 'max_zone_today', 'set', '3', 84, 'Limit to Z3 max when HRV declining')

ON CONFLICT (rule_name) DO NOTHING;


-- 5. Enable RLS
ALTER TABLE activity_deltas ENABLE ROW LEVEL SECURITY;
ALTER TABLE athlete_daily_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_adaptations ENABLE ROW LEVEL SECURITY;
ALTER TABLE empathy_adaptation_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own activity deltas" ON activity_deltas
  FOR SELECT USING (athlete_id IN (SELECT id FROM athletes WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own activity deltas" ON activity_deltas
  FOR INSERT WITH CHECK (athlete_id IN (SELECT id FROM athletes WHERE user_id = auth.uid()));

CREATE POLICY "Users can view own daily state" ON athlete_daily_state
  FOR SELECT USING (athlete_id IN (SELECT id FROM athletes WHERE user_id = auth.uid()));

CREATE POLICY "System can manage daily state" ON athlete_daily_state
  FOR ALL USING (athlete_id IN (SELECT id FROM athletes WHERE user_id = auth.uid()));

CREATE POLICY "Users can view own adaptations" ON ai_adaptations
  FOR SELECT USING (athlete_id IN (SELECT id FROM athletes WHERE user_id = auth.uid()));

CREATE POLICY "Anyone can view adaptation rules" ON empathy_adaptation_rules
  FOR SELECT USING (true);


-- 6. Helper function to get current athlete state
CREATE OR REPLACE FUNCTION get_athlete_daily_state(p_athlete_id UUID, p_date DATE DEFAULT CURRENT_DATE)
RETURNS athlete_daily_state AS $$
  SELECT * FROM athlete_daily_state 
  WHERE athlete_id = p_athlete_id AND state_date = p_date
  LIMIT 1;
$$ LANGUAGE SQL STABLE;


-- 7. Function to calculate fatigue from recent deltas
CREATE OR REPLACE FUNCTION calculate_fatigue_score(p_athlete_id UUID, p_days INT DEFAULT 7)
RETURNS INT AS $$
DECLARE
  v_score INT;
BEGIN
  SELECT LEAST(100, GREATEST(0, 
    50 + COALESCE(SUM(fatigue_impact_score), 0)::INT
  ))
  INTO v_score
  FROM activity_deltas
  WHERE athlete_id = p_athlete_id
    AND delta_date >= CURRENT_DATE - p_days;
  
  RETURN COALESCE(v_score, 50);
END;
$$ LANGUAGE plpgsql STABLE;
