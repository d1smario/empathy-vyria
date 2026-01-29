-- Create table for activity datapoints (time-series data)
-- This avoids the REST API payload size limit by storing points as individual rows

CREATE TABLE IF NOT EXISTS activity_datapoints (
  id BIGSERIAL PRIMARY KEY,
  activity_id UUID NOT NULL REFERENCES imported_activities(id) ON DELETE CASCADE,
  time_offset INTEGER NOT NULL, -- seconds from start
  power SMALLINT,
  heart_rate SMALLINT,
  cadence SMALLINT,
  speed REAL, -- m/s
  elevation REAL, -- meters
  latitude REAL,
  longitude REAL,
  temperature REAL,
  distance REAL, -- meters from start
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast queries by activity
CREATE INDEX IF NOT EXISTS idx_activity_datapoints_activity_id 
  ON activity_datapoints(activity_id);

-- Index for time-based queries within an activity
CREATE INDEX IF NOT EXISTS idx_activity_datapoints_activity_time 
  ON activity_datapoints(activity_id, time_offset);

-- Enable RLS
ALTER TABLE activity_datapoints ENABLE ROW LEVEL SECURITY;

-- RLS policy: users can only access datapoints for their own activities
CREATE POLICY "Users can view own activity datapoints" ON activity_datapoints
  FOR SELECT USING (
    activity_id IN (
      SELECT id FROM imported_activities WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own activity datapoints" ON activity_datapoints
  FOR INSERT WITH CHECK (
    activity_id IN (
      SELECT id FROM imported_activities WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own activity datapoints" ON activity_datapoints
  FOR DELETE USING (
    activity_id IN (
      SELECT id FROM imported_activities WHERE user_id = auth.uid()
    )
  );
