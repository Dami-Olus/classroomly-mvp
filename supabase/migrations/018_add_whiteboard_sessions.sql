-- Add whiteboard sessions table
CREATE TABLE IF NOT EXISTS whiteboard_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id TEXT UNIQUE NOT NULL,
  session_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policy for whiteboard sessions
ALTER TABLE whiteboard_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can access whiteboard sessions for their classrooms
CREATE POLICY "Users can access whiteboard sessions for their classrooms" ON whiteboard_sessions
  FOR ALL USING (
    room_id IN (
      SELECT id FROM classrooms 
      WHERE tutor_id = auth.uid() OR student_id = auth.uid()
    )
  );

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_whiteboard_sessions_room_id ON whiteboard_sessions(room_id);
CREATE INDEX IF NOT EXISTS idx_whiteboard_sessions_updated_at ON whiteboard_sessions(updated_at);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_whiteboard_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_whiteboard_sessions_updated_at
  BEFORE UPDATE ON whiteboard_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_whiteboard_sessions_updated_at();
