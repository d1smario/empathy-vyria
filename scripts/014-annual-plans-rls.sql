-- Enable RLS on annual_training_plans
ALTER TABLE annual_training_plans ENABLE ROW LEVEL SECURITY;

-- Policy: Athletes can view and manage their own plans
CREATE POLICY "Athletes can view own plans"
ON annual_training_plans FOR SELECT
USING (
  athlete_id IN (
    SELECT id FROM athletes WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Athletes can insert own plans"
ON annual_training_plans FOR INSERT
WITH CHECK (
  athlete_id IN (
    SELECT id FROM athletes WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Athletes can update own plans"
ON annual_training_plans FOR UPDATE
USING (
  athlete_id IN (
    SELECT id FROM athletes WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Athletes can delete own plans"
ON annual_training_plans FOR DELETE
USING (
  athlete_id IN (
    SELECT id FROM athletes WHERE user_id = auth.uid()
  )
);

-- Policy: Coaches can view and manage plans of their linked athletes
CREATE POLICY "Coaches can view athlete plans"
ON annual_training_plans FOR SELECT
USING (
  athlete_id IN (
    SELECT a.id FROM athletes a
    JOIN coach_athlete_links cal ON cal.athlete_id = a.user_id
    WHERE cal.coach_id = auth.uid() AND cal.status = 'accepted'
  )
);

CREATE POLICY "Coaches can insert athlete plans"
ON annual_training_plans FOR INSERT
WITH CHECK (
  athlete_id IN (
    SELECT a.id FROM athletes a
    JOIN coach_athlete_links cal ON cal.athlete_id = a.user_id
    WHERE cal.coach_id = auth.uid() AND cal.status = 'accepted'
  )
);

CREATE POLICY "Coaches can update athlete plans"
ON annual_training_plans FOR UPDATE
USING (
  athlete_id IN (
    SELECT a.id FROM athletes a
    JOIN coach_athlete_links cal ON cal.athlete_id = a.user_id
    WHERE cal.coach_id = auth.uid() AND cal.status = 'accepted'
  )
);

CREATE POLICY "Coaches can delete athlete plans"
ON annual_training_plans FOR DELETE
USING (
  athlete_id IN (
    SELECT a.id FROM athletes a
    JOIN coach_athlete_links cal ON cal.athlete_id = a.user_id
    WHERE cal.coach_id = auth.uid() AND cal.status = 'accepted'
  )
);

-- Same policies for training_activities (workouts)
ALTER TABLE training_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Athletes can view own workouts"
ON training_activities FOR SELECT
USING (
  athlete_id IN (
    SELECT id FROM athletes WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Athletes can manage own workouts"
ON training_activities FOR ALL
USING (
  athlete_id IN (
    SELECT id FROM athletes WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Coaches can view athlete workouts"
ON training_activities FOR SELECT
USING (
  athlete_id IN (
    SELECT a.id FROM athletes a
    JOIN coach_athlete_links cal ON cal.athlete_id = a.user_id
    WHERE cal.coach_id = auth.uid() AND cal.status = 'accepted'
  )
);

CREATE POLICY "Coaches can manage athlete workouts"
ON training_activities FOR ALL
USING (
  athlete_id IN (
    SELECT a.id FROM athletes a
    JOIN coach_athlete_links cal ON cal.athlete_id = a.user_id
    WHERE cal.coach_id = auth.uid() AND cal.status = 'accepted'
  )
);
