-- Create athlete_workouts table for storing lifestyle sessions and gym workouts
CREATE TABLE IF NOT EXISTS public.athlete_workouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  athlete_id UUID NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  workout_type TEXT NOT NULL DEFAULT 'gym',
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER DEFAULT 0,
  intervals JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_athlete_workouts_athlete_id ON public.athlete_workouts(athlete_id);
CREATE INDEX IF NOT EXISTS idx_athlete_workouts_day_of_week ON public.athlete_workouts(day_of_week);
CREATE INDEX IF NOT EXISTS idx_athlete_workouts_workout_type ON public.athlete_workouts(workout_type);

-- Enable RLS
ALTER TABLE public.athlete_workouts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Athletes can view and manage their own workouts
CREATE POLICY "Athletes can view own workouts"
  ON public.athlete_workouts
  FOR SELECT
  USING (
    athlete_id IN (
      SELECT id FROM public.athletes WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Athletes can insert own workouts"
  ON public.athlete_workouts
  FOR INSERT
  WITH CHECK (
    athlete_id IN (
      SELECT id FROM public.athletes WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Athletes can update own workouts"
  ON public.athlete_workouts
  FOR UPDATE
  USING (
    athlete_id IN (
      SELECT id FROM public.athletes WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Athletes can delete own workouts"
  ON public.athlete_workouts
  FOR DELETE
  USING (
    athlete_id IN (
      SELECT id FROM public.athletes WHERE user_id = auth.uid()
    )
  );

-- Coaches can view and manage workouts for their linked athletes
CREATE POLICY "Coaches can view linked athlete workouts"
  ON public.athlete_workouts
  FOR SELECT
  USING (
    athlete_id IN (
      SELECT athlete_id FROM public.coach_athletes 
      WHERE coach_id IN (SELECT id FROM public.coaches WHERE user_id = auth.uid())
      AND status = 'active'
    )
  );

CREATE POLICY "Coaches can insert workouts for linked athletes"
  ON public.athlete_workouts
  FOR INSERT
  WITH CHECK (
    athlete_id IN (
      SELECT athlete_id FROM public.coach_athletes 
      WHERE coach_id IN (SELECT id FROM public.coaches WHERE user_id = auth.uid())
      AND status = 'active'
    )
  );

CREATE POLICY "Coaches can update workouts for linked athletes"
  ON public.athlete_workouts
  FOR UPDATE
  USING (
    athlete_id IN (
      SELECT athlete_id FROM public.coach_athletes 
      WHERE coach_id IN (SELECT id FROM public.coaches WHERE user_id = auth.uid())
      AND status = 'active'
    )
  );

CREATE POLICY "Coaches can delete workouts for linked athletes"
  ON public.athlete_workouts
  FOR DELETE
  USING (
    athlete_id IN (
      SELECT athlete_id FROM public.coach_athletes 
      WHERE coach_id IN (SELECT id FROM public.coaches WHERE user_id = auth.uid())
      AND status = 'active'
    )
  );

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_athlete_workouts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_athlete_workouts_updated_at
  BEFORE UPDATE ON public.athlete_workouts
  FOR EACH ROW
  EXECUTE FUNCTION update_athlete_workouts_updated_at();
