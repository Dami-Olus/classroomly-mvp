-- Fix missing columns in various tables
-- Issue 1: classrooms table missing session_id column
-- Issue 2: materials table missing booking_id column (it's using session_materials structure)
-- Issue 3: Ensure all tables are properly linked

-- ============================================
-- 1. Fix classrooms table
-- ============================================
-- Add session_id to link classrooms to specific sessions
ALTER TABLE classrooms
ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES sessions(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_classrooms_session_id ON classrooms(session_id);

-- Add comment
COMMENT ON COLUMN classrooms.session_id IS 'Links classroom to a specific session (optional, for session-specific rooms)';

-- ============================================
-- 2. Consolidate materials tables
-- ============================================
-- The codebase uses 'materials' table in tutor session page
-- but 'session_materials' in other places
-- Let's ensure 'materials' table has all needed columns

-- Check if materials table exists, if not rename session_materials
DO $$
BEGIN
  -- If session_materials exists but materials doesn't, rename it
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'session_materials')
     AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'materials') THEN
    ALTER TABLE session_materials RENAME TO materials;
  END IF;
END $$;

-- Ensure materials table has all necessary columns
ALTER TABLE materials
ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES classes(id) ON DELETE CASCADE;

-- Rename uploader_id to uploaded_by for consistency with session_materials
-- First check if uploader_id exists and uploaded_by doesn't
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'materials' AND column_name = 'uploader_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'materials' AND column_name = 'uploaded_by'
  ) THEN
    ALTER TABLE materials RENAME COLUMN uploader_id TO uploaded_by;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_materials_booking_id ON materials(booking_id);
CREATE INDEX IF NOT EXISTS idx_materials_session_id ON materials(session_id);
CREATE INDEX IF NOT EXISTS idx_materials_class_id ON materials(class_id);

-- ============================================
-- 3. Fix RLS policies for materials
-- ============================================
-- Drop old policies if they exist
DROP POLICY IF EXISTS "Participants can view materials" ON materials;
DROP POLICY IF EXISTS "Participants can upload" ON materials;
DROP POLICY IF EXISTS "Uploaders can delete" ON materials;

-- Enable RLS
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;

-- Allow viewing materials for booking participants
CREATE POLICY "Booking participants can view materials"
  ON materials FOR SELECT
  USING (
    booking_id IN (
      SELECT b.id FROM bookings b
      WHERE b.student_id = auth.uid()
      OR b.tutor_id IN (
        SELECT id FROM tutors WHERE user_id = auth.uid()
      )
    )
  );

-- Allow uploading materials
CREATE POLICY "Authenticated users can upload materials"
  ON materials FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Allow deleters to delete their own uploads
CREATE POLICY "Users can delete their uploads"
  ON materials FOR DELETE
  USING (uploaded_by = auth.uid());

-- ============================================
-- 4. Ensure classrooms RLS allows both tutor and student access
-- ============================================
-- Drop restrictive policies
DROP POLICY IF EXISTS "Tutors can view their classrooms" ON classrooms;
DROP POLICY IF EXISTS "Students can view their classrooms" ON classrooms;
DROP POLICY IF EXISTS "Tutors can manage classrooms" ON classrooms;

-- Create more permissive policies

-- Anyone in the booking can view the classroom
CREATE POLICY "Booking participants can view classrooms"
  ON classrooms FOR SELECT
  USING (
    booking_id IN (
      SELECT b.id FROM bookings b
      WHERE b.student_id = auth.uid()
      OR b.tutor_id IN (
        SELECT id FROM tutors WHERE user_id = auth.uid()
      )
    )
  );

-- Both tutor and student can start the session (update classroom)
CREATE POLICY "Booking participants can start sessions"
  ON classrooms FOR UPDATE
  USING (
    booking_id IN (
      SELECT b.id FROM bookings b
      WHERE b.student_id = auth.uid()
      OR b.tutor_id IN (
        SELECT id FROM tutors WHERE user_id = auth.uid()
      )
    )
  );

-- Tutors can create classrooms
CREATE POLICY "Tutors can create classrooms"
  ON classrooms FOR INSERT
  WITH CHECK (
    booking_id IN (
      SELECT b.id FROM bookings b
      WHERE b.tutor_id IN (
        SELECT id FROM tutors WHERE user_id = auth.uid()
      )
    )
  );

-- ============================================
-- 5. Update sessions RLS for better access
-- ============================================
-- Allow both tutor and student to update session status
DROP POLICY IF EXISTS "Tutors can update their sessions" ON sessions;

CREATE POLICY "Booking participants can update sessions"
  ON sessions FOR UPDATE
  USING (
    booking_id IN (
      SELECT b.id FROM bookings b
      WHERE b.student_id = auth.uid()
      OR b.tutor_id IN (
        SELECT id FROM tutors WHERE user_id = auth.uid()
      )
    )
  );

-- ============================================
-- Success message
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Migration complete: Fixed missing columns and RLS policies';
  RAISE NOTICE '   - Added session_id to classrooms table';
  RAISE NOTICE '   - Added booking_id to materials table';
  RAISE NOTICE '   - Fixed RLS policies for materials';
  RAISE NOTICE '   - Fixed RLS policies for classrooms (both tutor & student can start)';
  RAISE NOTICE '   - Fixed RLS policies for sessions (both can update)';
END $$;

