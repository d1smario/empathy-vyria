-- Create training_goals table
CREATE TABLE IF NOT EXISTS training_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES annual_training_plans(id) ON DELETE CASCADE,
  goal_type TEXT NOT NULL, -- 'race_a', 'race_b', 'race_c', 'training_camp', 'test'
  goal_date DATE NOT NULL,
  name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create training_mesocycles table
CREATE TABLE IF NOT EXISTS training_mesocycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES annual_training_plans(id) ON DELETE CASCADE,
  phase TEXT NOT NULL, -- 'base', 'build', 'peak', 'race', 'recovery'
  start_week INT NOT NULL,
  end_week INT NOT NULL,
  weeks_count INT NOT NULL,
  load_pattern TEXT DEFAULT '3+1', -- '3+1' or '2+1'
  target_tss INT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create training_weeks table
CREATE TABLE IF NOT EXISTS training_weeks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES annual_training_plans(id) ON DELETE CASCADE,
  mesocycle_id UUID REFERENCES training_mesocycles(id) ON DELETE SET NULL,
  week_number INT NOT NULL,
  week_type TEXT NOT NULL, -- 'base', 'build', 'peak', 'race', 'recovery', 'rest'
  load_percent INT DEFAULT 100,
  target_hours NUMERIC(4,1),
  target_tss INT,
  phase TEXT,
  notes TEXT,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_training_goals_plan ON training_goals(plan_id);
CREATE INDEX IF NOT EXISTS idx_training_mesocycles_plan ON training_mesocycles(plan_id);
CREATE INDEX IF NOT EXISTS idx_training_weeks_plan ON training_weeks(plan_id);
CREATE INDEX IF NOT EXISTS idx_training_weeks_number ON training_weeks(plan_id, week_number);

-- Enable RLS
ALTER TABLE training_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_mesocycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_weeks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for training_goals
CREATE POLICY "Users can view own training goals" ON training_goals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM annual_training_plans p
      JOIN athletes a ON p.athlete_id = a.id
      WHERE p.id = training_goals.plan_id
      AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own training goals" ON training_goals
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM annual_training_plans p
      JOIN athletes a ON p.athlete_id = a.id
      WHERE p.id = training_goals.plan_id
      AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own training goals" ON training_goals
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM annual_training_plans p
      JOIN athletes a ON p.athlete_id = a.id
      WHERE p.id = training_goals.plan_id
      AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own training goals" ON training_goals
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM annual_training_plans p
      JOIN athletes a ON p.athlete_id = a.id
      WHERE p.id = training_goals.plan_id
      AND a.user_id = auth.uid()
    )
  );

-- RLS Policies for training_mesocycles
CREATE POLICY "Users can view own mesocycles" ON training_mesocycles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM annual_training_plans p
      JOIN athletes a ON p.athlete_id = a.id
      WHERE p.id = training_mesocycles.plan_id
      AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own mesocycles" ON training_mesocycles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM annual_training_plans p
      JOIN athletes a ON p.athlete_id = a.id
      WHERE p.id = training_mesocycles.plan_id
      AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own mesocycles" ON training_mesocycles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM annual_training_plans p
      JOIN athletes a ON p.athlete_id = a.id
      WHERE p.id = training_mesocycles.plan_id
      AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own mesocycles" ON training_mesocycles
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM annual_training_plans p
      JOIN athletes a ON p.athlete_id = a.id
      WHERE p.id = training_mesocycles.plan_id
      AND a.user_id = auth.uid()
    )
  );

-- RLS Policies for training_weeks
CREATE POLICY "Users can view own training weeks" ON training_weeks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM annual_training_plans p
      JOIN athletes a ON p.athlete_id = a.id
      WHERE p.id = training_weeks.plan_id
      AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own training weeks" ON training_weeks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM annual_training_plans p
      JOIN athletes a ON p.athlete_id = a.id
      WHERE p.id = training_weeks.plan_id
      AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own training weeks" ON training_weeks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM annual_training_plans p
      JOIN athletes a ON p.athlete_id = a.id
      WHERE p.id = training_weeks.plan_id
      AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own training weeks" ON training_weeks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM annual_training_plans p
      JOIN athletes a ON p.athlete_id = a.id
      WHERE p.id = training_weeks.plan_id
      AND a.user_id = auth.uid()
    )
  );

-- Coach policies
CREATE POLICY "Coaches can view athlete training goals" ON training_goals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM annual_training_plans p
      JOIN athletes a ON p.athlete_id = a.id
      JOIN coach_athletes ca ON a.id = ca.athlete_id
      JOIN coaches c ON ca.coach_id = c.id
      WHERE p.id = training_goals.plan_id
      AND c.user_id = auth.uid()
      AND ca.status = 'active'
    )
  );

CREATE POLICY "Coaches can manage athlete mesocycles" ON training_mesocycles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM annual_training_plans p
      JOIN athletes a ON p.athlete_id = a.id
      JOIN coach_athletes ca ON a.id = ca.athlete_id
      JOIN coaches c ON ca.coach_id = c.id
      WHERE p.id = training_mesocycles.plan_id
      AND c.user_id = auth.uid()
      AND ca.status = 'active'
    )
  );

CREATE POLICY "Coaches can manage athlete training weeks" ON training_weeks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM annual_training_plans p
      JOIN athletes a ON p.athlete_id = a.id
      JOIN coach_athletes ca ON a.id = ca.athlete_id
      JOIN coaches c ON ca.coach_id = c.id
      WHERE p.id = training_weeks.plan_id
      AND c.user_id = auth.uid()
      AND ca.status = 'active'
    )
  );
