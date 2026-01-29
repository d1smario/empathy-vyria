-- =====================================================
-- COACHES TABLE
-- Schema for coach profiles (separate from athletes)
-- =====================================================

-- Create coaches table
CREATE TABLE IF NOT EXISTS coaches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Contact info
  phone TEXT,
  bio TEXT,
  
  -- Expertise
  primary_sport TEXT NOT NULL DEFAULT 'cycling',
  secondary_sports TEXT[] DEFAULT '{}',
  certifications TEXT[] DEFAULT '{}',
  experience_years TEXT DEFAULT '1-3',
  
  -- Coaching settings
  max_athletes INT DEFAULT 10,
  current_athletes_count INT DEFAULT 0,
  coaching_philosophy TEXT,
  
  -- Links
  website TEXT,
  social_links JSONB DEFAULT '{}',
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_accepting_athletes BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_coaches_user_id ON coaches(user_id);
CREATE INDEX IF NOT EXISTS idx_coaches_primary_sport ON coaches(primary_sport);
CREATE INDEX IF NOT EXISTS idx_coaches_is_accepting ON coaches(is_accepting_athletes) WHERE is_accepting_athletes = true;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_coaches_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS coaches_updated_at ON coaches;
CREATE TRIGGER coaches_updated_at
  BEFORE UPDATE ON coaches
  FOR EACH ROW
  EXECUTE FUNCTION update_coaches_updated_at();

-- RLS Policies
ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;

-- Coaches can read their own profile
CREATE POLICY "Coaches can view own profile"
  ON coaches FOR SELECT
  USING (auth.uid() = user_id);

-- Coaches can update their own profile
CREATE POLICY "Coaches can update own profile"
  ON coaches FOR UPDATE
  USING (auth.uid() = user_id);

-- Coaches can insert their own profile
CREATE POLICY "Coaches can insert own profile"
  ON coaches FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Athletes can view their coach's profile
CREATE POLICY "Athletes can view their coach"
  ON coaches FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM athletes a
      WHERE a.coach_id = coaches.id
      AND a.user_id = auth.uid()
    )
  );

-- =====================================================
-- COACH-ATHLETE RELATIONSHIP
-- Add coach_id to athletes table if not exists
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'athletes' AND column_name = 'coach_id'
  ) THEN
    ALTER TABLE athletes ADD COLUMN coach_id UUID REFERENCES coaches(id) ON DELETE SET NULL;
    CREATE INDEX idx_athletes_coach_id ON athletes(coach_id);
  END IF;
END $$;

-- =====================================================
-- COACH INVITATIONS TABLE
-- For coaches to invite athletes
-- =====================================================

CREATE TABLE IF NOT EXISTS coach_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  
  -- Invitation details
  email TEXT NOT NULL,
  athlete_name TEXT,
  invitation_code TEXT NOT NULL UNIQUE,
  message TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
  accepted_at TIMESTAMPTZ,
  
  -- Constraints
  UNIQUE(coach_id, email)
);

CREATE INDEX IF NOT EXISTS idx_coach_invitations_code ON coach_invitations(invitation_code);
CREATE INDEX IF NOT EXISTS idx_coach_invitations_email ON coach_invitations(email);
CREATE INDEX IF NOT EXISTS idx_coach_invitations_status ON coach_invitations(status);

-- RLS for invitations
ALTER TABLE coach_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can manage their invitations"
  ON coach_invitations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM coaches c
      WHERE c.id = coach_invitations.coach_id
      AND c.user_id = auth.uid()
    )
  );

-- Function to generate invitation code
CREATE OR REPLACE FUNCTION generate_invitation_code()
RETURNS TEXT AS $$
BEGIN
  RETURN upper(substr(md5(random()::text), 1, 8));
END;
$$ LANGUAGE plpgsql;
