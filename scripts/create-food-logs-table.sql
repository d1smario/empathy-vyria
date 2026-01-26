-- Create food_logs table for the Food Diary feature
CREATE TABLE IF NOT EXISTS food_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  athlete_id UUID REFERENCES athletes(id) ON DELETE CASCADE,
  
  -- Meal info
  meal_type VARCHAR(50) NOT NULL, -- colazione, pranzo, cena, snack, pre_workout, post_workout
  meal_name VARCHAR(255),
  food_items JSONB DEFAULT '[]', -- Array of food items with individual nutritional info
  image_url TEXT,
  notes TEXT,
  
  -- Nutritional totals
  calories INTEGER DEFAULT 0,
  protein DECIMAL(8,2) DEFAULT 0, -- grams
  carbs DECIMAL(8,2) DEFAULT 0, -- grams
  fats DECIMAL(8,2) DEFAULT 0, -- grams
  fiber DECIMAL(8,2) DEFAULT 0, -- grams
  
  -- Fat breakdown
  saturated_fat DECIMAL(8,2) DEFAULT 0,
  unsaturated_fat DECIMAL(8,2) DEFAULT 0,
  trans_fat DECIMAL(8,2) DEFAULT 0,
  
  -- Glycemic info
  glycemic_index INTEGER,
  glycemic_load DECIMAL(8,2),
  insulin_load DECIMAL(8,2),
  
  -- Micronutrients (optional detailed tracking)
  micronutrients JSONB DEFAULT '{}',
  
  -- Hydration
  water_ml INTEGER DEFAULT 0,
  
  -- Timestamps
  logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  meal_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_food_logs_athlete_id ON food_logs(athlete_id);
CREATE INDEX IF NOT EXISTS idx_food_logs_meal_date ON food_logs(meal_date);
CREATE INDEX IF NOT EXISTS idx_food_logs_meal_type ON food_logs(meal_type);
CREATE INDEX IF NOT EXISTS idx_food_logs_athlete_date ON food_logs(athlete_id, meal_date);

-- Enable RLS
ALTER TABLE food_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own food logs" ON food_logs
  FOR SELECT USING (
    athlete_id IN (SELECT id FROM athletes WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert own food logs" ON food_logs
  FOR INSERT WITH CHECK (
    athlete_id IN (SELECT id FROM athletes WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update own food logs" ON food_logs
  FOR UPDATE USING (
    athlete_id IN (SELECT id FROM athletes WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete own food logs" ON food_logs
  FOR DELETE USING (
    athlete_id IN (SELECT id FROM athletes WHERE user_id = auth.uid())
  );
