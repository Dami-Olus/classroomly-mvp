-- Sprint 5 Feature 3: Session Notes
-- Allow tutors to document sessions, track progress, assign homework

-- Create session_notes table
CREATE TABLE IF NOT EXISTS session_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  tutor_id UUID NOT NULL REFERENCES tutors(id),
  
  -- Main content
  content TEXT NOT NULL,
  topics_covered TEXT[], -- Array of topics discussed
  homework_assigned TEXT,
  
  -- Student performance tracking
  student_performance TEXT,
  strengths TEXT, -- What student did well
  areas_for_improvement TEXT, -- What needs work
  
  -- Private notes (only tutor can see)
  private_notes TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_performance CHECK (
    student_performance IN ('excellent', 'good', 'satisfactory', 'needs_improvement', NULL)
  )
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notes_booking ON session_notes(booking_id);
CREATE INDEX IF NOT EXISTS idx_notes_tutor ON session_notes(tutor_id);
CREATE INDEX IF NOT EXISTS idx_notes_created ON session_notes(created_at DESC);

-- Enable RLS
ALTER TABLE session_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Tutors and students can view notes (students can't see private_notes)
CREATE POLICY "Booking participants can view notes" ON session_notes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bookings b
      JOIN classes c ON b.class_id = c.id
      JOIN tutors t ON c.tutor_id = t.id
      WHERE b.id = session_notes.booking_id
      AND (b.student_id = auth.uid() OR t.user_id = auth.uid())
    )
  );

-- Only tutors can create notes
CREATE POLICY "Tutors can create notes" ON session_notes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM tutors 
      WHERE id = session_notes.tutor_id 
      AND user_id = auth.uid()
    )
  );

-- Only tutors can update their own notes
CREATE POLICY "Tutors can update their notes" ON session_notes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM tutors 
      WHERE id = session_notes.tutor_id 
      AND user_id = auth.uid()
    )
  );

-- Only tutors can delete their notes
CREATE POLICY "Tutors can delete their notes" ON session_notes
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM tutors 
      WHERE id = session_notes.tutor_id 
      AND user_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_session_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS session_notes_updated_at ON session_notes;
CREATE TRIGGER session_notes_updated_at
  BEFORE UPDATE ON session_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_session_notes_updated_at();

-- Comments
COMMENT ON TABLE session_notes IS 'Notes taken by tutors after each session to track student progress';
COMMENT ON COLUMN session_notes.content IS 'Main session summary and notes';
COMMENT ON COLUMN session_notes.topics_covered IS 'Array of topics/concepts covered in the session';
COMMENT ON COLUMN session_notes.homework_assigned IS 'Homework or tasks assigned for next session';
COMMENT ON COLUMN session_notes.student_performance IS 'Overall performance rating for the session';
COMMENT ON COLUMN session_notes.strengths IS 'What the student did well in this session';
COMMENT ON COLUMN session_notes.areas_for_improvement IS 'Areas where student needs more practice';
COMMENT ON COLUMN session_notes.private_notes IS 'Private tutor notes, not visible to student (e.g., teaching strategies, personal reminders)';

