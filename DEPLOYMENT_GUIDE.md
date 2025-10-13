# Classroomly MVP - Production Deployment Guide

## 🚀 Deployment Overview

Deploy to Vercel (frontend/backend) + Supabase (database/storage/auth)

**Estimated Time:** 30-60 minutes
**Cost:** $0 (using free tiers)

---

## 📋 Pre-Deployment Checklist

- [ ] All code committed and pushed to GitHub
- [ ] All migrations tested locally
- [ ] Environment variables documented
- [ ] .env.local file ready (for reference)

---

## 🗄️ Part 1: Production Supabase Setup (15-20 minutes)

### **Step 1: Create Production Project**

1. **Go to Supabase Dashboard**
   - https://supabase.com/dashboard

2. **Create New Project**
   - Click "New Project"
   - **Name:** Classroomly Production
   - **Database Password:** Generate strong password (save it!)
   - **Region:** Choose closest to your users (e.g., US East for North America)
   - Click "Create new project"
   - Wait 2-3 minutes for provisioning

3. **Save Connection Details**
   - Project URL: `https://[project-ref].supabase.co`
   - Anon/Public Key: `eyJ...`
   - Service Role Key: `eyJ...` (keep secret!)

---

### **Step 2: Run All Database Migrations**

1. **Go to SQL Editor**
   - https://supabase.com/dashboard/project/[your-project]/sql

2. **Run migrations in order:**

   **Migration 1: Initial Schema**
   - Copy: `supabase/migrations/001_initial_schema.sql`
   - Paste and Execute
   - ⚠️ If you get "type already exists" errors, use `001_initial_schema_fixed.sql` instead

   **Migration 2: Auth Fix** (skip if no issues)
   - `supabase/migrations/004_absolute_fix.sql`

   **Migration 3: Booking RLS**
   - `supabase/migrations/006_force_public_booking.sql`

   **Migration 4: Global Availability**
   - `supabase/migrations/007_global_tutor_availability.sql`

   **Migration 5: Session Materials**
   - `supabase/migrations/008_session_materials.sql`

   **Migration 6: Rescheduling**
   - `supabase/migrations/009_rescheduling_system.sql`

   **Migration 7: Session Notes**
   - `supabase/migrations/010_session_notes.sql`

3. **Verify tables created:**
   - Go to Table Editor
   - Should see: profiles, tutors, classes, bookings, classrooms, session_materials, session_notes, reschedule_requests

---

### **Step 3: Create Storage Bucket**

1. **Go to Storage**
   - https://supabase.com/dashboard/project/[your-project]/storage/buckets

2. **Create "materials" bucket:**
   - Click "New bucket"
   - Name: `materials`
   - Public: ❌ **UNCHECK** (private)
   - File size limit: `10485760` (10MB)
   - Click "Create bucket"

3. **Add Storage Policies (SQL Editor):**
   ```sql
   -- Enable RLS
   ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

   -- Upload policy
   CREATE POLICY "Participants can upload" 
   ON storage.objects 
   FOR INSERT 
   TO authenticated
   WITH CHECK (bucket_id = 'materials');

   -- View policy
   CREATE POLICY "Participants can view" 
   ON storage.objects 
   FOR SELECT 
   TO authenticated
   USING (bucket_id = 'materials');

   -- Delete policy
   CREATE POLICY "Uploader can delete" 
   ON storage.objects 
   FOR DELETE 
   TO authenticated
   USING (bucket_id = 'materials' AND auth.uid() = owner);
   ```

---

### **Step 4: Configure Email Auth**

1. **Go to Authentication → Providers**
   - https://supabase.com/dashboard/project/[your-project]/auth/providers

2. **Email Provider Settings:**
   - Confirm email required: ✅ **CHECK**
   - Double confirm email: ❌ **UNCHECK** (for MVP)
   - Secure email change: ✅ **CHECK**

3. **Site URL (important!):**
   - Go to: Authentication → URL Configuration
   - Site URL: `https://your-app-name.vercel.app` (we'll update this after Vercel deployment)

---

## ☁️ Part 2: Vercel Deployment (10-15 minutes)

### **Step 1: Connect GitHub Repository**

1. **Go to Vercel**
   - https://vercel.com/login
   - Sign in with GitHub

2. **Import Repository**
   - Click "Add New..." → "Project"
   - Select your GitHub account
   - Find repository: `classroomly-mvp`
   - Click "Import"

---

### **Step 2: Configure Project**

1. **Framework Preset:** Next.js (auto-detected)

2. **Root Directory:** `./` (default)

3. **Build Command:** `npm run build` (default)

4. **Install Command:** `npm install` (default)

---

### **Step 3: Environment Variables** ⚠️ CRITICAL

Click "Environment Variables" and add these:

```bash
# Supabase (from production project)
NEXT_PUBLIC_SUPABASE_URL=https://[your-project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... (anon key from Supabase)
SUPABASE_SERVICE_ROLE_KEY=eyJ... (service role key - keep secret!)

# App URL (will update after first deployment)
NEXT_PUBLIC_APP_URL=https://your-app-name.vercel.app

# Daily.co
DAILY_API_KEY=your_daily_api_key_here

# Resend (Email)
RESEND_API_KEY=your_resend_api_key_here
```

**Where to find Supabase keys:**
- Go to: Project Settings → API
- Copy URL, anon key, and service_role key

---

### **Step 4: Deploy!**

1. Click **"Deploy"**
2. Wait 2-3 minutes for build
3. 🎉 **Deployment successful!**
4. You'll get a URL: `https://classroomly-mvp-xxxxx.vercel.app`

---

### **Step 5: Update Site URL in Supabase**

1. **Copy your Vercel URL**
   - Example: `https://classroomly-mvp-xxxxx.vercel.app`

2. **Update in Supabase:**
   - Go to: Authentication → URL Configuration
   - **Site URL:** Paste your Vercel URL
   - **Redirect URLs:** Add `https://your-vercel-url.app/**`
   - Save

3. **Update Environment Variable in Vercel:**
   - Go to Vercel project → Settings → Environment Variables
   - Edit `NEXT_PUBLIC_APP_URL` to your actual Vercel URL
   - Redeploy (Deployments → three dots → Redeploy)

---

## 🧪 Part 3: Production Testing (15-20 minutes)

### **Test Critical Path:**

1. **Visit your production URL**
   - https://your-app-name.vercel.app

2. **Sign up as Tutor**
   - Create new account
   - Verify email works
   - Redirects to dashboard

3. **Set Availability**
   - Go to Availability
   - Set time ranges
   - Save

4. **Create a Class**
   - Go to Classes → Create
   - Fill in details
   - Copy booking link

5. **Test Booking (Incognito)**
   - Open booking link in incognito/private window
   - Select time slots
   - Book as test student
   - Check email confirmation

6. **Test Video Session**
   - Go back to tutor account
   - Start session
   - Verify Daily.co loads

7. **Test Materials**
   - Upload a file
   - Download it
   - Verify it works

8. **Test Notes**
   - Add session notes
   - Verify they save

✅ **If all works, you're live!**

---

## 🔧 Troubleshooting

### **Build Fails on Vercel**

**Check:**
- Environment variables set correctly
- No TypeScript errors locally
- Dependencies in package.json

**Fix:**
- View build logs in Vercel
- Fix errors locally
- Push and redeploy

---

### **Authentication Not Working**

**Check:**
- Site URL set in Supabase
- Redirect URLs include your domain
- Supabase keys correct in Vercel

**Fix:**
- Update Site URL in Supabase
- Add redirect URLs
- Redeploy

---

### **Database Errors**

**Check:**
- All migrations ran successfully
- Tables exist in Supabase
- RLS policies created

**Fix:**
- Re-run migrations in SQL Editor
- Check for error messages
- Verify table structure

---

### **File Upload Fails**

**Check:**
- Storage bucket "materials" exists
- Storage policies added
- Bucket is private (not public)

**Fix:**
- Create bucket
- Add policies (see Step 3 of Supabase setup)
- Test again

---

### **Email Not Sending**

**Check:**
- Resend API key valid
- Resend domain verified
- API key in Vercel env vars

**Fix:**
- Verify API key
- Check Resend dashboard for errors
- Update env var

---

### **Daily.co Not Working**

**Check:**
- DAILY_API_KEY in Vercel env vars
- API key is valid
- Domain is approved (free tier)

**Fix:**
- Generate new API key from Daily.co
- Update in Vercel
- Redeploy

---

## 🎯 Post-Deployment Tasks

### **Immediate:**
- [ ] Test all critical features in production
- [ ] Fix any production-specific issues
- [ ] Set up error monitoring (Sentry - optional)
- [ ] Set up analytics (Plausible - optional)

### **Within 24 Hours:**
- [ ] Test on mobile devices
- [ ] Test on different browsers
- [ ] Invite beta testers
- [ ] Monitor error logs

### **Within 1 Week:**
- [ ] Gather user feedback
- [ ] Fix reported bugs
- [ ] Add custom domain (optional)
- [ ] Set up production email domain

---

## 🌐 Custom Domain (Optional)

### **If you want your own domain:**

1. **Buy domain** (e.g., classroomly.com from Namecheap)

2. **Add to Vercel:**
   - Vercel → Settings → Domains
   - Add your domain
   - Follow DNS instructions

3. **Update Supabase:**
   - Site URL → your custom domain
   - Update redirect URLs

---

## 📊 Monitoring & Analytics

### **Free Tools to Add:**

**Error Tracking:**
- Sentry (free tier)
- Captures errors automatically
- Email alerts for critical issues

**Analytics:**
- Plausible (privacy-friendly)
- or PostHog (open source)
- Track usage, conversions

**Uptime Monitoring:**
- UptimeRobot (free)
- Alerts if site goes down

---

## ✅ Deployment Checklist

**Before Deploy:**
- [x] Code pushed to GitHub
- [ ] Production Supabase created
- [ ] All migrations run
- [ ] Storage bucket created
- [ ] Storage policies added

**During Deploy:**
- [ ] Vercel project created
- [ ] Environment variables set
- [ ] First deployment successful
- [ ] Site URL updated in Supabase

**After Deploy:**
- [ ] Production testing complete
- [ ] All features working
- [ ] Mobile tested
- [ ] Ready for users!

---

## 🎉 Go Live!

Once deployed and tested, you can:
- ✅ Share with real tutors
- ✅ Get real bookings
- ✅ Conduct real sessions
- ✅ Gather feedback
- ✅ Iterate and improve

---

**Ready to deploy? Let's do it!** 🚀

**I'll guide you through each step. Let me know when you're ready to start with Supabase production setup!**

