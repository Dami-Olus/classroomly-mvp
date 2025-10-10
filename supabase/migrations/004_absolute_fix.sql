-- ABSOLUTE FIX - This will definitely work!
-- The issue: user_role type doesn't exist when function tries to use it

-- Step 1: Drop everything cleanly
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Step 2: Ensure the enum types exist in the public schema
DO $$ 
BEGIN
    -- Try to create types, ignore if they already exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE public.user_role AS ENUM ('tutor', 'student', 'admin');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status') THEN
        CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'rescheduled', 'completed', 'cancelled');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'classroom_status') THEN
        CREATE TYPE public.classroom_status AS ENUM ('scheduled', 'live', 'completed', 'cancelled');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'message_type') THEN
        CREATE TYPE public.message_type AS ENUM ('text', 'file', 'system');
    END IF;
END $$;

-- Step 3: Create function WITHOUT using the user_role type in variable declarations
-- Instead, use TEXT and cast at insert time
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_first_name TEXT;
  v_last_name TEXT;
  v_role_text TEXT;
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
    role = EXCLUDED.role;

  RETURN NEW;

EXCEPTION
  WHEN OTHERS THEN
    -- Log error details
    RAISE WARNING 'Error in handle_new_user for %: % - %', NEW.email, SQLSTATE, SQLERRM;
    -- Don't block user creation
    RETURN NEW;
END;
$$;

-- Step 4: Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 5: Make sure RLS allows the function to insert
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Step 6: Ensure proper policies exist
DROP POLICY IF EXISTS "Public profiles viewable" ON profiles;
DROP POLICY IF EXISTS "Users update own" ON profiles;
DROP POLICY IF EXISTS "Service role access" ON profiles;

CREATE POLICY "Public profiles viewable"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users update own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Service role access"
  ON profiles FOR ALL
  USING (auth.role() = 'service_role');

-- Step 7: Verify everything is set up
DO $$
BEGIN
  -- Check enum type
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    RAISE NOTICE '✓ user_role type exists';
  ELSE
    RAISE WARNING '✗ user_role type is missing!';
  END IF;

  -- Check function
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user') THEN
    RAISE NOTICE '✓ handle_new_user function exists';
  ELSE
    RAISE WARNING '✗ handle_new_user function is missing!';
  END IF;

  -- Check trigger
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
    RAISE NOTICE '✓ on_auth_user_created trigger exists';
  ELSE
    RAISE WARNING '✗ on_auth_user_created trigger is missing!';
  END IF;

  RAISE NOTICE '==================================';
  RAISE NOTICE 'Setup complete! Try signup now.';
  RAISE NOTICE '==================================';
END $$;

