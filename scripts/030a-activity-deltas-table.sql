-- =====================================================
-- EMPATHY AI ADAPTIVE SYSTEM - Part 1: Activity Deltas
-- =====================================================

-- Table to track differences between planned and actual workouts
CREATE TABLE IF NOT EXISTS activity_deltas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES training_activities(id) ON DELETE SET NULL,
  planned_workout_id UUID,
  delta_date DATE NOT NULL,
  
  -- Planned values
  planned_duration_min INT,
  planned_tss INT,
  planned_kcal INT,
  planned_zone TEXT,
  planned_intensity TEXT,
  
  -- Actual values
  actual_duration_min INT,
  actual_tss INT,
  actual_kcal INT,
  actual_avg_zone TEXT,
  actual_avg_hr INT,
  actual_avg_power INT,
  
  -- Calculated deltas
  delta_duration_min INT GENERATED ALWAYS AS (COALESCE(actual_duration_min, 0) - COALESCE(planned_duration_min, 0)) STORED,
  delta_tss INT GENERATED ALWAYS AS (COALESCE(actual_tss, 0) - COALESCE(planned_tss, 0)) STORED,
  delta_kcal INT GENERATED ALWAYS AS (COALESCE(actual_kcal, 0) - COALESCE(planned_kcal, 0)) STORED,
  
  -- Fatigue impact score (0-100)
  delta_fatigue_score DECIMAL(5,2) DEFAULT 0,
  
  -- Metadata
  source TEXT DEFAULT 'manual',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(athlete_id, delta_date, activity_id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_activity_deltas_athlete_date ON activity_deltas(athlete_id, delta_date DESC);

-- Enable RLS
ALTER TABLE activity_deltas ENABLE ROW LEVEL SECURITY;

-- RLS Policy
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'activity_deltas' AND policyname = 'activity_deltas_athlete_access') THEN
    CREATE POLICY activity_deltas_athlete_access ON activity_deltas
      FOR ALL USING (
        athlete_id IN (
          SELECT id FROM athletes WHERE user_id = auth.uid()
          UNION
          SELECT athlete_id FROM coach_athlete_links WHERE coach_id = auth.uid()
        )
      );
  END IF;
END $$;
