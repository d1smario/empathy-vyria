-- Add user_id column to training_activities table
-- This column links activities to the authenticated user

ALTER TABLE training_activities 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_training_activities_user_id ON training_activities(user_id);

-- Update existing records to set user_id from athlete_id relationship
UPDATE training_activities ta
SET user_id = a.user_id
FROM athletes a
WHERE ta.athlete_id = a.id AND ta.user_id IS NULL;
