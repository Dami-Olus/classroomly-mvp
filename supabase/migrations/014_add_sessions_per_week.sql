-- ============================================
-- Migration 014: Add sessions_per_week column
-- ============================================
-- Add sessions_per_week column to bookings table for import functionality

-- Add sessions_per_week column to bookings table
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS sessions_per_week INTEGER;

-- Add start_date column to bookings table
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS start_date DATE;

-- Add comments for clarity
COMMENT ON COLUMN bookings.sessions_per_week IS 'Number of sessions per week for this booking';
COMMENT ON COLUMN bookings.start_date IS 'Start date for the booking sessions';

-- Update existing bookings to have a default value
-- For existing bookings, we'll calculate based on scheduled_slots
UPDATE bookings 
SET sessions_per_week = (
  SELECT COUNT(DISTINCT jsonb_array_elements(scheduled_slots)->>'day')
  FROM bookings b2 
  WHERE b2.id = bookings.id
)
WHERE sessions_per_week IS NULL;

-- Set default value for any remaining NULL values
UPDATE bookings 
SET sessions_per_week = 1 
WHERE sessions_per_week IS NULL;
