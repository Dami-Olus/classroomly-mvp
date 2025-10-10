# 🚀 Classroomly MVP - Quick Start Guide

Get up and running with Classroomly in 10 minutes!

## Sprint 1 Status: ✅ COMPLETE

All authentication and user management features are ready to use.

## 🏃‍♂️ Quick Setup (3 Steps)

### 1. Install Dependencies

```bash
cd classroomly_mvp
npm install
```

### 2. Set Up Supabase

**Create Project:**
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the database to be ready (~2 minutes)

**Run Database Migration:**
1. In Supabase dashboard, go to **SQL Editor**
2. Copy & paste contents from `supabase/migrations/001_initial_schema.sql`
3. Click **Run** ✅

**Create Storage Bucket:**
1. Go to **Storage** in Supabase dashboard
2. Click "New bucket" → Name it `avatars` → Make it **Public**
3. Run this SQL to set storage policies:

```sql
CREATE POLICY "Users can upload own avatar" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Avatars are publicly accessible" ON storage.objects FOR SELECT TO public USING (bucket_id = 'avatars');
CREATE POLICY "Users can update own avatar" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own avatar" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### 3. Configure Environment Variables

```bash
cp .env.local.example .env.local
```

Update `.env.local` with your Supabase credentials:
- Go to **Project Settings** → **API**
- Copy the **Project URL** and **anon public key**

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 🎯 Start the App

```bash
npm run dev
```

Visit **http://localhost:3000** 🎉

## 🧪 Test Sprint 1 Features

### Test 1: Create Tutor Account
1. Go to `/signup`
2. Select **"Tutor"**
3. Fill in details and create account
4. ✅ Should redirect to `/tutor/dashboard`

### Test 2: Update Tutor Profile
1. Click **"Profile"** in sidebar
2. Upload a profile picture
3. Add bio, expertise, education, experience
4. Set hourly rate
5. Click **"Save Profile"**
6. ✅ Should see success toast

### Test 3: Create Student Account
1. Logout
2. Go to `/signup`
3. Select **"Student"**
4. Create account
5. ✅ Should redirect to `/student/dashboard`

### Test 4: Mobile Responsiveness
1. Open browser dev tools
2. Toggle device toolbar
3. Test on iPhone and iPad views
4. ✅ Everything should be responsive

## ✅ Sprint 1 Features Available

- **Authentication**
  - Sign up with role selection
  - Login with email/password
  - Logout
  
- **User Profiles**
  - Tutor profile with professional info
  - Student profile with basic info
  - Avatar upload
  - Profile editing
  
- **Dashboards**
  - Role-based dashboards
  - Protected routes
  - Sidebar navigation

## 🎓 Sprint 1 Complete Checklist

- [x] Authentication system working
- [x] User profiles (tutor/student)
- [x] Protected routes
- [x] Profile editing
- [x] Avatar upload
- [x] Mobile responsive
- [x] Error handling
- [x] Toast notifications

## 🔜 Coming in Sprint 2

**Tutor Profiles & Class Creation (Weeks 3-4)**

Features to build:
- [ ] Enhanced tutor profiles
- [ ] Class creation form
- [ ] Availability calendar
- [ ] Time zone handling
- [ ] Weekly scheduling system

## 📚 Documentation

- Full setup guide: `SETUP.md`
- Sprint 1 summary: `SPRINT1_SUMMARY.md`
- Main readme: `README.md`

## 🆘 Troubleshooting

### Can't login?
- Check Supabase credentials in `.env.local`
- Clear browser cookies and try again
- Check Supabase Auth logs in dashboard

### Avatar upload fails?
- Ensure `avatars` bucket exists and is public
- Verify storage policies are set
- Check file size (< 10MB)

### Database errors?
- Confirm migration ran successfully
- Check RLS policies in Supabase dashboard
- Verify all tables were created

## 🎉 Success!

If you can sign up, login, and edit your profile, **Sprint 1 is working perfectly!**

---

**Ready for Sprint 2?** Let's build the class creation system next! 🚀

---

*Project: Classroomly MVP | Sprint 1 Complete*

