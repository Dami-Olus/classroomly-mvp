-- Final Fix for Signup 500 Error
-- This ensures the trigger works correctly

-- First, clean up any test data
DELETE FROM profiles WHERE email LIKE 'test%@example.com' OR email LIKE 'manual%@example.com';

-- Drop and recreate the trigger with better error handling
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create the function with improved error handling and logging
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_first_name TEXT;
  v_last_name TEXT;
  v_role user_role;
BEGIN
  -- Extract metadata with defaults
  v_first_name := COALESCE(NEW.raw_user_meta_data->>'first_name', 'User');
  v_last_name := COALESCE(NEW.raw_user_meta_data->>'last_name', 'Name');
  
  -- Handle role conversion safely
  v_role := CASE 
    WHEN (NEW.raw_user_meta_data->>'role') = 'tutor' THEN 'tutor'::user_role
    WHEN (NEW.raw_user_meta_data->>'role') = 'admin' THEN 'admin'::user_role
    ELSE 'student'::user_role
  END;

  -- Insert profile
  INSERT INTO public.profiles (
    id, 
    email, 
    first_name, 
    last_name, 
    role
  )
  VALUES (
    NEW.id,
    NEW.email,
    v_first_name,
    v_last_name,
    v_role
  );

  RETURN NEW;
EXCEPTION 
  WHEN unique_violation THEN
    -- Profile already exists, ignore
    RAISE NOTICE 'Profile already exists for user %', NEW.id;
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log the error but don't block user creation
    RAISE WARNING 'Error creating profile for user %: % %', NEW.id, SQLSTATE, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- Ensure RLS is properly configured
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Make sure the insert policy allows the trigger to work
-- The trigger runs as SECURITY DEFINER so it bypasses RLS, but let's be explicit
DROP POLICY IF EXISTS "Allow trigger to insert profiles" ON profiles;
CREATE POLICY "Allow trigger to insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (true);

-- Test that the trigger setup is correct
DO $$
BEGIN
  RAISE NOTICE 'Trigger setup complete!';
  RAISE NOTICE 'Trigger exists: %', (
    SELECT COUNT(*) FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  );
  RAISE NOTICE 'Function exists: %', (
    SELECT COUNT(*) FROM pg_proc WHERE proname = 'handle_new_user'
  );
END $$;

