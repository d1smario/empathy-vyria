-- Create athlete_workouts table for lifestyle sessions and workouts
CREATE TABLE IF NOT EXISTS public.athlete_workouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  athlete_id UUID NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  coach_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  workout_type TEXT NOT NULL DEFAULT 'lifestyle',
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER DEFAULT 0,
  intervals JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.athlete_workouts ENABLE ROW LEVEL SECURITY;

-- Policy: Athletes can view their own workouts
CREATE POLICY "Athletes can view own workouts"
  ON public.athlete_workouts FOR SELECT
  USING (athlete_id IN (SELECT id FROM public.athletes WHERE user_id = auth.uid()));

-- Policy: Athletes can insert their own workouts
CREATE POLICY "Athletes can insert own workouts"
  ON public.athlete_workouts FOR INSERT
  WITH CHECK (athlete_id IN (SELECT id FROM public.athletes WHERE user_id = auth.uid()));

-- Policy: Athletes can update their own workouts
CREATE POLICY "Athletes can update own workouts"
  ON public.athlete_workouts FOR UPDATE
  USING (athlete_id IN (SELECT id FROM public.athletes WHERE user_id = auth.uid()));

-- Policy: Athletes can delete their own workouts
CREATE POLICY "Athletes can delete own workouts"
  ON public.athlete_workouts FOR DELETE
  USING (athlete_id IN (SELECT id FROM public.athletes WHERE user_id = auth.uid()));

-- Policy: Coaches can view workouts of their linked athletes
CREATE POLICY "Coaches can view linked athlete workouts"
  ON public.athlete_workouts FOR SELECT
  USING (
    athlete_id IN (
      SELECT athlete_id FROM public.coach_athletes 
      WHERE coach_id = auth.uid() AND status = 'active'
    )
  );

-- Policy: Coaches can insert workouts for their linked athletes
CREATE POLICY "Coaches can insert linked athlete workouts"
  ON public.athlete_workouts FOR INSERT
  WITH CHECK (
    athlete_id IN (
      SELECT athlete_id FROM public.coach_athletes 
      WHERE coach_id = auth.uid() AND status = 'active'
    )
  );

-- Policy: Coaches can update workouts for their linked athletes
CREATE POLICY "Coaches can update linked athlete workouts"
  ON public.athlete_workouts FOR UPDATE
  USING (
    athlete_id IN (
      SELECT athlete_id FROM public.coach_athletes 
      WHERE coach_id = auth.uid() AND status = 'active'
    )
  );

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_athlete_workouts_athlete_id ON public.athlete_workouts(athlete_id);
CREATE INDEX IF NOT EXISTS idx_athlete_workouts_day ON public.athlete_workouts(day_of_week);
CREATE INDEX IF NOT EXISTS idx_athlete_workouts_type ON public.athlete_workouts(workout_type);
