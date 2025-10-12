-- Sprint 5 Feature 2: Rescheduling System
-- Allow tutors and students to request booking time changes with approval workflow

-- Create reschedule_requests table
CREATE TABLE IF NOT EXISTS reschedule_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES profiles(id),
  original_slot JSONB NOT NULL, -- {day, time, date}
  proposed_slot JSONB NOT NULL, -- {day, time, date}
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  responded_by UUID REFERENCES profiles(id),
  response_note TEXT,
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_status CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_reschedule_booking ON reschedule_requests(booking_id);
CREATE INDEX IF NOT EXISTS idx_reschedule_status ON reschedule_requests(status);
CREATE INDEX IF NOT EXISTS idx_reschedule_requested_by ON reschedule_requests(requested_by);
CREATE INDEX IF NOT EXISTS idx_reschedule_responded_by ON reschedule_requests(responded_by);

-- Enable RLS
ALTER TABLE reschedule_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Booking participants can view reschedule requests for their bookings
CREATE POLICY "Booking participants can view reschedule requests" ON reschedule_requests
  FOR SELECT USING (
    requested_by = auth.uid() OR
    responded_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM bookings b
      JOIN classes c ON b.class_id = c.id
      JOIN tutors t ON c.tutor_id = t.id
      WHERE b.id = reschedule_requests.booking_id
      AND (b.student_id = auth.uid() OR t.user_id = auth.uid())
    )
  );

-- Booking participants can create reschedule requests
CREATE POLICY "Participants can create reschedule requests" ON reschedule_requests
  FOR INSERT WITH CHECK (
    requested_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM bookings b
      JOIN classes c ON b.class_id = c.id
      JOIN tutors t ON c.tutor_id = t.id
      WHERE b.id = reschedule_requests.booking_id
      AND (b.student_id = auth.uid() OR t.user_id = auth.uid())
    )
  );

-- Users can update reschedule requests they're involved in
CREATE POLICY "Participants can update reschedule requests" ON reschedule_requests
  FOR UPDATE USING (
    requested_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM bookings b
      JOIN classes c ON b.class_id = c.id
      JOIN tutors t ON c.tutor_id = t.id
      WHERE b.id = reschedule_requests.booking_id
      AND (b.student_id = auth.uid() OR t.user_id = auth.uid())
    )
  );

-- Add reschedule count to bookings (optional - for tracking)
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS reschedule_count INTEGER DEFAULT 0;

-- Trigger to update booking status when request is accepted
CREATE OR REPLACE FUNCTION handle_reschedule_accepted()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if status changed to 'accepted'
  IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
    -- Update booking scheduled_slots
    -- This is a simplified version - in production you'd want more complex logic
    -- to handle which specific slot to update
    UPDATE bookings
    SET 
      reschedule_count = reschedule_count + 1,
      updated_at = NOW()
    WHERE id = NEW.booking_id;
    
    -- Note: Actual slot update should be done in application logic
    -- because it requires knowing which specific slot in the array to update
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_reschedule_accepted ON reschedule_requests;
CREATE TRIGGER on_reschedule_accepted
  AFTER UPDATE ON reschedule_requests
  FOR EACH ROW
  EXECUTE FUNCTION handle_reschedule_accepted();

-- Comments
COMMENT ON TABLE reschedule_requests IS 'Requests to reschedule bookings with approval workflow';
COMMENT ON COLUMN reschedule_requests.original_slot IS 'The original scheduled slot being rescheduled';
COMMENT ON COLUMN reschedule_requests.proposed_slot IS 'The new proposed time slot';
COMMENT ON COLUMN reschedule_requests.status IS 'pending, accepted, declined, or cancelled';
COMMENT ON COLUMN reschedule_requests.responded_by IS 'User who accepted/declined the request';
COMMENT ON COLUMN reschedule_requests.response_note IS 'Optional note from responder';

-- Add constraint to limit reschedules per booking (optional)
-- This prevents abuse - max 3 reschedule requests per booking
CREATE OR REPLACE FUNCTION check_reschedule_limit()
RETURNS TRIGGER AS $$
DECLARE
  request_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO request_count
  FROM reschedule_requests
  WHERE booking_id = NEW.booking_id;
  
  IF request_count >= 3 THEN
    RAISE EXCEPTION 'Maximum reschedule requests (3) reached for this booking';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_reschedule_limit_trigger ON reschedule_requests;
CREATE TRIGGER check_reschedule_limit_trigger
  BEFORE INSERT ON reschedule_requests
  FOR EACH ROW
  EXECUTE FUNCTION check_reschedule_limit();

