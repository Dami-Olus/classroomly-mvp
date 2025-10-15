-- ============================================
-- Migration 015: Fix class_reports RLS policies
-- ============================================
-- Fix RLS policy violations for class_reports table

-- Drop all existing class_reports policies to avoid conflicts
DROP POLICY IF EXISTS "Tutors can manage their class reports" ON class_reports;
DROP POLICY IF EXISTS "Tutors can create reports" ON class_reports;
DROP POLICY IF EXISTS "Tutors can view their reports" ON class_reports;
DROP POLICY IF EXISTS "Tutors can update their reports" ON class_reports;
DROP POLICY IF EXISTS "Tutors can delete their reports" ON class_reports;
DROP POLICY IF EXISTS "Students can view shared reports" ON class_reports;

-- Create comprehensive RLS policies for class_reports
-- Tutors can create reports for their classes
CREATE POLICY "Tutors can create class reports"
  ON class_reports FOR INSERT
  WITH CHECK (
    tutor_id IN (
      SELECT id FROM tutors WHERE user_id = auth.uid()
    )
  );

-- Tutors can view their own reports
CREATE POLICY "Tutors can view their class reports"
  ON class_reports FOR SELECT
  USING (
    tutor_id IN (
      SELECT id FROM tutors WHERE user_id = auth.uid()
    )
  );

-- Tutors can update their own reports
CREATE POLICY "Tutors can update their class reports"
  ON class_reports FOR UPDATE
  USING (
    tutor_id IN (
      SELECT id FROM tutors WHERE user_id = auth.uid()
    )
  );

-- Tutors can delete their own reports
CREATE POLICY "Tutors can delete their class reports"
  ON class_reports FOR DELETE
  USING (
    tutor_id IN (
      SELECT id FROM tutors WHERE user_id = auth.uid()
    )
  );

-- Students can view reports shared with them
CREATE POLICY "Students can view shared class reports"
  ON class_reports FOR SELECT
  USING (
    student_id = auth.uid() 
    AND is_shared_with_student = true
  );

-- Add comments for clarity
COMMENT ON TABLE class_reports IS 'Periodic reports aggregating session notes for classes';
COMMENT ON COLUMN class_reports.tutor_id IS 'Tutor who created the report';
COMMENT ON COLUMN class_reports.student_id IS 'Student the report is about';
COMMENT ON COLUMN class_reports.is_shared_with_student IS 'Whether the report is shared with the student';
COMMENT ON COLUMN class_reports.report_period IS 'Human-readable period (e.g., "January 2024", "Month 1")';
