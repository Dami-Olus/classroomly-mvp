# 📊 Analytics Setup - Final Steps

## ✅ What's Already Done

I've completed the following setup:

1. ✅ Installed PostHog and Sentry packages
2. ✅ Created PostHog provider (`lib/analytics/posthog.tsx`)
3. ✅ Created Analytics wrapper (`lib/analytics/index.ts`)
4. ✅ Created useAnalytics hook (`hooks/useAnalytics.ts`)
5. ✅ Created error handler (`lib/errors/errorHandler.ts`)
6. ✅ Created Sentry config files
7. ✅ Updated `next.config.js` with Sentry
8. ✅ Updated `app/layout.tsx` with PostHog provider
9. ✅ Created `env.example` with all required variables

---

## 🔐 Step 1: Add Your API Keys to `.env.local`

You need to add these environment variables to your `.env.local` file:

### **PostHog Keys:**

1. Go to: https://app.posthog.com/project/settings
2. Copy your **Project API Key**
3. Add to `.env.local`:

```bash
NEXT_PUBLIC_POSTHOG_KEY=phc_your_actual_key_here
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

### **Sentry Keys:**

1. Go to: https://sentry.io/settings/
2. Select your project
3. Go to "Client Keys (DSN)"
4. Copy your **DSN**
5. Add to `.env.local`:

```bash
NEXT_PUBLIC_SENTRY_DSN=https://your-actual-dsn@sentry.io/project-id
```

Optional (for source map uploads):
```bash
SENTRY_ORG=your-org-name
SENTRY_PROJECT=your-project-name
SENTRY_AUTH_TOKEN=your-auth-token
```

---

## 🧪 Step 2: Test the Setup

### **Test PostHog:**

Run your app:
```bash
npm run dev
```

1. Open http://localhost:3000
2. Navigate to a few pages
3. Open browser console - you should see PostHog debug messages
4. Go to https://app.posthog.com/events
5. You should see `$pageview` events!

### **Test Sentry:**

Create a test error button anywhere in your app:

```typescript
<button onClick={() => {
  throw new Error('Test Sentry - This is a test error!')
}}>
  Test Error Tracking
</button>
```

1. Click the button
2. Go to https://sentry.io
3. Check "Issues" - you should see the error!

---

## 📊 Step 3: Start Tracking Events

### **Example: Track User Signup**

In `app/(auth)/signup/page.tsx`:

```typescript
'use client'
import { useAnalytics } from '@/hooks/useAnalytics'

export default function SignupPage() {
  const analytics = useAnalytics()
  
  const handleSignup = async (data: SignupData) => {
    try {
      // ... your signup logic
      
      // Track the event
      analytics.trackSignup(data.role)
      
      toast.success('Account created!')
    } catch (error) {
      // This will automatically send to Sentry
      handleError(error as Error, {
        action: 'signup',
        role: data.role
      })
    }
  }
  
  return (
    // ... your form
  )
}
```

### **Example: Track Class Creation**

In `app/(dashboard)/tutor/classes/create/page.tsx`:

```typescript
import { useAnalytics } from '@/hooks/useAnalytics'

const analytics = useAnalytics()

const handleCreateClass = async (classData: ClassData) => {
  try {
    // ... create class logic
    
    analytics.trackClassCreated({
      subject: classData.subject,
      duration: classData.duration,
      price: classData.price
    })
    
    toast.success('Class created!')
  } catch (error) {
    handleError(error as Error, {
      action: 'create_class',
      data: classData
    })
  }
}
```

---

## 🎯 Available Tracking Methods

The `useAnalytics` hook provides these methods:

```typescript
const analytics = useAnalytics()

// User events
analytics.trackSignup('tutor')
analytics.trackProfileComplete()

// Tutor events
analytics.trackClassCreated({ subject: 'Math', duration: 60, price: 50 })
analytics.trackBookingLinkShared('whatsapp')

// Student events
analytics.trackBookingStarted(classId)
analytics.trackBookingCompleted({ class_id: classId, session_count: 5 })

// Session events
analytics.trackSessionStarted(sessionId)
analytics.trackSessionCompleted(sessionId, 3600)

// Feature usage
analytics.trackMaterialUploaded('pdf', 1024000)
analytics.trackNoteAdded('session')
analytics.trackRescheduleRequested(sessionId)
analytics.trackImportSessions(20)
analytics.trackReportGenerated('monthly')
```

---

## 🚨 Error Tracking

Use the error handler everywhere:

```typescript
import { handleError } from '@/lib/errors/errorHandler'

try {
  await someRiskyOperation()
} catch (error) {
  handleError(error as Error, {
    action: 'operation_name',
    user_id: user.id,
    additional: 'context'
  })
}
```

---

## 🌐 Step 4: Add to Vercel (Production)

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables

2. Add these variables:

```
NEXT_PUBLIC_POSTHOG_KEY=phc_your_key
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/project-id
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
SENTRY_AUTH_TOKEN=your-token
```

3. Redeploy your app

---

## 📊 Step 5: Create Your First Dashboard

### **In PostHog:**

1. Go to "Insights" → "New Insight"

2. **User Signups Dashboard:**
   - Event: `user_signup`
   - Group by: `role`
   - Chart: Line graph
   - Date range: Last 30 days

3. **Conversion Funnel:**
   - Events (in order):
     1. `user_signup` (filter: role = tutor)
     2. `profile_completed`
     3. `class_created`
   - Chart: Funnel
   - This shows how many tutors complete onboarding

4. **Session Success Rate:**
   - Events:
     1. `session_started`
     2. `session_completed`
   - Chart: Funnel
   - Shows % of sessions that complete successfully

5. Save all to a dashboard called "ClassroomLY Overview"

---

## ✅ Verification Checklist

- [ ] Added PostHog keys to `.env.local`
- [ ] Added Sentry DSN to `.env.local`
- [ ] Ran `npm run dev` successfully
- [ ] Can see PostHog events in browser console
- [ ] Tested error tracking (saw error in Sentry)
- [ ] Added tracking to signup flow
- [ ] Added tracking to class creation
- [ ] Added tracking to booking flow
- [ ] Added tracking to session actions
- [ ] Created first PostHog dashboard
- [ ] Added environment variables to Vercel
- [ ] Deployed to production
- [ ] Verified tracking works in production

---

## 📈 What You Can Track Now

**User Behavior:**
- Who signs up (tutors vs students)
- How many complete their profile
- How many create classes
- Booking completion rate
- Session attendance rate

**Feature Usage:**
- Materials uploaded
- Notes added
- Sessions imported
- Reports generated
- Reschedules requested

**Technical Health:**
- Error rate and types
- Which features break
- User context when errors occur
- Performance issues

**Business Metrics:**
- User growth
- Activation rate
- Retention
- Engagement
- Feature adoption

---

## 🎯 Key Dashboards to Monitor Daily

1. **User Growth** - New signups, role breakdown
2. **Activation** - % who complete onboarding
3. **Engagement** - DAU, sessions, features used
4. **Errors** - Error rate, top issues
5. **Conversions** - Signup → Class → Booking funnel

---

## 💰 Cost Reminder

- **PostHog:** FREE up to 1M events/month
- **Sentry:** FREE up to 5K errors/month
- **Vercel Analytics:** FREE (included)

**Total: $0/month!** 🎉

Monitor your usage and upgrade when needed.

---

## 🆘 Troubleshooting

### PostHog not working?
- Check: Is `NEXT_PUBLIC_POSTHOG_KEY` set in `.env.local`?
- Check: Browser console for PostHog initialization
- Check: Network tab for requests to `app.posthog.com`

### Sentry not capturing errors?
- Check: Is `NEXT_PUBLIC_SENTRY_DSN` set?
- Check: Network tab for requests to Sentry
- Note: Sentry might not send errors in dev mode (this is normal)

### Events not showing in PostHog?
- Check: Are you calling `analytics.track()`?
- Check: Is the event name correct?
- Wait: Events can take 1-2 minutes to appear

---

## 📚 Documentation

- PostHog: https://posthog.com/docs
- Sentry: https://docs.sentry.io
- Full setup guide: `POSTHOG_SENTRY_SETUP.md`
- Tools overview: `ANALYTICS_MONITORING_GUIDE.md`

---

## 🎉 You're All Set!

Your analytics stack is now:
✅ Installed
✅ Configured
✅ Integrated into your app
✅ Ready to track events

**Next steps:**
1. Add your API keys
2. Test locally
3. Add tracking to key actions
4. Deploy to production
5. Monitor your dashboards!

**Start making data-driven decisions! 📊**

