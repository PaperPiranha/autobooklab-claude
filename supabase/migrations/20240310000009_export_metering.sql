-- Export metering: track exports per user per month
CREATE TABLE IF NOT EXISTS export_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  format text NOT NULL,  -- 'pdf', 'epub'
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_export_usage_user_month
  ON export_usage (user_id, created_at DESC);

-- RLS
ALTER TABLE export_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own export usage"
  ON export_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own export usage"
  ON export_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);
