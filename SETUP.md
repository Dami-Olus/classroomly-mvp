# Classroomly MVP - Setup Guide

This guide will help you set up the Classroomly project from scratch using Next.js 14 and Supabase.

## Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- A Supabase account ([sign up here](https://supabase.com))
- A video.co account ([sign up here](https://www.video.co)) - for Sprint 4

## Step 1: Clone and Install Dependencies

```bash
cd classroomly_mvp
npm install
```

## Step 2: Set Up Supabase

### 2.1 Create a New Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in your project details:
   - Name: classroomly-mvp
   - Database Password: (choose a strong password)
   - Region: (select closest to you)

### 2.2 Run Database Migrations

1. In your Supabase dashboard, go to the SQL Editor
2. Copy the contents of `supabase/migrations/001_initial_schema.sql`
3. Paste it into the SQL Editor and click "Run"
4. You should see "Success. No rows returned" message

### 2.3 Set Up Storage Bucket for Avatars

1. In Supabase dashboard, go to **Storage**
2. Click "Create a new bucket"
3. Bucket name: `avatars`
4. Make it **Public**
5. Click "Create bucket"

### 2.4 Set Storage Policies

In the SQL Editor, run:

```sql
-- Allow authenticated users to upload their own avatars
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read access to avatars
CREATE POLICY "Avatars are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Allow users to update their own avatars
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own avatars
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

## Step 3: Configure Environment Variables

1. Copy the example environment file:

```bash
cp .env.local.example .env.local
```

2. Get your Supabase credentials:
   - Go to Project Settings > API
   - Copy the Project URL and anon/public key

3. Update `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# video.co Configuration (for Sprint 4)
NEXT_PUBLIC_VIDEO_CO_API_KEY=your-video-co-api-key
VIDEO_CO_SECRET_KEY=your-video-co-secret-key

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Step 4: Configure Email Authentication

### Option 1: Use Supabase Built-in Email (Recommended for Development)

Supabase provides a built-in email service for development:

1. Go to Authentication > Email Templates
2. Customize the templates if needed
3. During development, check the Supabase Auth logs to see confirmation emails

### Option 2: Use Custom SMTP (Production)

1. Go to Authentication > Settings
2. Scroll to "SMTP Settings"
3. Enable custom SMTP
4. Add your SMTP credentials (SendGrid, Mailgun, etc.)

## Step 5: Run the Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your application!

## Step 6: Test the Application

### Test Authentication

1. Go to [http://localhost:3000/signup](http://localhost:3000/signup)
2. Create a tutor account:
   - Select "Tutor"
   - Fill in your details
   - Click "Create Account"
3. You should be redirected to `/tutor/dashboard`

### Test Profile Management

1. Click on "Profile" in the sidebar
2. Update your profile information
3. Upload a profile picture
4. Add expertise, education, and experience
5. Save your changes

### Create a Student Account

1. Logout and create a student account
2. You should see the student dashboard

## Troubleshooting

### Database Connection Issues

- Verify your Supabase URL and anon key are correct
- Check if your Supabase project is active
- Ensure you ran the database migrations

### Authentication Issues

- Clear your browser cookies and local storage
- Check Supabase Auth logs in the dashboard
- Verify RLS policies are set up correctly

### File Upload Issues

- Ensure the `avatars` bucket is created and public
- Check storage policies are set up correctly
- Verify file size is under the limit (10MB default)

## Sprint 1 Completion Checklist

- [x] Next.js 14 project initialized
- [x] Supabase configured with database schema
- [x] Authentication system working (sign up/login)
- [x] User profiles (tutor/student roles)
- [x] Protected routes with role-based access
- [x] Profile editing functionality
- [x] Avatar upload to Supabase Storage
- [x] Mobile-responsive UI
- [x] Error handling and validation

## Next Steps

Sprint 1 is complete! Here's what's coming next:

### Sprint 2: Tutor Profiles & Class Creation (Weeks 3-4)

- Enhanced tutor profile management
- Class creation with availability
- Weekly scheduling system
- Time zone handling
- Duration and frequency options

### Prepare for Sprint 2

1. Review the tutor dashboard functionality
2. Think about your availability management needs
3. Consider what subjects/classes you want to offer
4. Review the booking flow requirements

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [video.co Documentation](https://www.video.co/docs)

## Support

If you encounter any issues:

1. Check the troubleshooting section above
2. Review Supabase dashboard logs
3. Check browser console for errors
4. Verify all environment variables are set

---

**🎉 Congratulations! Sprint 1 is complete!**

