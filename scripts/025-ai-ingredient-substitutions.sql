-- AI Ingredient Substitutions Table
-- Stores ingredient substitutions suggested by AI based on athlete constraints

CREATE TABLE IF NOT EXISTS ai_ingredient_substitutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL,
  
  -- What to replace
  original_ingredient TEXT NOT NULL,
  
  -- What to use instead
  substitute_ingredient TEXT NOT NULL,
  
  -- Why (allergy, intolerance, preference, performance)
  reason TEXT NOT NULL,
  reason_type TEXT NOT NULL,
  
  -- Where to apply (null = everywhere)
  meal_type TEXT,
  
  -- Nutritional adjustments (optional)
  adjust_quantity DECIMAL(5,2) DEFAULT 1.0,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  applied_by_ai BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Meal Corrections Table (for more complex corrections)
CREATE TABLE IF NOT EXISTS ai_meal_corrections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL,
  
  -- Target
  meal_name TEXT,
  meal_type TEXT,
  day_of_week INTEGER,
  
  -- Correction type
  correction_type TEXT NOT NULL,
  
  -- Correction data (JSON)
  correction_data JSONB NOT NULL,
  
  -- Priority (higher = applied first)
  priority INTEGER DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  source TEXT DEFAULT 'ai',
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);
