-- Fix tutor profile creation issue
-- This migration updates the handle_new_user function to create tutors record when role is tutor

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create updated function that also creates tutors record for tutors
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_first_name TEXT;
  v_last_name TEXT;
  v_role_text TEXT;
  v_profile_id UUID;
BEGIN
  -- Extract values with defaults
  v_first_name := COALESCE(NEW.raw_user_meta_data->>'first_name', 'User');
  v_last_name := COALESCE(NEW.raw_user_meta_data->>'last_name', 'Name');
  v_role_text := COALESCE(NEW.raw_user_meta_data->>'role', 'student');

  -- Log for debugging
  RAISE NOTICE 'Creating profile for user % with role %', NEW.email, v_role_text;

  -- Insert into profiles with type casting at insert time
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
    v_role_text::public.user_role  -- Cast to user_role at insert time
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role
  RETURNING id INTO v_profile_id;

  -- If role is tutor, also create tutors record
  IF v_role_text = 'tutor' THEN
    INSERT INTO public.tutors (
      user_id,
      expertise,
      is_active
    )
    VALUES (
      v_profile_id,
      '{}',  -- Empty array for expertise
      true   -- Active by default
    )
    ON CONFLICT (user_id) DO NOTHING;  -- Don't update if already exists
  END IF;

  RETURN NEW;

EXCEPTION
  WHEN OTHERS THEN
    -- Log error details
    RAISE WARNING 'Error in handle_new_user for %: % - %', NEW.email, SQLSTATE, SQLERRM;
    -- Don't block user creation
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Ensure RLS policies allow the function to work
-- The function runs as SECURITY DEFINER so it bypasses RLS, but let's be explicit about tutors table access

-- Add policy for service role to insert tutors records
DROP POLICY IF EXISTS "Service role can insert tutors" ON tutors;
CREATE POLICY "Service role can insert tutors"
  ON tutors FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Ensure the function has proper permissions
GRANT USAGE ON SCHEMA public TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;
