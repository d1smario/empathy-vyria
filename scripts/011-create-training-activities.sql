-- Training Activities table for manual workout creation and imports
-- Run this script to create the table

CREATE TABLE IF NOT EXISTS public.training_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  activity_date DATE NOT NULL,
  activity_type TEXT DEFAULT 'cycling',
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER,
  distance_km DECIMAL(6,2),
  tss INTEGER,
  normalized_power INTEGER,
  average_power INTEGER,
  max_power INTEGER,
  average_hr INTEGER,
  max_hr INTEGER,
  average_cadence INTEGER,
  elevation_gain INTEGER,
  calories INTEGER,
  planned BOOLEAN DEFAULT false,
  completed BOOLEAN DEFAULT false,
  target_zone TEXT,
  workout_type TEXT,
  intervals JSONB,
  nutrition_carbs_g INTEGER,
  nutrition_protein_g INTEGER,
  nutrition_fat_g INTEGER,
  intra_workout_carbs_g INTEGER,
  hydration_ml INTEGER,
  notes TEXT,
  strava_activity_id TEXT,
  trainingpeaks_id TEXT,
  source TEXT DEFAULT 'manual',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_training_activities_athlete ON public.training_activities(athlete_id);
CREATE INDEX IF NOT EXISTS idx_training_activities_date ON public.training_activities(activity_date);
CREATE INDEX IF NOT EXISTS idx_training_activities_planned ON public.training_activities(planned);

ALTER TABLE public.training_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activities" ON public.training_activities
  FOR SELECT USING (athlete_id IN (SELECT id FROM public.athletes WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own activities" ON public.training_activities
  FOR INSERT WITH CHECK (athlete_id IN (SELECT id FROM public.athletes WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own activities" ON public.training_activities
  FOR UPDATE USING (athlete_id IN (SELECT id FROM public.athletes WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own activities" ON public.training_activities
  FOR DELETE USING (athlete_id IN (SELECT id FROM public.athletes WHERE user_id = auth.uid()));
