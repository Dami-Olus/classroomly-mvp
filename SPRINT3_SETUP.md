# Sprint 3: Email Notifications & Enhancements - Setup Guide

## 🎯 Sprint 3 Overview

**Goal**: Add email notifications, calendar integration, and booking enhancements

**Features**:
- ✅ Email notifications (booking confirmations)
- ✅ Beautiful HTML email templates
- ✅ Calendar export (.ics files)
- ✅ Booking conflict detection API
- 🔄 Session reminders (requires cron job - future)

## 📦 New Dependencies Added

```bash
npm install resend ics @react-email/render @react-email/components
```

These provide:
- `resend` - Modern email API
- `ics` - Generate calendar files
- `@react-email` - React-based email templates

## 🔧 Environment Variables

Add these to your `.env.local`:

```env
# Email Configuration (Resend)
RESEND_API_KEY=re_your-api-key-here
FROM_EMAIL=noreply@yourdomain.com

# Or for testing (Resend provides a test domain)
FROM_EMAIL=onboarding@resend.dev
```

## 🚀 Resend Setup (5 minutes)

### Step 1: Create Resend Account
1. Go to https://resend.com
2. Sign up (free tier: 100 emails/day)
3. Verify your email

### Step 2: Get API Key
1. Go to **API Keys** in dashboard
2. Click "Create API Key"
3. Name it "Classroomly Dev"
4. Copy the key (starts with `re_`)

### Step 3: Add to Environment
1. Open `.env.local`
2. Add:
   ```env
   RESEND_API_KEY=re_your_actual_key_here
   FROM_EMAIL=onboarding@resend.dev
   ```

### Step 4: Restart Dev Server
```bash
# Stop current server (Ctrl+C)
npm run dev
```

## 📧 Email Features

### 1. Booking Confirmation (Student)
**When**: Student completes booking  
**To**: Student email  
**Contains**:
- Booking confirmation
- Class details
- Scheduled sessions
- What's next steps
- Link to dashboard

### 2. Booking Notification (Tutor)
**When**: New booking created  
**To**: Tutor email  
**Contains**:
- New booking alert
- Student information
- Scheduled sessions
- Student notes (if any)
- Link to bookings dashboard

### 3. Session Reminder (Future)
**When**: 30 min before session  
**To**: Both student and tutor  
**Contains**:
- Session details
- Classroom link
- Join button

## 📅 Calendar Export

Students can download `.ics` files to add sessions to:
- Google Calendar
- Apple Calendar
- Outlook
- Any calendar app

**Location**: Student bookings page → "Add to Calendar" button

## 🔍 Conflict Detection API

**Endpoint**: `/api/check-conflicts`

**Purpose**: Prevent double-booking the same time slot

**Usage**:
```typescript
const response = await fetch('/api/check-conflicts', {
  method: 'POST',
  body: JSON.stringify({
    classId: 'class-uuid',
    selectedSlots: [{ day: 'Monday', time: '14:00' }]
  })
})

const { hasConflicts, conflicts } = await response.json()
```

## 🧪 Testing Email (Development)

### Option 1: Use Resend (Recommended)
1. Set up Resend account (see above)
2. Book a session
3. Check your email inbox
4. See beautiful HTML emails!

### Option 2: Console Logging (Fallback)
If `RESEND_API_KEY` is not set:
- Emails won't send
- But booking still works
- Check server console for email data

## 📁 New Files Created

### Email System:
- `lib/email/resend.ts` - Resend client
- `lib/email/templates.tsx` - Email components
- `app/api/send-booking-confirmation/route.ts` - API route

### Calendar:
- `lib/calendar.ts` - ICS file generation
- `components/AddToCalendarButton.tsx` - Download button

### Utilities:
- `app/api/check-conflicts/route.ts` - Conflict detection

## ✅ What Works Now

### For Students (Logged In):
1. Book a session
2. ✅ Receive confirmation email
3. ✅ Download calendar file
4. ✅ Add sessions to Google Calendar/etc.

### For Tutors:
1. Get notified of new bookings
2. ✅ Receive email with student details
3. ✅ Link to view booking in dashboard

## 🎯 Success Metrics

- ✅ Emails send within 5 seconds of booking
- ✅ Email templates are mobile-responsive
- ✅ Calendar files work in all major calendar apps
- ✅ Conflict detection prevents double-booking

## 🔜 Future Enhancements (Post-Sprint 3)

### Session Reminders:
Need to set up a cron job or edge function to send reminders 30 min before sessions.

**Options**:
1. Vercel Cron Jobs (Hobby plan: daily, Pro: custom)
2. Supabase Edge Functions with cron
3. External service (EasyCron, cron-job.org)

### Anonymous Booking Fix:
Revisit RLS policies to allow truly anonymous bookings.

## 🚀 Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up Resend**:
   - Get API key from resend.com
   - Add to `.env.local`

3. **Restart server**:
   ```bash
   npm run dev
   ```

4. **Test booking** (as logged-in student):
   - Book a session
   - Check your email
   - Click "Add to Calendar"
   - Import to your calendar app

---

## 📊 Sprint 3 Progress

- ✅ Email service configured
- ✅ Email templates created
- ✅ Booking emails integrated
- ✅ Calendar export working
- ✅ Conflict detection API ready
- 🔄 Session reminders (requires cron - future)

---

**Sprint 3 Core Features Complete!** 🎉

*Next: Sprint 4 - Virtual Classroom with video.co*

