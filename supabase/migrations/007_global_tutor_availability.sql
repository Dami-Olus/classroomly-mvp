-- Migration: Global Tutor Availability System
-- This changes the system from class-based slots to tutor-based global availability

-- 1. Add tutor_id to bookings table for direct tutor reference
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS tutor_id UUID REFERENCES tutors(id) ON DELETE CASCADE;

-- 2. Create index for faster queries on tutor bookings
CREATE INDEX IF NOT EXISTS idx_bookings_tutor_id ON bookings(tutor_id);
CREATE INDEX IF NOT EXISTS idx_bookings_tutor_status ON bookings(tutor_id, status);

-- 3. Update existing bookings to populate tutor_id from classes
UPDATE bookings b
SET tutor_id = c.tutor_id
FROM classes c
WHERE b.class_id = c.id
AND b.tutor_id IS NULL;

-- 4. Add comment explaining the new system
COMMENT ON COLUMN bookings.tutor_id IS 'Direct reference to tutor for global availability tracking. When a slot is booked, it is removed from the tutor''s global availability across ALL classes.';

-- 5. Update RLS policies for tutor_id queries
DROP POLICY IF EXISTS "Tutors can view their bookings" ON bookings;
CREATE POLICY "Tutors can view their bookings" ON bookings
  FOR SELECT
  USING (
    tutor_id IN (
      SELECT id FROM tutors WHERE user_id = auth.uid()
    )
  );

-- 6. Add policy for querying by tutor_id
DROP POLICY IF EXISTS "Anyone can view bookings by tutor" ON bookings;
CREATE POLICY "Anyone can view bookings by tutor" ON bookings
  FOR SELECT
  USING (true);

-- Note: We keep available_slots in classes for backward compatibility
-- but it's now reference data only. Real availability comes from tutor's availability
-- minus all booked slots across all classes.

COMMENT ON TABLE bookings IS 'Bookings table now tracks tutor_id directly. The global availability system means once a slot is booked for any class, it is unavailable for all other classes by that tutor.';

