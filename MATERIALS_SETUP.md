# Session Materials Feature - Setup Guide

## 📁 Feature Overview

The Session Materials feature allows tutors and students to upload and share files for each booking session. Files are stored securely in Supabase Storage with proper access control.

---

## 🚀 Setup Steps

### Step 1: Run Database Migration

1. Open Supabase SQL Editor
2. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/editor
3. Copy and paste: `supabase/migrations/008_session_materials.sql`
4. Execute the migration

**What this does:**
- Creates `session_materials` table
- Sets up RLS policies (only booking participants can access)
- Creates indexes for performance

---

### Step 2: Create Storage Bucket

1. Go to Supabase Storage: https://supabase.com/dashboard/project/YOUR_PROJECT/storage/buckets
2. Click "New bucket"
3. Configure:
   - **Name:** `materials`
   - **Public:** ❌ False (files are private)
   - **File size limit:** 10MB
   - **Allowed MIME types:** 
     - application/pdf
     - application/msword
     - application/vnd.*
     - image/*
     - text/*

4. Click "Create bucket"

---

### Step 3: Set Storage Policies

In the Storage bucket settings for `materials`, add these policies:

**Policy 1: Participants can upload**
```sql
CREATE POLICY "Participants can upload" ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'materials' AND
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM bookings b
    JOIN classes c ON b.class_id = c.id
    JOIN tutors t ON c.tutor_id = t.id
    WHERE b.id::text = (storage.foldername(name))[1]
    AND (b.student_id = auth.uid() OR t.user_id = auth.uid())
  )
);
```

**Policy 2: Participants can view**
```sql
CREATE POLICY "Participants can view" ON storage.objects FOR SELECT
USING (
  bucket_id = 'materials' AND
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM bookings b
    JOIN classes c ON b.class_id = c.id
    JOIN tutors t ON c.tutor_id = t.id
    WHERE b.id::text = (storage.foldername(name))[1]
    AND (b.student_id = auth.uid() OR t.user_id = auth.uid())
  )
);
```

**Policy 3: Uploader can delete**
```sql
CREATE POLICY "Uploader can delete" ON storage.objects FOR DELETE
USING (
  bucket_id = 'materials' AND
  owner = auth.uid()
);
```

---

### Step 4: Restart Development Server

```bash
# Stop current server (Ctrl+C)
npm run dev
```

---

## 🎯 How to Use

### For Tutors:

1. Go to **Bookings** page
2. Click "View Details & Materials" on any booking
3. Click the **Materials** tab
4. Drag and drop files or click to browse
5. Click "Upload File"

### For Students:

1. Go to **My Bookings** page
2. Click "View Details & Materials" on any booking
3. Click the **Materials** tab
4. Upload files (homework, questions, etc.)
5. Download materials shared by tutor

---

## 📝 Features

### Upload
- ✅ Drag and drop interface
- ✅ File validation (type and size)
- ✅ Progress indicator
- ✅ Support for PDF, Word, Excel, PowerPoint, Images
- ✅ Max 10MB per file

### View/Download
- ✅ List all materials for a booking
- ✅ File icons by type
- ✅ File size display
- ✅ Uploader name
- ✅ Upload date
- ✅ One-click download

### Delete
- ✅ Only uploader can delete their own files
- ✅ Confirmation dialog
- ✅ Removes from both database and storage

### Security
- ✅ RLS policies protect access
- ✅ Only booking participants can view/upload
- ✅ Files stored privately (not publicly accessible)
- ✅ Automatic file scanning (Supabase feature)

---

## 🗂️ File Structure

```
materials/
  {booking-id-1}/
    1234567890_homework.pdf
    1234567891_notes.docx
  {booking-id-2}/
    1234567892_quiz.pdf
```

Each booking has its own folder, files are prefixed with timestamp to avoid naming conflicts.

---

## 🧪 Testing Checklist

- [ ] Migration executed successfully
- [ ] Storage bucket created
- [ ] Storage policies added
- [ ] Can access booking detail page
- [ ] Materials tab loads
- [ ] Can upload a PDF file
- [ ] File appears in list
- [ ] Can download the file
- [ ] Can delete own file
- [ ] Cannot delete other's file
- [ ] File size validation works (try >10MB)
- [ ] File type validation works (try .exe)

---

## 🐛 Troubleshooting

### Issue: "Failed to upload file"

**Check:**
1. Storage bucket `materials` exists
2. Storage policies are set
3. You're authenticated
4. You're a participant in the booking
5. File size < 10MB
6. File type is allowed

**Solution:**
- Verify storage bucket settings
- Check browser console for errors
- Ensure RLS policies are correct

---

### Issue: "Cannot view materials"

**Check:**
1. Database migration ran
2. You're logged in
3. You're either the tutor or student for this booking

**Solution:**
- Run migration
- Check booking participants
- Verify RLS policies

---

### Issue: "Download doesn't work"

**Check:**
1. Browser popup blocker
2. File still exists in storage
3. You have permission to view

**Solution:**
- Allow popups for localhost
- Check Supabase Storage browser
- Verify storage SELECT policy

---

## 📊 Database Schema

```sql
CREATE TABLE session_materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES profiles(id),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## ✅ Success Criteria

Session Materials feature is working when:
- ✅ Tutors can upload files to bookings
- ✅ Students can upload files to bookings
- ✅ Both can view all materials for a booking
- ✅ Files are downloadable
- ✅ Uploaders can delete their own files
- ✅ File validation works
- ✅ RLS prevents unauthorized access
- ✅ Mobile responsive

---

**Ready to test!** Follow the setup steps above and use the testing checklist. 🎉

