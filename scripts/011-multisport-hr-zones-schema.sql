-- =====================================================
-- VYRIA Multisport & Heart Rate Zones Schema
-- Supporto per tutti gli sport e zone basate su FC
-- =====================================================

-- =====================================================
-- SPORT CONFIGURATIONS
-- =====================================================

-- Configurazione sport disponibili per atleta
CREATE TABLE IF NOT EXISTS public.athlete_sport_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  athlete_id UUID REFERENCES public.athletes(id) ON DELETE CASCADE,
  
  -- Sport type
  sport TEXT NOT NULL CHECK (sport IN (
    'cycling', 'running', 'swimming', 'triathlon', 
    'trail_running', 'mountain_bike', 'gravel',
    'cross_country_skiing', 'alpine_skiing', 'ski_mountaineering',
    'rowing', 'paddling', 'gym', 'other'
  )),
  
  -- Is this the primary sport?
  is_primary BOOLEAN DEFAULT FALSE,
  
  -- Sport-specific thresholds
  -- Power-based (cycling, rowing)
  ftp_watts INTEGER,
  
  -- Pace-based (running, swimming)
  threshold_pace_min_per_km NUMERIC(5,2), -- e.g., 4.30 = 4:30/km
  threshold_pace_min_per_100m NUMERIC(5,2), -- for swimming
  
  -- Heart rate based (all sports)
  use_hr_zones BOOLEAN DEFAULT FALSE,
  hr_max INTEGER,
  hr_threshold INTEGER, -- LTHR (Lactate Threshold Heart Rate)
  hr_resting INTEGER,
  
  -- VO2max estimate for this sport
  vo2max_sport NUMERIC(4,1),
  
  -- VLamax if available
  vlamax NUMERIC(4,3),
  
  -- Sport-specific settings
  preferred_terrain TEXT, -- 'flat', 'hilly', 'mountain', 'mixed'
  typical_duration_hours NUMERIC(4,1), -- average workout duration
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(athlete_id, sport)
);

-- =====================================================
-- HEART RATE ZONES
-- =====================================================

-- Zone FC calcolate per sport
CREATE TABLE IF NOT EXISTS public.hr_zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  athlete_id UUID REFERENCES public.athletes(id) ON DELETE CASCADE,
  sport TEXT NOT NULL,
  
  -- Zone model used
  zone_model TEXT DEFAULT 'threshold' CHECK (zone_model IN (
    'threshold', -- Based on LTHR (most common)
    'max_hr', -- Based on HRmax (simple)
    'karvonen', -- Heart Rate Reserve method
    'polarized', -- 3-zone polarized model
    'coggan' -- 7-zone model
  )),
  
  -- 5-Zone Model (standard)
  z1_name TEXT DEFAULT 'Recovery',
  z1_hr_min INTEGER,
  z1_hr_max INTEGER,
  z1_percent_lthr_min NUMERIC(5,2),
  z1_percent_lthr_max NUMERIC(5,2),
  
  z2_name TEXT DEFAULT 'Endurance',
  z2_hr_min INTEGER,
  z2_hr_max INTEGER,
  z2_percent_lthr_min NUMERIC(5,2),
  z2_percent_lthr_max NUMERIC(5,2),
  
  z3_name TEXT DEFAULT 'Tempo',
  z3_hr_min INTEGER,
  z3_hr_max INTEGER,
  z3_percent_lthr_min NUMERIC(5,2),
  z3_percent_lthr_max NUMERIC(5,2),
  
  z4_name TEXT DEFAULT 'Threshold',
  z4_hr_min INTEGER,
  z4_hr_max INTEGER,
  z4_percent_lthr_min NUMERIC(5,2),
  z4_percent_lthr_max NUMERIC(5,2),
  
  z5_name TEXT DEFAULT 'VO2max',
  z5_hr_min INTEGER,
  z5_hr_max INTEGER,
  z5_percent_lthr_min NUMERIC(5,2),
  z5_percent_lthr_max NUMERIC(5,2),
  
  -- Optional Z6/Z7 for Coggan model
  z6_name TEXT DEFAULT 'Anaerobic',
  z6_hr_min INTEGER,
  z6_hr_max INTEGER,
  
  z7_name TEXT DEFAULT 'Neuromuscular',
  z7_hr_min INTEGER,
  z7_hr_max INTEGER,
  
  -- Metadata
  calculated_from TEXT, -- 'test', 'estimated', 'manual'
  test_date DATE,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(athlete_id, sport)
);

-- =====================================================
-- POWER ZONES (already exists, but adding sport support)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.power_zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  athlete_id UUID REFERENCES public.athletes(id) ON DELETE CASCADE,
  sport TEXT NOT NULL DEFAULT 'cycling',
  
  -- FTP reference
  ftp_watts INTEGER NOT NULL,
  
  -- 7-Zone Coggan Model
  z1_name TEXT DEFAULT 'Active Recovery',
  z1_watts_min INTEGER,
  z1_watts_max INTEGER,
  z1_percent_ftp_min NUMERIC(5,2) DEFAULT 0,
  z1_percent_ftp_max NUMERIC(5,2) DEFAULT 55,
  
  z2_name TEXT DEFAULT 'Endurance',
  z2_watts_min INTEGER,
  z2_watts_max INTEGER,
  z2_percent_ftp_min NUMERIC(5,2) DEFAULT 56,
  z2_percent_ftp_max NUMERIC(5,2) DEFAULT 75,
  
  z3_name TEXT DEFAULT 'Tempo',
  z3_watts_min INTEGER,
  z3_watts_max INTEGER,
  z3_percent_ftp_min NUMERIC(5,2) DEFAULT 76,
  z3_percent_ftp_max NUMERIC(5,2) DEFAULT 90,
  
  z4_name TEXT DEFAULT 'Threshold',
  z4_watts_min INTEGER,
  z4_watts_max INTEGER,
  z4_percent_ftp_min NUMERIC(5,2) DEFAULT 91,
  z4_percent_ftp_max NUMERIC(5,2) DEFAULT 105,
  
  z5_name TEXT DEFAULT 'VO2max',
  z5_watts_min INTEGER,
  z5_watts_max INTEGER,
  z5_percent_ftp_min NUMERIC(5,2) DEFAULT 106,
  z5_percent_ftp_max NUMERIC(5,2) DEFAULT 120,
  
  z6_name TEXT DEFAULT 'Anaerobic Capacity',
  z6_watts_min INTEGER,
  z6_watts_max INTEGER,
  z6_percent_ftp_min NUMERIC(5,2) DEFAULT 121,
  z6_percent_ftp_max NUMERIC(5,2) DEFAULT 150,
  
  z7_name TEXT DEFAULT 'Neuromuscular Power',
  z7_watts_min INTEGER,
  z7_watts_max INTEGER,
  z7_percent_ftp_min NUMERIC(5,2) DEFAULT 151,
  z7_percent_ftp_max NUMERIC(5,2),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(athlete_id, sport)
);

-- =====================================================
-- PACE ZONES (for running/swimming)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.pace_zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  athlete_id UUID REFERENCES public.athletes(id) ON DELETE CASCADE,
  sport TEXT NOT NULL CHECK (sport IN ('running', 'trail_running', 'swimming')),
  
  -- Threshold reference
  threshold_pace TEXT, -- e.g., "4:30" for 4:30/km or "1:45" for 1:45/100m
  threshold_pace_seconds INTEGER, -- seconds per km or per 100m
  
  -- 5-Zone Model
  z1_name TEXT DEFAULT 'Recovery',
  z1_pace_min TEXT,
  z1_pace_max TEXT,
  
  z2_name TEXT DEFAULT 'Endurance',
  z2_pace_min TEXT,
  z2_pace_max TEXT,
  
  z3_name TEXT DEFAULT 'Tempo',
  z3_pace_min TEXT,
  z3_pace_max TEXT,
  
  z4_name TEXT DEFAULT 'Threshold',
  z4_pace_min TEXT,
  z4_pace_max TEXT,
  
  z5_name TEXT DEFAULT 'VO2max',
  z5_pace_min TEXT,
  z5_pace_max TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(athlete_id, sport)
);

-- =====================================================
-- UPDATE planned_workouts for multisport
-- =====================================================

-- Add sport column to planned_workouts if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'planned_workouts' AND column_name = 'sport'
  ) THEN
    ALTER TABLE planned_workouts ADD COLUMN sport TEXT DEFAULT 'cycling';
  END IF;
  
  -- Add HR zone targets
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'planned_workouts' AND column_name = 'hr_zone_target'
  ) THEN
    ALTER TABLE planned_workouts ADD COLUMN hr_zone_target TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'planned_workouts' AND column_name = 'hr_min_target'
  ) THEN
    ALTER TABLE planned_workouts ADD COLUMN hr_min_target INTEGER;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'planned_workouts' AND column_name = 'hr_max_target'
  ) THEN
    ALTER TABLE planned_workouts ADD COLUMN hr_max_target INTEGER;
  END IF;
  
  -- Add pace targets for running/swimming
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'planned_workouts' AND column_name = 'pace_target'
  ) THEN
    ALTER TABLE planned_workouts ADD COLUMN pace_target TEXT;
  END IF;
END $$;

-- =====================================================
-- UPDATE annual_training_plans for multisport
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'annual_training_plans' AND column_name = 'sport'
  ) THEN
    ALTER TABLE annual_training_plans ADD COLUMN sport TEXT DEFAULT 'cycling';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'annual_training_plans' AND column_name = 'use_hr_zones'
  ) THEN
    ALTER TABLE annual_training_plans ADD COLUMN use_hr_zones BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE public.athlete_sport_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.power_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pace_zones ENABLE ROW LEVEL SECURITY;

-- Athletes can manage their own configs
CREATE POLICY "Athletes manage own sport configs" ON public.athlete_sport_configs
  FOR ALL USING (
    athlete_id IN (SELECT id FROM public.athletes WHERE user_id = auth.uid())
  );

CREATE POLICY "Athletes manage own hr zones" ON public.hr_zones
  FOR ALL USING (
    athlete_id IN (SELECT id FROM public.athletes WHERE user_id = auth.uid())
  );

CREATE POLICY "Athletes manage own power zones" ON public.power_zones
  FOR ALL USING (
    athlete_id IN (SELECT id FROM public.athletes WHERE user_id = auth.uid())
  );

CREATE POLICY "Athletes manage own pace zones" ON public.pace_zones
  FOR ALL USING (
    athlete_id IN (SELECT id FROM public.athletes WHERE user_id = auth.uid())
  );

-- Coaches can view linked athlete zones
CREATE POLICY "Coaches view linked athlete sport configs" ON public.athlete_sport_configs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.coach_athlete_links cal
      JOIN public.athletes a ON a.user_id = cal.athlete_id
      WHERE cal.coach_id = auth.uid()
      AND a.id = athlete_sport_configs.athlete_id
      AND cal.status = 'accepted'
    )
  );

CREATE POLICY "Coaches view linked athlete hr zones" ON public.hr_zones
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.coach_athlete_links cal
      JOIN public.athletes a ON a.user_id = cal.athlete_id
      WHERE cal.coach_id = auth.uid()
      AND a.id = hr_zones.athlete_id
      AND cal.status = 'accepted'
    )
  );

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_athlete_sport_configs_athlete ON public.athlete_sport_configs(athlete_id);
CREATE INDEX IF NOT EXISTS idx_athlete_sport_configs_sport ON public.athlete_sport_configs(athlete_id, sport);
CREATE INDEX IF NOT EXISTS idx_hr_zones_athlete ON public.hr_zones(athlete_id);
CREATE INDEX IF NOT EXISTS idx_power_zones_athlete ON public.power_zones(athlete_id);
CREATE INDEX IF NOT EXISTS idx_pace_zones_athlete ON public.pace_zones(athlete_id);

-- =====================================================
-- FUNCTION: Calculate HR Zones from LTHR
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_hr_zones(
  p_athlete_id UUID,
  p_sport TEXT,
  p_hr_max INTEGER,
  p_hr_threshold INTEGER,
  p_zone_model TEXT DEFAULT 'threshold'
)
RETURNS void AS $$
DECLARE
  v_z1_min INTEGER;
  v_z1_max INTEGER;
  v_z2_min INTEGER;
  v_z2_max INTEGER;
  v_z3_min INTEGER;
  v_z3_max INTEGER;
  v_z4_min INTEGER;
  v_z4_max INTEGER;
  v_z5_min INTEGER;
  v_z5_max INTEGER;
BEGIN
  IF p_zone_model = 'threshold' THEN
    -- Based on LTHR (Friel zones)
    v_z1_min := 0;
    v_z1_max := ROUND(p_hr_threshold * 0.81);
    v_z2_min := v_z1_max + 1;
    v_z2_max := ROUND(p_hr_threshold * 0.89);
    v_z3_min := v_z2_max + 1;
    v_z3_max := ROUND(p_hr_threshold * 0.93);
    v_z4_min := v_z3_max + 1;
    v_z4_max := ROUND(p_hr_threshold * 0.99);
    v_z5_min := v_z4_max + 1;
    v_z5_max := p_hr_max;
  ELSIF p_zone_model = 'max_hr' THEN
    -- Based on HRmax
    v_z1_min := 0;
    v_z1_max := ROUND(p_hr_max * 0.60);
    v_z2_min := v_z1_max + 1;
    v_z2_max := ROUND(p_hr_max * 0.70);
    v_z3_min := v_z2_max + 1;
    v_z3_max := ROUND(p_hr_max * 0.80);
    v_z4_min := v_z3_max + 1;
    v_z4_max := ROUND(p_hr_max * 0.90);
    v_z5_min := v_z4_max + 1;
    v_z5_max := p_hr_max;
  END IF;
  
  -- Upsert HR zones
  INSERT INTO public.hr_zones (
    athlete_id, sport, zone_model,
    z1_hr_min, z1_hr_max, z1_percent_lthr_min, z1_percent_lthr_max,
    z2_hr_min, z2_hr_max, z2_percent_lthr_min, z2_percent_lthr_max,
    z3_hr_min, z3_hr_max, z3_percent_lthr_min, z3_percent_lthr_max,
    z4_hr_min, z4_hr_max, z4_percent_lthr_min, z4_percent_lthr_max,
    z5_hr_min, z5_hr_max, z5_percent_lthr_min, z5_percent_lthr_max,
    calculated_from
  )
  VALUES (
    p_athlete_id, p_sport, p_zone_model,
    v_z1_min, v_z1_max, 0, 81,
    v_z2_min, v_z2_max, 81, 89,
    v_z3_min, v_z3_max, 89, 93,
    v_z4_min, v_z4_max, 93, 99,
    v_z5_min, v_z5_max, 99, 106,
    'calculated'
  )
  ON CONFLICT (athlete_id, sport) DO UPDATE SET
    zone_model = EXCLUDED.zone_model,
    z1_hr_min = EXCLUDED.z1_hr_min, z1_hr_max = EXCLUDED.z1_hr_max,
    z2_hr_min = EXCLUDED.z2_hr_min, z2_hr_max = EXCLUDED.z2_hr_max,
    z3_hr_min = EXCLUDED.z3_hr_min, z3_hr_max = EXCLUDED.z3_hr_max,
    z4_hr_min = EXCLUDED.z4_hr_min, z4_hr_max = EXCLUDED.z4_hr_max,
    z5_hr_min = EXCLUDED.z5_hr_min, z5_hr_max = EXCLUDED.z5_hr_max,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
