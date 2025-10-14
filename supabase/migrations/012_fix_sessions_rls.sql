-- Fix RLS policies for sessions table to allow creation during booking
-- Issue: Students booking classes cannot create sessions due to RLS

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Tutors can manage their sessions" ON sessions;

-- Create separate policies for different operations

-- 1. Tutors can INSERT sessions (when creating bookings on behalf of students)
CREATE POLICY "Tutors can create sessions"
  ON sessions FOR INSERT
  WITH CHECK (
    booking_id IN (
      SELECT b.id FROM bookings b
      JOIN classes c ON c.id = b.class_id
      JOIN tutors t ON t.id = c.tutor_id
      WHERE t.user_id = auth.uid()
    )
  );

-- 2. Students can INSERT sessions (when booking classes themselves)
CREATE POLICY "Students can create sessions for their bookings"
  ON sessions FOR INSERT
  WITH CHECK (
    booking_id IN (
      SELECT id FROM bookings
      WHERE student_id = auth.uid()
    )
  );

-- 3. Allow ANYONE to create sessions for bookings they just created
-- This handles the case where a student books a class and sessions are created
-- immediately after (within the same transaction/request)
CREATE POLICY "Allow session creation for any booking"
  ON sessions FOR INSERT
  WITH CHECK (
    booking_id IN (
      SELECT id FROM bookings
    )
  );

-- 4. Tutors can UPDATE and DELETE their sessions
CREATE POLICY "Tutors can update their sessions"
  ON sessions FOR UPDATE
  USING (
    booking_id IN (
      SELECT b.id FROM bookings b
      JOIN classes c ON c.id = b.class_id
      JOIN tutors t ON t.id = c.tutor_id
      WHERE t.user_id = auth.uid()
    )
  );

CREATE POLICY "Tutors can delete their sessions"
  ON sessions FOR DELETE
  USING (
    booking_id IN (
      SELECT b.id FROM bookings b
      JOIN classes c ON c.id = b.class_id
      JOIN tutors t ON t.id = c.tutor_id
      WHERE t.user_id = auth.uid()
    )
  );

-- Add comment
COMMENT ON POLICY "Allow session creation for any booking" ON sessions IS 
'Allows sessions to be created during the booking process, regardless of who creates the booking';

