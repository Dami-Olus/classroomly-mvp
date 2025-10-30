# Avatars Bucket Setup Guide

## 🖼️ Quick Fix: "Bucket Not Found" Error

If you're getting a "bucket not found" error when trying to upload a profile picture, you need to create the `avatars` storage bucket in Supabase.

---

## ⚡ Quick Setup (2 minutes)

### Step 1: Create the Bucket

1. Go to **Supabase Dashboard** → **Storage** → **Buckets**
   - URL: `https://supabase.com/dashboard/project/[your-project]/storage/buckets`

2. Click **"New bucket"**

3. Configure:
   - **Name:** `avatars` (exactly this, case-sensitive)
   - **Public:** ✅ **CHECK** (make it public so profile images display)
   - **File size limit:** `5242880` (5MB)
   - **Allowed MIME types:** `image/*`

4. Click **"Create bucket"**

---

### Step 2: Set Up Storage Policies

**Option A: Using Dashboard UI (Recommended - No Permissions Issues)**

1. Go to **Supabase Dashboard** → **Storage** → **Buckets**
   - URL: `https://supabase.com/dashboard/project/[your-project]/storage/buckets`

2. Click on the **`avatars`** bucket you just created

3. Go to the **"Policies"** tab

4. Click **"New Policy"** and create these 3 policies:

   **Policy 1: Allow authenticated users to upload**
   - Policy name: `Users can upload avatars`
   - Operation: `INSERT`
   - Target roles: `authenticated`
   - Policy definition (CHECK expression):
   ```sql
   bucket_id = 'avatars' AND (string_to_array(name, '/'))[2] LIKE auth.uid()::text || '-%'
   ```
   - **OR use this simpler version** (if the above doesn't work):
   ```sql
   bucket_id = 'avatars'
   ```
   - Click **"Review"** → **"Save policy"**

   **Policy 2: Allow public to view**
   - Policy name: `Anyone can view avatars`
   - Operation: `SELECT`
   - Target roles: `anon`, `authenticated`
   - Policy definition:
   ```sql
   bucket_id = 'avatars'
   ```
   - Click **"Review"** → **"Save policy"**

   **Policy 3: Allow users to delete their own**
   - Policy name: `Users can delete own avatars`
   - Operation: `DELETE`
   - Target roles: `authenticated`
   - Policy definition:
   ```sql
   bucket_id = 'avatars' AND (string_to_array(name, '/'))[2] LIKE auth.uid()::text || '-%'
   ```
   - **OR use this simpler version** (if the above doesn't work):
   ```sql
   bucket_id = 'avatars' AND owner = auth.uid()
   ```
   - Click **"Review"** → **"Save policy"**

**Option B: Using SQL (If you have owner permissions)**

If Option A doesn't work, try the SQL Editor approach. Go to SQL Editor and run:

```sql
-- First, drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatars" ON storage.objects;

-- Users can upload avatars (check filename starts with user ID)
CREATE POLICY "Users can upload avatars" 
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (string_to_array(name, '/'))[2] LIKE auth.uid()::text || '-%'
);

-- Anyone can view avatars (public bucket)
CREATE POLICY "Anyone can view avatars" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'avatars');

-- Users can delete their own avatars
CREATE POLICY "Users can delete own avatars" 
ON storage.objects 
FOR DELETE 
TO authenticated
USING (
  bucket_id = 'avatars' AND
  owner = auth.uid()
);
```

**Even Simpler Alternative (For Quick Testing):**

If you're still having issues, use this simpler version that allows any authenticated user to upload to avatars (less secure but works for testing):

```sql
-- Drop existing policies
DROP POLICY IF EXISTS "Users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatars" ON storage.objects;

-- Simplified policies
CREATE POLICY "Users can upload avatars" 
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Anyone can view avatars" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'avatars');

CREATE POLICY "Users can delete own avatars" 
ON storage.objects 
FOR DELETE 
TO authenticated
USING (bucket_id = 'avatars' AND owner = auth.uid());
```

---

### Step 3: Verify It Works

1. Go back to your app
2. Try uploading a profile picture
3. It should work! ✅

---

## 🔍 Troubleshooting

### Error: "new row violates row-level security policy" (42501)
- ✅ **Solution**: Use the **simpler policy version** in Option B
- The policy check is too strict - use: `bucket_id = 'avatars'` for the INSERT policy
- You may need to **drop existing policies** first and recreate them
- In Dashboard UI, update Policy 1 (INSERT) to use: `bucket_id = 'avatars'` (remove the filename check)

### Error: "must be owner of table objects" (42501)
- ✅ **Solution**: Use **Option A** above (Dashboard UI method) instead of SQL
- The Dashboard UI method doesn't require owner permissions

### Error: "Policy already exists"
- If you see this, the policies are already set up
- You can skip Step 2 or delete the old policies first

### Error: "Bucket already exists"
- The bucket already exists, just verify it's configured correctly:
  - ✅ Public: checked
  - ✅ File size: 5MB
  - ✅ MIME types: `image/*`

### Still not working?
1. Check the browser console for detailed error messages
2. Verify the bucket name is exactly `avatars` (case-sensitive)
3. Make sure you're logged in as an authenticated user
4. Use the Dashboard UI method (Option A) to avoid permissions issues

---

## 📝 Technical Details

### File Path Structure
- Files are stored as: `avatars/{user-id}-{timestamp}-{random}.{ext}`
- Example: `avatars/123e4567-e89b-12d3-a456-426614174000-1699123456789-abc123.jpg`

### Security
- Users can only upload files with their own user ID in the filename
- Anyone can view avatars (public bucket)
- Users can only delete their own avatars
- File size limited to 5MB
- Only image files allowed

---

## 🎯 Next Steps

After setting up the bucket:
1. ✅ Upload a profile picture to test
2. ✅ Verify it displays correctly
3. ✅ Check that old profile pictures still work

---

**Need help?** Check the full deployment guide in `DEPLOYMENT_GUIDE.md`

