-- =====================================================
-- EMPATHY x VYRIA - Foundation Schema
-- Phase 1: Identity, Organizations, Athletes
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- IDENTITY & ORGANIZATION
-- =====================================================

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'athlete' CHECK (role IN ('athlete', 'coach', 'admin')),
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organizations (team, club, coaching business)
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  owner_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Memberships (user belongs to organization)
CREATE TABLE IF NOT EXISTS public.memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'coach', 'member')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, organization_id)
);

-- Coach-Athlete relationships
CREATE TABLE IF NOT EXISTS public.coach_athlete_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  athlete_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('pending', 'active', 'paused', 'ended')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(coach_id, athlete_id)
);

-- =====================================================
-- ATHLETE PROFILE
-- =====================================================

-- Athletes base profile
CREATE TABLE IF NOT EXISTS public.athletes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Basic info
  birth_date DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  
  -- Physical data
  height_cm NUMERIC(5,2),
  weight_kg NUMERIC(5,2),
  body_fat_percent NUMERIC(4,2),
  lean_body_mass_kg NUMERIC(5,2),
  
  -- Sports
  primary_sport TEXT CHECK (primary_sport IN ('cycling', 'running', 'triathlon', 'swimming', 'gym', 'other')),
  secondary_sports TEXT[],
  experience_years INTEGER,
  
  -- Daily routine
  wake_time TIME,
  breakfast_time TIME,
  training_time TIME,
  lunch_time TIME,
  dinner_time TIME,
  sleep_time TIME,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Athlete constraints (intolerances, allergies, preferences)
CREATE TABLE IF NOT EXISTS public.athlete_constraints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  athlete_id UUID REFERENCES public.athletes(id) ON DELETE CASCADE,
  
  -- Dietary constraints
  intolerances TEXT[] DEFAULT '{}',
  allergies TEXT[] DEFAULT '{}',
  dietary_limits TEXT[] DEFAULT '{}',
  dietary_preferences TEXT[] DEFAULT '{}',
  
  -- Training constraints
  max_training_hours_week NUMERIC(4,1),
  rest_days_per_week INTEGER DEFAULT 1,
  injury_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- METABOLIC PROFILE (EMPATHY Core)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.metabolic_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  athlete_id UUID REFERENCES public.athletes(id) ON DELETE CASCADE,
  
  -- Version control
  version INTEGER NOT NULL DEFAULT 1,
  is_current BOOLEAN DEFAULT TRUE,
  
  -- Performance metrics
  ftp_watts INTEGER,
  vo2max NUMERIC(4,1),
  vlamax NUMERIC(4,3),
  
  -- Body composition
  weight_kg NUMERIC(5,2),
  body_fat_percent NUMERIC(4,2),
  lean_body_mass_kg NUMERIC(5,2),
  
  -- Calculated zones (stored as JSONB for flexibility)
  empathy_zones JSONB,
  power_duration_curve JSONB,
  
  -- Metabolic calculations
  fat_max_watts INTEGER,
  fat_max_percentage NUMERIC(4,1),
  carb_dependency_index NUMERIC(4,2),
  
  -- Test data source
  test_date DATE,
  test_type TEXT CHECK (test_type IN ('lab', 'field', 'estimated')),
  test_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- EMPATHY indices (daily/weekly metabolic state)
CREATE TABLE IF NOT EXISTS public.empathy_indices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  athlete_id UUID REFERENCES public.athletes(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  -- Metabolic state
  glycogen_status NUMERIC(3,0), -- 0-100
  hydration_status NUMERIC(3,0), -- 0-100
  fatigue_index NUMERIC(3,0), -- 0-100
  recovery_score NUMERIC(3,0), -- 0-100
  
  -- Readiness (shared with VYRIA)
  readiness_score NUMERIC(3,0), -- 0-100
  readiness_color TEXT CHECK (readiness_color IN ('green', 'yellow', 'red')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(athlete_id, date)
);

-- =====================================================
-- EXTERNAL ACCOUNTS (API Integrations)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.external_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  
  provider TEXT NOT NULL CHECK (provider IN ('strava', 'garmin', 'trainingpeaks', 'whoop', 'oura')),
  provider_user_id TEXT,
  
  -- OAuth tokens (encrypted in production)
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  
  -- Sync status
  last_sync_at TIMESTAMPTZ,
  sync_enabled BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, provider)
);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_athlete_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.athletes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.athlete_constraints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metabolic_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empathy_indices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_accounts ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Athletes policies
CREATE POLICY "Athletes can view own data" ON public.athletes
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Athletes can update own data" ON public.athletes
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Athletes can insert own data" ON public.athletes
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Coaches can view their athletes
CREATE POLICY "Coaches can view linked athletes" ON public.athletes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.coach_athlete_links
      WHERE coach_id = auth.uid()
      AND athlete_id = (SELECT user_id FROM public.athletes WHERE id = athletes.id)
      AND status = 'active'
    )
  );

-- Metabolic profiles policies
CREATE POLICY "Athletes can view own metabolic profiles" ON public.metabolic_profiles
  FOR SELECT USING (
    athlete_id IN (SELECT id FROM public.athletes WHERE user_id = auth.uid())
  );

CREATE POLICY "Athletes can manage own metabolic profiles" ON public.metabolic_profiles
  FOR ALL USING (
    athlete_id IN (SELECT id FROM public.athletes WHERE user_id = auth.uid())
  );

CREATE POLICY "Coaches can view linked athlete profiles" ON public.metabolic_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.coach_athlete_links cal
      JOIN public.athletes a ON a.user_id = cal.athlete_id
      WHERE cal.coach_id = auth.uid()
      AND a.id = metabolic_profiles.athlete_id
      AND cal.status = 'active'
    )
  );

-- External accounts policies
CREATE POLICY "Users can manage own external accounts" ON public.external_accounts
  FOR ALL USING (user_id = auth.uid());

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to relevant tables
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_athletes_updated_at
  BEFORE UPDATE ON public.athletes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_metabolic_profiles_updated_at
  BEFORE UPDATE ON public.metabolic_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- INDEXES for performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_athletes_user_id ON public.athletes(user_id);
CREATE INDEX IF NOT EXISTS idx_metabolic_profiles_athlete_id ON public.metabolic_profiles(athlete_id);
CREATE INDEX IF NOT EXISTS idx_metabolic_profiles_current ON public.metabolic_profiles(athlete_id, is_current) WHERE is_current = TRUE;
CREATE INDEX IF NOT EXISTS idx_empathy_indices_athlete_date ON public.empathy_indices(athlete_id, date);
CREATE INDEX IF NOT EXISTS idx_coach_athlete_links_coach ON public.coach_athlete_links(coach_id, status);
CREATE INDEX IF NOT EXISTS idx_external_accounts_user ON public.external_accounts(user_id, provider);
