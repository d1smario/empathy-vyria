-- VYRIA Training Plan Schema
-- Tabelle per la gestione del piano di allenamento annuale

-- Piano annuale con obiettivi
CREATE TABLE IF NOT EXISTS annual_training_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  -- Obiettivo principale
  main_goal_type TEXT, -- 'event', 'performance', 'fitness'
  main_goal_event TEXT, -- Nome evento
  main_goal_date DATE,
  main_goal_power_target INTEGER, -- Watt target
  main_goal_duration_target INTEGER, -- Minuti
  -- Volume annuale
  annual_hours_target INTEGER,
  weekly_hours_min INTEGER DEFAULT 6,
  weekly_hours_max INTEGER DEFAULT 15,
  -- Stato
  status TEXT DEFAULT 'draft', -- 'draft', 'active', 'completed'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(athlete_id, year)
);

-- Obiettivi intermedi (gare B, C o target intermedi)
CREATE TABLE IF NOT EXISTS training_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  annual_plan_id UUID NOT NULL REFERENCES annual_training_plans(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  goal_type TEXT NOT NULL, -- 'event_a', 'event_b', 'event_c', 'performance_test', 'training_camp'
  goal_date DATE NOT NULL,
  description TEXT,
  power_target INTEGER,
  duration_minutes INTEGER,
  priority INTEGER DEFAULT 2, -- 1=highest, 3=lowest
  completed BOOLEAN DEFAULT false,
  result_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mesocicli (blocchi di 3-6 settimane)
CREATE TABLE IF NOT EXISTS training_mesocycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  annual_plan_id UUID NOT NULL REFERENCES annual_training_plans(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phase TEXT NOT NULL, -- 'base', 'build', 'peak', 'race', 'recovery', 'transition'
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  weeks INTEGER NOT NULL,
  focus TEXT, -- 'endurance', 'threshold', 'vo2max', 'anaerobic', 'sprint', 'mixed'
  weekly_hours_target INTEGER,
  intensity_distribution JSONB, -- { "z1": 30, "z2": 40, "z3": 15, "z4": 10, "z5": 5 }
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Settimane di allenamento
CREATE TABLE IF NOT EXISTS training_weeks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mesocycle_id UUID NOT NULL REFERENCES training_mesocycles(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL, -- 1, 2, 3...
  start_date DATE NOT NULL,
  week_type TEXT NOT NULL, -- 'load', 'load_high', 'recovery', 'test', 'race', 'taper'
  load_factor DECIMAL(3,2) DEFAULT 1.0, -- 0.5 = recovery, 1.0 = normal, 1.2 = overload
  planned_hours DECIMAL(4,1),
  planned_tss INTEGER,
  actual_hours DECIMAL(4,1),
  actual_tss INTEGER,
  compliance_percent INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(mesocycle_id, week_number)
);

-- Workout pianificati (singoli allenamenti)
CREATE TABLE IF NOT EXISTS planned_workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  training_week_id UUID NOT NULL REFERENCES training_weeks(id) ON DELETE CASCADE,
  athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL, -- 0=Sunday, 1=Monday...
  scheduled_date DATE NOT NULL,
  -- Dettagli workout
  title TEXT NOT NULL,
  workout_type TEXT NOT NULL, -- 'endurance', 'tempo', 'threshold', 'vo2max', 'anaerobic', 'sprint', 'recovery', 'rest'
  description TEXT,
  -- Durata e intensità
  duration_minutes INTEGER,
  tss_planned INTEGER,
  if_planned DECIMAL(3,2), -- Intensity Factor
  -- Zone target
  primary_zone TEXT, -- 'z1', 'z2', 'z3', 'z4', 'z5', 'z6', 'z7'
  zone_distribution JSONB, -- { "z2": 60, "z3": 25, "z4": 15 }
  -- Intervalli strutturati
  intervals JSONB, -- [{ "name": "Warmup", "duration": 600, "power_low": 150, "power_high": 180 }, ...]
  -- Nutrizione pre-calcolata (da profilo metabolico)
  pre_workout_carbs_g INTEGER,
  intra_workout_carbs_g INTEGER,
  intra_workout_fluids_ml INTEGER,
  post_workout_carbs_g INTEGER,
  post_workout_protein_g INTEGER,
  -- Stato esecuzione
  status TEXT DEFAULT 'planned', -- 'planned', 'completed', 'skipped', 'modified'
  completed_at TIMESTAMPTZ,
  actual_duration_minutes INTEGER,
  actual_tss INTEGER,
  actual_if DECIMAL(3,2),
  athlete_feedback TEXT,
  rpe INTEGER, -- 1-10
  -- Import
  source TEXT DEFAULT 'manual', -- 'manual', 'trainingpeaks', 'strava', 'vyria_auto'
  external_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Template workout riutilizzabili
CREATE TABLE IF NOT EXISTS workout_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES auth.users(id),
  is_public BOOLEAN DEFAULT false,
  name TEXT NOT NULL,
  workout_type TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER,
  tss_estimate INTEGER,
  if_estimate DECIMAL(3,2),
  primary_zone TEXT,
  zone_distribution JSONB,
  intervals JSONB,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_annual_plans_athlete ON annual_training_plans(athlete_id);
CREATE INDEX IF NOT EXISTS idx_training_goals_plan ON training_goals(annual_plan_id);
CREATE INDEX IF NOT EXISTS idx_mesocycles_plan ON training_mesocycles(annual_plan_id);
CREATE INDEX IF NOT EXISTS idx_training_weeks_mesocycle ON training_weeks(mesocycle_id);
CREATE INDEX IF NOT EXISTS idx_planned_workouts_week ON planned_workouts(training_week_id);
CREATE INDEX IF NOT EXISTS idx_planned_workouts_athlete_date ON planned_workouts(athlete_id, scheduled_date);

-- RLS Policies
ALTER TABLE annual_training_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_mesocycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE planned_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_library ENABLE ROW LEVEL SECURITY;

-- Athletes can manage their own plans
CREATE POLICY "Athletes manage own annual plans" ON annual_training_plans
  FOR ALL USING (
    athlete_id IN (SELECT id FROM athletes WHERE user_id = auth.uid())
  );

CREATE POLICY "Athletes manage own goals" ON training_goals
  FOR ALL USING (
    annual_plan_id IN (
      SELECT id FROM annual_training_plans 
      WHERE athlete_id IN (SELECT id FROM athletes WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Athletes manage own mesocycles" ON training_mesocycles
  FOR ALL USING (
    annual_plan_id IN (
      SELECT id FROM annual_training_plans 
      WHERE athlete_id IN (SELECT id FROM athletes WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Athletes manage own weeks" ON training_weeks
  FOR ALL USING (
    mesocycle_id IN (
      SELECT m.id FROM training_mesocycles m
      JOIN annual_training_plans p ON m.annual_plan_id = p.id
      WHERE p.athlete_id IN (SELECT id FROM athletes WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Athletes manage own workouts" ON planned_workouts
  FOR ALL USING (
    athlete_id IN (SELECT id FROM athletes WHERE user_id = auth.uid())
  );

CREATE POLICY "View public workout templates" ON workout_library
  FOR SELECT USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Manage own workout templates" ON workout_library
  FOR ALL USING (created_by = auth.uid());
