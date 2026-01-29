-- =====================================================
-- COACH RLS POLICIES
-- Allow coaches to manage data for linked athletes
-- =====================================================

-- Helper function to check if user is coach of athlete
CREATE OR REPLACE FUNCTION public.is_coach_of_athlete(athlete_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.coach_athlete_links
    WHERE coach_id = auth.uid()
    AND athlete_id = athlete_uuid
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- METABOLIC_PROFILES - Coach policies
-- =====================================================
DROP POLICY IF EXISTS "Coaches can view athlete metabolic profiles" ON public.metabolic_profiles;
DROP POLICY IF EXISTS "Coaches can insert athlete metabolic profiles" ON public.metabolic_profiles;
DROP POLICY IF EXISTS "Coaches can update athlete metabolic profiles" ON public.metabolic_profiles;
DROP POLICY IF EXISTS "Coaches can delete athlete metabolic profiles" ON public.metabolic_profiles;

CREATE POLICY "Coaches can view athlete metabolic profiles" ON public.metabolic_profiles
  FOR SELECT USING (
    public.is_coach_of_athlete(athlete_id)
  );

CREATE POLICY "Coaches can insert athlete metabolic profiles" ON public.metabolic_profiles
  FOR INSERT WITH CHECK (
    public.is_coach_of_athlete(athlete_id)
  );

CREATE POLICY "Coaches can update athlete metabolic profiles" ON public.metabolic_profiles
  FOR UPDATE USING (
    public.is_coach_of_athlete(athlete_id)
  );

CREATE POLICY "Coaches can delete athlete metabolic profiles" ON public.metabolic_profiles
  FOR DELETE USING (
    public.is_coach_of_athlete(athlete_id)
  );

-- =====================================================
-- ATHLETES - Coach update policy
-- =====================================================
DROP POLICY IF EXISTS "Coaches can update linked athletes" ON public.athletes;

CREATE POLICY "Coaches can update linked athletes" ON public.athletes
  FOR UPDATE USING (
    user_id IN (
      SELECT athlete_id FROM public.coach_athlete_links
      WHERE coach_id = auth.uid()
      AND status = 'active'
    )
  );

-- =====================================================
-- ATHLETE_CONSTRAINTS - Coach policies
-- =====================================================
DROP POLICY IF EXISTS "Coaches can view athlete constraints" ON public.athlete_constraints;
DROP POLICY IF EXISTS "Coaches can insert athlete constraints" ON public.athlete_constraints;
DROP POLICY IF EXISTS "Coaches can update athlete constraints" ON public.athlete_constraints;
DROP POLICY IF EXISTS "Coaches can delete athlete constraints" ON public.athlete_constraints;

CREATE POLICY "Coaches can view athlete constraints" ON public.athlete_constraints
  FOR SELECT USING (
    public.is_coach_of_athlete(athlete_id)
  );

CREATE POLICY "Coaches can insert athlete constraints" ON public.athlete_constraints
  FOR INSERT WITH CHECK (
    public.is_coach_of_athlete(athlete_id)
  );

CREATE POLICY "Coaches can update athlete constraints" ON public.athlete_constraints
  FOR UPDATE USING (
    public.is_coach_of_athlete(athlete_id)
  );

CREATE POLICY "Coaches can delete athlete constraints" ON public.athlete_constraints
  FOR DELETE USING (
    public.is_coach_of_athlete(athlete_id)
  );

-- =====================================================
-- WEEKLY_WORKOUTS - Coach policies
-- =====================================================
DROP POLICY IF EXISTS "Coaches can view athlete workouts" ON public.weekly_workouts;
DROP POLICY IF EXISTS "Coaches can insert athlete workouts" ON public.weekly_workouts;
DROP POLICY IF EXISTS "Coaches can update athlete workouts" ON public.weekly_workouts;
DROP POLICY IF EXISTS "Coaches can delete athlete workouts" ON public.weekly_workouts;

CREATE POLICY "Coaches can view athlete workouts" ON public.weekly_workouts
  FOR SELECT USING (
    public.is_coach_of_athlete(athlete_id)
  );

CREATE POLICY "Coaches can insert athlete workouts" ON public.weekly_workouts
  FOR INSERT WITH CHECK (
    public.is_coach_of_athlete(athlete_id)
  );

CREATE POLICY "Coaches can update athlete workouts" ON public.weekly_workouts
  FOR UPDATE USING (
    public.is_coach_of_athlete(athlete_id)
  );

CREATE POLICY "Coaches can delete athlete workouts" ON public.weekly_workouts
  FOR DELETE USING (
    public.is_coach_of_athlete(athlete_id)
  );

-- =====================================================
-- TRAINING_ACTIVITIES - Coach policies
-- =====================================================
DROP POLICY IF EXISTS "Coaches can view athlete activities" ON public.training_activities;
DROP POLICY IF EXISTS "Coaches can insert athlete activities" ON public.training_activities;
DROP POLICY IF EXISTS "Coaches can update athlete activities" ON public.training_activities;
DROP POLICY IF EXISTS "Coaches can delete athlete activities" ON public.training_activities;

CREATE POLICY "Coaches can view athlete activities" ON public.training_activities
  FOR SELECT USING (
    public.is_coach_of_athlete(athlete_id)
  );

CREATE POLICY "Coaches can insert athlete activities" ON public.training_activities
  FOR INSERT WITH CHECK (
    public.is_coach_of_athlete(athlete_id)
  );

CREATE POLICY "Coaches can update athlete activities" ON public.training_activities
  FOR UPDATE USING (
    public.is_coach_of_athlete(athlete_id)
  );

CREATE POLICY "Coaches can delete athlete activities" ON public.training_activities
  FOR DELETE USING (
    public.is_coach_of_athlete(athlete_id)
  );

-- =====================================================
-- DAILY_METRICS - Coach policies
-- =====================================================
DROP POLICY IF EXISTS "Coaches can view athlete metrics" ON public.daily_metrics;
DROP POLICY IF EXISTS "Coaches can insert athlete metrics" ON public.daily_metrics;
DROP POLICY IF EXISTS "Coaches can update athlete metrics" ON public.daily_metrics;

CREATE POLICY "Coaches can view athlete metrics" ON public.daily_metrics
  FOR SELECT USING (
    public.is_coach_of_athlete(athlete_id)
  );

CREATE POLICY "Coaches can insert athlete metrics" ON public.daily_metrics
  FOR INSERT WITH CHECK (
    public.is_coach_of_athlete(athlete_id)
  );

CREATE POLICY "Coaches can update athlete metrics" ON public.daily_metrics
  FOR UPDATE USING (
    public.is_coach_of_athlete(athlete_id)
  );

-- =====================================================
-- EMPATHY_INDICES - Coach policies
-- =====================================================
DROP POLICY IF EXISTS "Coaches can view athlete indices" ON public.empathy_indices;
DROP POLICY IF EXISTS "Coaches can insert athlete indices" ON public.empathy_indices;
DROP POLICY IF EXISTS "Coaches can update athlete indices" ON public.empathy_indices;

CREATE POLICY "Coaches can view athlete indices" ON public.empathy_indices
  FOR SELECT USING (
    public.is_coach_of_athlete(athlete_id)
  );

CREATE POLICY "Coaches can insert athlete indices" ON public.empathy_indices
  FOR INSERT WITH CHECK (
    public.is_coach_of_athlete(athlete_id)
  );

CREATE POLICY "Coaches can update athlete indices" ON public.empathy_indices
  FOR UPDATE USING (
    public.is_coach_of_athlete(athlete_id)
  );

-- =====================================================
-- TRAINING_PLANS (VYRIA) - Coach policies
-- =====================================================
DROP POLICY IF EXISTS "Coaches can view athlete training plans" ON public.training_plans;
DROP POLICY IF EXISTS "Coaches can insert athlete training plans" ON public.training_plans;
DROP POLICY IF EXISTS "Coaches can update athlete training plans" ON public.training_plans;
DROP POLICY IF EXISTS "Coaches can delete athlete training plans" ON public.training_plans;

CREATE POLICY "Coaches can view athlete training plans" ON public.training_plans
  FOR SELECT USING (
    public.is_coach_of_athlete(athlete_id)
  );

CREATE POLICY "Coaches can insert athlete training plans" ON public.training_plans
  FOR INSERT WITH CHECK (
    public.is_coach_of_athlete(athlete_id)
  );

CREATE POLICY "Coaches can update athlete training plans" ON public.training_plans
  FOR UPDATE USING (
    public.is_coach_of_athlete(athlete_id)
  );

CREATE POLICY "Coaches can delete athlete training plans" ON public.training_plans
  FOR DELETE USING (
    public.is_coach_of_athlete(athlete_id)
  );
