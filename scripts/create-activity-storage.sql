-- Create storage bucket for activity data (dataPoints, original files)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'activity-data',
  'activity-data',
  false,
  52428800, -- 50MB limit per file
  ARRAY['application/json', 'application/octet-stream', 'application/gzip']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for activity-data bucket
-- Users can only access their own activity data
CREATE POLICY "Users can upload their own activity data"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'activity-data' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can read their own activity data"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'activity-data' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own activity data"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'activity-data' AND (storage.foldername(name))[1] = auth.uid()::text);
