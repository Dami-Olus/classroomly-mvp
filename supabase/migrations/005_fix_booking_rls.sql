-- Fix RLS policies to allow public bookings
-- Students can book WITHOUT being authenticated

-- Drop existing booking policies
DROP POLICY IF EXISTS "Bookings are viewable by tutor and student" ON bookings;
DROP POLICY IF EXISTS "Anyone can create a booking" ON bookings;
DROP POLICY IF EXISTS "Tutor and student can update bookings" ON bookings;

-- Create new policies that allow public booking

-- 1. Anyone (even unauthenticated) can create a booking
CREATE POLICY "Public can create bookings"
  ON bookings FOR INSERT
  TO public
  WITH CHECK (true);

-- 2. Authenticated users can view their own bookings as students
CREATE POLICY "Students can view own bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

-- 3. Tutors can view bookings for their classes
CREATE POLICY "Tutors can view their class bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    class_id IN (
      SELECT c.id FROM classes c
      JOIN tutors t ON t.id = c.tutor_id
      WHERE t.user_id = auth.uid()
    )
  );

-- 4. Both tutor and student can update bookings
CREATE POLICY "Participants can update bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (
    student_id = auth.uid() OR
    class_id IN (
      SELECT c.id FROM classes c
      JOIN tutors t ON t.id = c.tutor_id
      WHERE t.user_id = auth.uid()
    )
  );

-- Also fix classrooms RLS for public booking page
DROP POLICY IF EXISTS "Classroom participants can view" ON classrooms;
DROP POLICY IF EXISTS "Classroom participants can update" ON classrooms;

-- Allow public to create classrooms (for booking flow)
CREATE POLICY "Public can create classrooms"
  ON classrooms FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow participants to view classrooms
CREATE POLICY "Participants can view classrooms"
  ON classrooms FOR SELECT
  USING (
    booking_id IN (
      SELECT b.id FROM bookings b
      WHERE b.student_id = auth.uid() OR
      b.class_id IN (
        SELECT c.id FROM classes c
        JOIN tutors t ON t.id = c.tutor_id
        WHERE t.user_id = auth.uid()
      )
    )
  );

-- Allow anyone with the room URL to view (for guest access)
CREATE POLICY "Anyone with room URL can view"
  ON classrooms FOR SELECT
  TO public
  USING (true);

-- Allow participants to update classrooms
CREATE POLICY "Participants can update classrooms"
  ON classrooms FOR UPDATE
  USING (
    booking_id IN (
      SELECT b.id FROM bookings b
      WHERE b.student_id = auth.uid() OR
      b.class_id IN (
        SELECT c.id FROM classes c
        JOIN tutors t ON t.id = c.tutor_id
        WHERE t.user_id = auth.uid()
      )
    )
  );

-- Verify the policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename IN ('bookings', 'classrooms')
ORDER BY tablename, policyname;

-- Success message
DO $$ 
BEGIN 
  RAISE NOTICE '✓ Booking RLS policies updated';
  RAISE NOTICE '✓ Public bookings are now allowed';
  RAISE NOTICE '✓ Try booking again!';
END $$;

