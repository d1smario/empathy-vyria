-- Add notes column to athlete_constraints for storing JSON data
-- This column stores sport_supplements, training_preferences, and other AI data

ALTER TABLE public.athlete_constraints 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add foods_to_avoid and foods_to_include columns for AI recommendations
ALTER TABLE public.athlete_constraints 
ADD COLUMN IF NOT EXISTS foods_to_avoid TEXT[] DEFAULT '{}';

ALTER TABLE public.athlete_constraints 
ADD COLUMN IF NOT EXISTS foods_to_include TEXT[] DEFAULT '{}';
