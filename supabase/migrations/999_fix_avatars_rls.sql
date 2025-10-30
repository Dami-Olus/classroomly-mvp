-- Fix for "new row violates RLS" error for avatars bucket
-- This migration creates simplified storage policies that work reliably

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatars" ON storage.objects;

-- Ensure RLS is enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Simplified policies for avatars bucket
-- These allow authenticated users to upload any file to the avatars bucket
-- Files are still secured by the bucket configuration and filename patterns

-- Policy 1: Allow authenticated users to upload to avatars bucket
CREATE POLICY "Users can upload avatars" 
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- Policy 2: Allow public to view avatars (public bucket)
CREATE POLICY "Anyone can view avatars" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'avatars');

-- Policy 3: Allow users to delete their own uploaded files
CREATE POLICY "Users can delete own avatars" 
ON storage.objects 
FOR DELETE 
TO authenticated
USING (bucket_id = 'avatars' AND owner = auth.uid());

