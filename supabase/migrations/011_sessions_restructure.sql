-- ============================================
-- Migration 011: Sessions Restructure
-- ============================================
-- This migration restructures the app to support:
-- - Multiple sessions per booking
-- - Individual session management
-- - Class-level notes and reports
-- - Session-level notes and materials

-- ============================================
-- 1. Create sessions table
-- ============================================
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  session_number INTEGER NOT NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  scheduled_day TEXT NOT NULL, -- 'Monday', 'Tuesday', etc.
  duration INTEGER NOT NULL, -- minutes
  status TEXT DEFAULT 'scheduled', -- 'scheduled', 'completed', 'cancelled', 'rescheduled', 'no_show'
  classroom_id UUID REFERENCES classrooms(id), -- Created when session starts
  completed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_status CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled', 'no_show')),
  CONSTRAINT positive_session_number CHECK (session_number > 0),
  CONSTRAINT positive_duration CHECK (duration > 0)
);

-- Indexes for performance
CREATE INDEX idx_sessions_booking_id ON sessions(booking_id);
CREATE INDEX idx_sessions_scheduled_date ON sessions(scheduled_date);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_classroom_id ON sessions(classroom_id);

-- ============================================
-- 2. Create class_notes table
-- ============================================
CREATE TABLE IF NOT EXISTS class_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  tutor_id UUID NOT NULL REFERENCES tutors(id),
  student_background TEXT,
  learning_style TEXT,
  goals TEXT,
  parent_contact TEXT,
  special_considerations TEXT,
  overall_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- One set of class notes per class
  UNIQUE(class_id)
);

-- Index for performance
CREATE INDEX idx_class_notes_class_id ON class_notes(class_id);
CREATE INDEX idx_class_notes_tutor_id ON class_notes(tutor_id);

-- ============================================
-- 3. Create class_reports table
-- ============================================
CREATE TABLE IF NOT EXISTS class_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  tutor_id UUID NOT NULL REFERENCES tutors(id),
  student_id UUID,
  report_period TEXT NOT NULL, -- 'January 2024', 'Month 1', 'Q1 2024'
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  sessions_completed INTEGER DEFAULT 0,
  total_hours DECIMAL(10,2) DEFAULT 0,
  overall_summary TEXT,
  strengths TEXT,
  areas_for_improvement TEXT,
  recommendations TEXT,
  next_steps TEXT,
  is_shared_with_student BOOLEAN DEFAULT false,
  shared_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_class_reports_class_id ON class_reports(class_id);
CREATE INDEX idx_class_reports_booking_id ON class_reports(booking_id);
CREATE INDEX idx_class_reports_tutor_id ON class_reports(tutor_id);
CREATE INDEX idx_class_reports_student_id ON class_reports(student_id);
CREATE INDEX idx_class_reports_dates ON class_reports(start_date, end_date);

-- ============================================
-- 4. Update session_notes to link to sessions
-- ============================================
-- Add session_id column
ALTER TABLE session_notes
ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES sessions(id) ON DELETE CASCADE;

-- Create index
CREATE INDEX IF NOT EXISTS idx_session_notes_session_id ON session_notes(session_id);

-- Make booking_id nullable since notes are now tied to sessions
ALTER TABLE session_notes
ALTER COLUMN booking_id DROP NOT NULL;

-- ============================================
-- 5. Update session_materials for both class and session level
-- ============================================
-- Add columns for class-level and session-level materials
ALTER TABLE session_materials
ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS material_type TEXT DEFAULT 'session'; -- 'session', 'class'

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_session_materials_class_id ON session_materials(class_id);
CREATE INDEX IF NOT EXISTS idx_session_materials_session_id ON session_materials(session_id);

-- Make booking_id nullable
ALTER TABLE session_materials
ALTER COLUMN booking_id DROP NOT NULL;

-- Add constraint: material must belong to booking OR class OR session
ALTER TABLE session_materials
ADD CONSTRAINT check_material_ownership 
  CHECK (
    (booking_id IS NOT NULL AND class_id IS NULL AND session_id IS NULL) OR
    (booking_id IS NULL AND class_id IS NOT NULL AND session_id IS NULL) OR
    (booking_id IS NULL AND class_id IS NULL AND session_id IS NOT NULL)
  );

-- ============================================
-- 6. Update bookings table
-- ============================================
-- Add fields for booking duration and frequency
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS total_sessions INTEGER, -- null means ongoing
ADD COLUMN IF NOT EXISTS sessions_per_week INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS end_date DATE;

-- ============================================
-- 7. Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_reports ENABLE ROW LEVEL SECURITY;

-- Sessions Policies
-- Tutors can view their own sessions
CREATE POLICY "Tutors can view their sessions"
  ON sessions FOR SELECT
  USING (
    booking_id IN (
      SELECT b.id FROM bookings b
      JOIN classes c ON c.id = b.class_id
      JOIN tutors t ON t.id = c.tutor_id
      WHERE t.user_id = auth.uid()
    )
  );

-- Students can view their own sessions
CREATE POLICY "Students can view their sessions"
  ON sessions FOR SELECT
  USING (
    booking_id IN (
      SELECT id FROM bookings
      WHERE student_id = auth.uid()
    )
  );

-- Tutors can manage their sessions
CREATE POLICY "Tutors can manage their sessions"
  ON sessions FOR ALL
  USING (
    booking_id IN (
      SELECT b.id FROM bookings b
      JOIN classes c ON c.id = b.class_id
      JOIN tutors t ON t.id = c.tutor_id
      WHERE t.user_id = auth.uid()
    )
  );

-- Class Notes Policies
-- Tutors can view/manage their class notes
CREATE POLICY "Tutors can manage their class notes"
  ON class_notes FOR ALL
  USING (tutor_id IN (SELECT id FROM tutors WHERE user_id = auth.uid()));

-- Students can view class notes for their classes
CREATE POLICY "Students can view class notes"
  ON class_notes FOR SELECT
  USING (
    class_id IN (
      SELECT c.id FROM classes c
      JOIN bookings b ON b.class_id = c.id
      WHERE b.student_id = auth.uid()
    )
  );

-- Class Reports Policies
-- Tutors can manage their class reports
CREATE POLICY "Tutors can manage their class reports"
  ON class_reports FOR ALL
  USING (tutor_id IN (SELECT id FROM tutors WHERE user_id = auth.uid()));

-- Students can view shared reports
CREATE POLICY "Students can view shared reports"
  ON class_reports FOR SELECT
  USING (
    student_id = auth.uid() 
    AND is_shared_with_student = true
  );

-- ============================================
-- 8. Functions and Triggers
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_class_notes_updated_at
  BEFORE UPDATE ON class_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_class_reports_updated_at
  BEFORE UPDATE ON class_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 9. Comments for documentation
-- ============================================
COMMENT ON TABLE sessions IS 'Individual session instances for each booking';
COMMENT ON TABLE class_notes IS 'Overall notes for a class (student background, goals, etc.)';
COMMENT ON TABLE class_reports IS 'Periodic reports aggregating session notes';
COMMENT ON COLUMN sessions.session_number IS 'Sequential number within the booking (1, 2, 3...)';
COMMENT ON COLUMN sessions.status IS 'Current status of the session';
COMMENT ON COLUMN class_reports.report_period IS 'Human-readable period (e.g., "January 2024", "Month 1")';
COMMENT ON COLUMN session_materials.material_type IS 'Whether material is for a specific session or entire class';

-- ============================================
-- Migration complete!
-- ============================================

