-- Add notes column to athlete_constraints if it doesn't exist
-- This column stores JSON data for sport supplements and AI recommendations

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'athlete_constraints' AND column_name = 'notes'
  ) THEN
    ALTER TABLE athlete_constraints ADD COLUMN notes TEXT;
  END IF;
END $$;
