-- Simple test to diagnose the issue
-- Run this in Supabase SQL Editor to see what's happening

-- Step 1: Check if tables exist
SELECT 'Tables Check:' as step;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Step 2: Check if trigger exists
SELECT 'Trigger Check:' as step;
SELECT tgname, tgenabled 
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- Step 3: Check if function exists
SELECT 'Function Check:' as step;
SELECT proname 
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- Step 4: Test the function manually (simulating what happens on signup)
SELECT 'Manual Test:' as step;
DO $$
DECLARE
  test_id UUID := gen_random_uuid();
BEGIN
  -- Simulate inserting into profiles like the trigger does
  INSERT INTO public.profiles (id, email, first_name, last_name, role)
  VALUES (
    test_id,
    'test-' || test_id::text || '@example.com',
    'Test',
    'User',
    'student'
  );
  
  -- Clean up
  DELETE FROM public.profiles WHERE id = test_id;
  
  RAISE NOTICE 'Manual test successful!';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error: %', SQLERRM;
END $$;

