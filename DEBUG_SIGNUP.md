# 🐛 Debugging Signup 500 Error

## Error Details
```
POST https://fwhmbobrfpigkmukzhtc.supabase.co/auth/v1/signup 500 (Internal Server Error)
```

## Root Cause
The database trigger that creates user profiles after signup is failing.

## ✅ Solution Steps

### Step 1: Check if Migration Was Run

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor**
4. Run this query to check if tables exist:

```sql
-- Check if profiles table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'tutors', 'classes', 'bookings', 'classrooms', 'messages', 'materials');
```

**Expected Result:** Should return 7 rows (all table names)

**If it returns 0 rows:** The migration wasn't run. Go to Step 2.

### Step 2: Run the Database Migration

1. In Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy the **ENTIRE** contents of `supabase/migrations/001_initial_schema.sql`
4. Paste into the editor
5. Click **RUN** (bottom right)
6. Wait for "Success. No rows returned" message

### Step 3: Verify the Trigger Exists

Run this in SQL Editor:

```sql
-- Check if trigger function exists
SELECT proname 
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- Check if trigger exists
SELECT tgname 
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';
```

**Expected:** Both should return 1 row each.

### Step 4: Test Manual Profile Creation

Try creating a profile manually to test:

```sql
-- Test if you can insert into profiles
INSERT INTO profiles (id, email, first_name, last_name, role)
VALUES (
  gen_random_uuid(),
  'test@example.com',
  'Test',
  'User',
  'student'
);

-- Check if it worked
SELECT * FROM profiles WHERE email = 'test@example.com';

-- Clean up test data
DELETE FROM profiles WHERE email = 'test@example.com';
```

### Step 5: Check Supabase Auth Logs

1. In Supabase dashboard, go to **Logs** → **Auth Logs**
2. Look for the failed signup attempt
3. Check the error message details

### Step 6: Re-create the Trigger (If Needed)

If the trigger is missing or broken, run this:

```sql
-- Drop existing trigger and function (if any)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Recreate the function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### Step 7: Try Signup Again

1. Clear browser cache and cookies
2. Refresh the app at http://localhost:3001
3. Try signing up again

## 🎯 Quick Fix (If Migration Not Run)

If you haven't run the migration yet, here's the fastest way:

1. **Open Supabase Dashboard** → Your Project → **SQL Editor**
2. **Copy this file**: `supabase/migrations/001_initial_schema.sql`
3. **Paste and Run** in SQL Editor
4. **Wait** for "Success" message
5. **Try signup again**

## 🔍 Alternative: Check Supabase Logs

You can see the exact error by checking Supabase logs:

1. Go to **Logs** in Supabase dashboard
2. Select **Postgres Logs**
3. Look for errors around the time you tried to sign up
4. The error will tell you exactly what's failing

## ⚠️ Common Issues

### Issue 1: Enum Type Doesn't Exist
**Error:** `type "user_role" does not exist`

**Fix:** Run the CREATE TYPE commands first:
```sql
CREATE TYPE user_role AS ENUM ('tutor', 'student', 'admin');
```

### Issue 2: Function Already Exists
**Error:** `function "handle_new_user" already exists`

**Fix:** Drop and recreate:
```sql
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
-- Then run the CREATE FUNCTION again
```

### Issue 3: RLS Blocking Insert
**Error:** `new row violates row-level security policy`

**Fix:** Temporarily disable RLS to test:
```sql
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
-- Try signup
-- Then re-enable:
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
```

## ✅ Success Checklist

After fixing, you should be able to:
- [ ] Sign up without 500 error
- [ ] See "Welcome to Classroomly!" success message
- [ ] Get redirected to dashboard
- [ ] See your name in the dashboard
- [ ] View your profile

## 🆘 Still Not Working?

If you still get the error after running the migration:

1. **Share the Supabase error logs** from the dashboard
2. **Check browser console** for more details
3. **Verify your Supabase URL and key** in `.env.local`
4. **Make sure the project isn't paused** (Supabase pauses inactive projects)

---

**Most Likely Fix:** Run the migration file in Supabase SQL Editor! 🚀

