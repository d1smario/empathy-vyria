-- Add config_json column to annual_training_plans for storing
-- sport preferences, zone type, and other configuration

ALTER TABLE annual_training_plans 
ADD COLUMN IF NOT EXISTS config_json JSONB DEFAULT '{}';

-- Add preferred_rest_days column for storing rest day preferences
ALTER TABLE annual_training_plans 
ADD COLUMN IF NOT EXISTS preferred_rest_days TEXT[];

-- Add index for faster config queries
CREATE INDEX IF NOT EXISTS idx_annual_plans_config ON annual_training_plans USING GIN (config_json);

-- Comment for documentation
COMMENT ON COLUMN annual_training_plans.config_json IS 'Stores plan configuration including sport type, zone_type (power/hr), weekly_tss_capacity, physio_goals, and mesocycle load progressions';
