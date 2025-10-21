-- ============================================
-- Migration 019: Fix scheduled_slots null constraint
-- ============================================
-- Fix the issue where scheduled_slots can be null, causing constraint violations

-- First, update any existing NULL values to an empty array
UPDATE bookings 
SET scheduled_slots = '[]'::jsonb 
WHERE scheduled_slots IS NULL;

-- Add a default value for the scheduled_slots column
ALTER TABLE bookings 
ALTER COLUMN scheduled_slots SET DEFAULT '[]'::jsonb;

-- Add a check constraint to ensure scheduled_slots is never null
ALTER TABLE bookings 
ADD CONSTRAINT scheduled_slots_not_null 
CHECK (scheduled_slots IS NOT NULL);

-- Add a check constraint to ensure scheduled_slots is always an array
ALTER TABLE bookings 
ADD CONSTRAINT scheduled_slots_is_array 
CHECK (jsonb_typeof(scheduled_slots) = 'array');

-- Add comments for clarity
COMMENT ON COLUMN bookings.scheduled_slots IS 'Array of scheduled time slots for this booking. Must not be null and must be an array.';
