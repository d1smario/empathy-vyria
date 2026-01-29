-- Create athlete_reports table for storing microbiome, genetic, and blood test data
-- with AI analysis results

CREATE TABLE IF NOT EXISTS athlete_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL CHECK (report_type IN ('microbiome', 'genetic', 'blood', 'epigenetic')),
  report_name TEXT NOT NULL,
  report_date DATE DEFAULT CURRENT_DATE,
  raw_data TEXT,
  parsed_data JSONB,
  ai_analysis JSONB,
  ai_recommendations JSONB,
  ai_pathways JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'parsing', 'parsed', 'analyzed', 'error')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_athlete_reports_athlete_id ON athlete_reports(athlete_id);
CREATE INDEX IF NOT EXISTS idx_athlete_reports_type ON athlete_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_athlete_reports_date ON athlete_reports(report_date DESC);

-- Enable RLS
ALTER TABLE athlete_reports ENABLE ROW LEVEL SECURITY;

-- Policy: Athletes can view their own reports
CREATE POLICY "Athletes can view own reports"
  ON athlete_reports
  FOR SELECT
  USING (
    athlete_id IN (
      SELECT id FROM athletes WHERE user_id = auth.uid()
    )
  );

-- Policy: Athletes can insert their own reports
CREATE POLICY "Athletes can insert own reports"
  ON athlete_reports
  FOR INSERT
  WITH CHECK (
    athlete_id IN (
      SELECT id FROM athletes WHERE user_id = auth.uid()
    )
  );

-- Policy: Athletes can update their own reports
CREATE POLICY "Athletes can update own reports"
  ON athlete_reports
  FOR UPDATE
  USING (
    athlete_id IN (
      SELECT id FROM athletes WHERE user_id = auth.uid()
    )
  );

-- Policy: Athletes can delete their own reports
CREATE POLICY "Athletes can delete own reports"
  ON athlete_reports
  FOR DELETE
  USING (
    athlete_id IN (
      SELECT id FROM athletes WHERE user_id = auth.uid()
    )
  );

-- Policy: Coaches can view reports of their athletes
CREATE POLICY "Coaches can view athlete reports"
  ON athlete_reports
  FOR SELECT
  USING (
    athlete_id IN (
      SELECT a.id FROM athletes a
      JOIN coach_athletes ca ON a.id = ca.athlete_id
      JOIN coaches c ON ca.coach_id = c.id
      WHERE c.user_id = auth.uid()
    )
  );

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_athlete_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_athlete_reports_updated_at
  BEFORE UPDATE ON athlete_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_athlete_reports_updated_at();
