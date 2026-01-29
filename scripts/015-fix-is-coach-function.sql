CREATE OR REPLACE FUNCTION public.is_coach_of_athlete(athlete_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.coach_athlete_links
    WHERE coach_id = auth.uid()
    AND athlete_id = athlete_uuid
    AND status = 'accepted'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
