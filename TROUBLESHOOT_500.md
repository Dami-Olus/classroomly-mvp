# 🔥 Troubleshooting Signup 500 Error

## Current Status
Still getting 500 error after running migration.

## 🎯 Action Plan

### Step 1: Check Supabase Logs (MOST IMPORTANT)

1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/fwhmbobrfpigkmukzhtc
2. Click **"Logs"** in the left sidebar
3. Select **"Postgres Logs"**
4. Try to sign up again on your app
5. **Immediately check the logs** - you'll see the exact error

Look for errors containing:
- `handle_new_user`
- `profiles`
- `INSERT`

**This will tell us EXACTLY what's failing.**

### Step 2: Run Diagnostic Query

In **SQL Editor**, run this:

```sql
-- Run this entire query
SELECT 'Tables Check:' as step;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

SELECT 'Trigger Check:' as step;
SELECT tgname, tgenabled 
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

SELECT 'Function Check:' as step;
SELECT proname 
FROM pg_proc 
WHERE proname = 'handle_new_user';
```

**Expected Results:**
- Tables: Should show 7 tables (profiles, tutors, classes, etc.)
- Trigger: Should show `on_auth_user_created` with `tgenabled = 'O'`
- Function: Should show `handle_new_user`

### Step 3: Test Profile Creation Manually

Run this in SQL Editor:

```sql
-- Test if you can create a profile manually
INSERT INTO profiles (id, email, first_name, last_name, role)
VALUES (
  gen_random_uuid(),
  'manual-test@example.com',
  'Manual',
  'Test',
  'student'
);

-- Check if it worked
SELECT * FROM profiles WHERE email = 'manual-test@example.com';

-- Clean up
DELETE FROM profiles WHERE email = 'manual-test@example.com';
```

**If this fails**, the issue is with the profiles table or RLS policies.

### Step 4: Check RLS Policies

RLS might be blocking the trigger. Run this:

```sql
-- Check RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'profiles';

-- Temporarily disable RLS to test
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Now try signup again in your app

-- If it works, re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
```

### Step 5: Check Auth User Metadata Structure

The trigger expects specific metadata. Run this to see what Supabase is sending:

```sql
-- Check existing auth users (if any)
SELECT 
  id, 
  email, 
  raw_user_meta_data,
  created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;
```

Look at the `raw_user_meta_data` field - it should have `first_name`, `last_name`, and `role`.

### Step 6: Simplified Trigger (If All Else Fails)

If the trigger is still failing, use this simplified version:

```sql
-- Drop existing
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create simplified version with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert with default values if metadata is missing
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
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', 'Name'),
    CASE 
      WHEN (NEW.raw_user_meta_data->>'role') = 'tutor' THEN 'tutor'::user_role
      WHEN (NEW.raw_user_meta_data->>'role') = 'student' THEN 'student'::user_role
      ELSE 'student'::user_role
    END
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail signup
  RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

This version:
- Has default values if metadata is missing
- Uses explicit CASE for role conversion
- Has error handling (won't fail signup, just logs warning)

## 🔍 Common Issues & Solutions

### Issue 1: Profiles Table Doesn't Exist
**Check:** Run `SELECT * FROM profiles LIMIT 1;`
**Fix:** Re-run the migration

### Issue 2: RLS Blocking Insert
**Check:** Run Step 4 above
**Fix:** Temporarily disable RLS or adjust policies

### Issue 3: Type Casting Error
**Error:** `cannot cast type text to type user_role`
**Fix:** Use the simplified trigger in Step 6

### Issue 4: Missing Metadata
**Error:** Null value in first_name or last_name
**Fix:** Simplified trigger provides defaults

### Issue 5: Permission Issues
**Error:** `permission denied for table profiles`
**Fix:** Run this:
```sql
-- Grant necessary permissions
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
```

## ⚡ Quick Fix to Test

If you want to quickly test signup without fixing the trigger:

1. **Disable RLS temporarily:**
```sql
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
```

2. **Use simplified trigger** (Step 6 above)

3. **Try signup**

4. **Re-enable RLS:**
```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
```

## 📊 What to Share for Help

If still not working, share:
1. ✅ Output from Step 2 (diagnostic query)
2. ✅ Screenshot of Postgres Logs during signup attempt
3. ✅ Result of manual profile creation (Step 3)
4. ✅ Browser console errors (F12 → Console tab)

---

**Start with Step 1 (Check Logs) - that will tell us exactly what's wrong!** 🚀

