# 📊 PostHog & Sentry Setup Guide

## Overview
Complete step-by-step guide to integrate PostHog (analytics) and Sentry (error tracking) into ClassroomLY.

---

## 📋 Prerequisites

✅ You have signed up for PostHog  
✅ You have signed up for Sentry  
✅ You have your API keys ready

---

## 🚀 Step 1: Install Dependencies

Run this in your terminal:

```bash
npm install posthog-js @sentry/nextjs
```

---

## 🔧 Step 2: Get Your API Keys

### **PostHog:**
1. Go to: https://app.posthog.com/project/settings
2. Copy your **Project API Key**
3. Copy your **Host** (usually `https://app.posthog.com` or `https://eu.posthog.com`)

### **Sentry:**
1. Go to: https://sentry.io/settings/
2. Select your project
3. Go to "Client Keys (DSN)"
4. Copy your **DSN**

---

## 🔐 Step 3: Add Environment Variables

Add these to your `.env.local` file:

```bash
# PostHog
NEXT_PUBLIC_POSTHOG_KEY=phc_your_key_here
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# Sentry
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/project-id
SENTRY_AUTH_TOKEN=your_auth_token_here
```

**Don't commit `.env.local`!** It's already in `.gitignore`.

---

## 📁 Step 4: Create PostHog Provider

Create `lib/analytics/posthog.tsx`:

```typescript
'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

if (typeof window !== 'undefined') {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    loaded: (posthog) => {
      if (process.env.NODE_ENV === 'development') {
        posthog.debug()
      }
    },
    capture_pageview: false, // We'll handle this manually
    capture_pageleave: true,
  })
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  return <PHProvider client={posthog}>{children}</PHProvider>
}

// PageView tracker component
export function PostHogPageView() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (pathname) {
      let url = window.origin + pathname
      if (searchParams && searchParams.toString()) {
        url = url + `?${searchParams.toString()}`
      }
      posthog.capture('$pageview', {
        $current_url: url,
      })
    }
  }, [pathname, searchParams])

  return null
}
```

---

## 🚨 Step 5: Configure Sentry

Run the Sentry setup wizard:

```bash
npx @sentry/wizard@latest -i nextjs
```

This will:
- Create `sentry.client.config.ts`
- Create `sentry.server.config.ts`
- Create `sentry.edge.config.ts`
- Update `next.config.js`

If you prefer manual setup, create these files:

### `sentry.client.config.ts`:
```typescript
import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  tracesSampleRate: 1.0,
  
  debug: false,
  
  environment: process.env.NODE_ENV,
  
  replaysOnErrorSampleRate: 1.0,
  
  replaysSessionSampleRate: 0.1,
  
  integrations: [
    new Sentry.Replay({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
})
```

### `sentry.server.config.ts`:
```typescript
import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  tracesSampleRate: 1.0,
  
  debug: false,
  
  environment: process.env.NODE_ENV,
})
```

### `sentry.edge.config.ts`:
```typescript
import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  tracesSampleRate: 1.0,
  
  debug: false,
  
  environment: process.env.NODE_ENV,
})
```

---

## 🎯 Step 6: Create Analytics Wrapper

Create `lib/analytics/index.ts`:

```typescript
'use client'

import posthog from 'posthog-js'
import * as Sentry from '@sentry/nextjs'

export class Analytics {
  // Identify user
  static identify(userId: string, traits: Record<string, any>) {
    if (typeof window === 'undefined') return

    posthog.identify(userId, traits)
    Sentry.setUser({ id: userId, ...traits })
  }

  // Track event
  static track(event: string, properties?: Record<string, any>) {
    if (typeof window === 'undefined') return

    posthog.capture(event, properties)
  }

  // Track page view
  static page(pageName: string, properties?: Record<string, any>) {
    if (typeof window === 'undefined') return

    posthog.capture('$pageview', { page: pageName, ...properties })
  }

  // Reset on logout
  static reset() {
    if (typeof window === 'undefined') return

    posthog.reset()
    Sentry.setUser(null)
  }

  // Capture error
  static captureError(error: Error, context?: Record<string, any>) {
    console.error('Error:', error, 'Context:', context)
    
    Sentry.captureException(error, {
      contexts: { custom: context }
    })
  }
}
```

---

## 🎨 Step 7: Create Analytics Hook

Create `hooks/useAnalytics.ts`:

```typescript
'use client'

import { useEffect } from 'react'
import { Analytics } from '@/lib/analytics'
import { useAuth } from './useAuth'

export function useAnalytics() {
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      Analytics.identify(user.id, {
        email: user.email,
        role: user.role,
        created_at: user.created_at
      })
    }
  }, [user])

  return {
    // User events
    trackSignup: (role: string) => {
      Analytics.track('user_signup', { role })
    },
    
    trackProfileComplete: () => {
      Analytics.track('profile_completed')
    },

    // Tutor events
    trackClassCreated: (classData: {
      subject: string
      duration: number
      price?: number
    }) => {
      Analytics.track('class_created', classData)
    },

    trackBookingLinkShared: (method: string) => {
      Analytics.track('booking_link_shared', { method })
    },

    // Student events
    trackBookingStarted: (classId: string) => {
      Analytics.track('booking_started', { class_id: classId })
    },

    trackBookingCompleted: (bookingData: {
      class_id: string
      session_count: number
    }) => {
      Analytics.track('booking_completed', bookingData)
    },

    // Session events
    trackSessionStarted: (sessionId: string) => {
      Analytics.track('session_started', { session_id: sessionId })
    },

    trackSessionCompleted: (sessionId: string, duration: number) => {
      Analytics.track('session_completed', { 
        session_id: sessionId,
        duration 
      })
    },

    // Feature usage
    trackMaterialUploaded: (fileType: string, size: number) => {
      Analytics.track('material_uploaded', { 
        file_type: fileType, 
        size_bytes: size 
      })
    },

    trackNoteAdded: (noteType: 'session' | 'class') => {
      Analytics.track('note_added', { type: noteType })
    },

    trackRescheduleRequested: (sessionId: string) => {
      Analytics.track('reschedule_requested', { session_id: sessionId })
    },

    trackImportSessions: (count: number) => {
      Analytics.track('sessions_imported', { count })
    },

    // Report events
    trackReportGenerated: (reportType: string) => {
      Analytics.track('report_generated', { type: reportType })
    },
  }
}
```

---

## 🔌 Step 8: Update Root Layout

Update `app/layout.tsx`:

```typescript
import { PostHogProvider, PostHogPageView } from '@/lib/analytics/posthog'
import { Suspense } from 'react'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <PostHogProvider>
          <Suspense fallback={null}>
            <PostHogPageView />
          </Suspense>
          {children}
        </PostHogProvider>
      </body>
    </html>
  )
}
```

---

## 📊 Step 9: Add Tracking to Key Actions

### **Example 1: Track Signup**

In `app/(auth)/signup/page.tsx`:

```typescript
import { useAnalytics } from '@/hooks/useAnalytics'

function SignupPage() {
  const analytics = useAnalytics()
  
  const handleSignup = async (data: SignupData) => {
    // ... signup logic
    
    analytics.trackSignup(data.role)
  }
}
```

### **Example 2: Track Class Creation**

In `app/(dashboard)/tutor/classes/create/page.tsx`:

```typescript
import { useAnalytics } from '@/hooks/useAnalytics'

function CreateClassPage() {
  const analytics = useAnalytics()
  
  const handleCreateClass = async (classData: ClassData) => {
    // ... create class logic
    
    analytics.trackClassCreated({
      subject: classData.subject,
      duration: classData.duration,
      price: classData.price
    })
  }
}
```

### **Example 3: Track Session Start**

In `app/(dashboard)/tutor/bookings/[id]/sessions/[sessionId]/page.tsx`:

```typescript
import { useAnalytics } from '@/hooks/useAnalytics'

function SessionPage() {
  const analytics = useAnalytics()
  
  const handleStartSession = async () => {
    // ... start session logic
    
    analytics.trackSessionStarted(sessionId)
  }
}
```

---

## 🚨 Step 10: Add Error Tracking

Create `lib/errors/errorHandler.ts`:

```typescript
import * as Sentry from '@sentry/nextjs'
import toast from 'react-hot-toast'

export function handleError(
  error: Error, 
  context?: Record<string, any>,
  showToast: boolean = true
) {
  // Log in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', error, 'Context:', context)
  }

  // Send to Sentry
  Sentry.captureException(error, {
    contexts: { custom: context }
  })

  // Show user message
  if (showToast) {
    toast.error(error.message || 'Something went wrong. Please try again.')
  }
}

// Usage:
// try {
//   await someAction()
// } catch (error) {
//   handleError(error as Error, {
//     action: 'create_class',
//     user_id: user.id,
//     data: classData
//   })
// }
```

---

## 🌐 Step 11: Add to Vercel Environment Variables

1. Go to: Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add these variables:

```
NEXT_PUBLIC_POSTHOG_KEY=phc_your_key_here
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/project-id
SENTRY_AUTH_TOKEN=your_auth_token_here
```

3. Redeploy your app

---

## ✅ Step 12: Test Your Setup

### **Test PostHog:**

1. Run your app: `npm run dev`
2. Navigate to different pages
3. Perform some actions (signup, create class, etc.)
4. Go to PostHog dashboard: https://app.posthog.com
5. Check "Events" → You should see your events!

### **Test Sentry:**

1. Add a test error button:

```typescript
<button onClick={() => {
  throw new Error('Test Sentry Error!')
}}>
  Test Error
</button>
```

2. Click the button
3. Go to Sentry dashboard: https://sentry.io
4. Check "Issues" → You should see the error!

---

## 📊 Step 13: Create Your First Dashboard

### **In PostHog:**

1. Go to "Insights" → "New Insight"
2. Create these graphs:

**User Signups:**
- Event: `user_signup`
- Group by: `role`
- Chart type: Line

**Class Creation Funnel:**
- Events: 
  1. `user_signup` (role = tutor)
  2. `profile_completed`
  3. `class_created`
- Chart type: Funnel

**Session Completion Rate:**
- Events:
  1. `session_started`
  2. `session_completed`
- Chart type: Funnel

3. Save to a dashboard called "ClassroomLY Overview"

---

## 🎯 Key Events Reference

Here are all the events we're tracking:

| Event | Properties | When to Fire |
|-------|-----------|--------------|
| `user_signup` | `role` | User completes signup |
| `profile_completed` | - | User fills profile |
| `class_created` | `subject`, `duration`, `price` | Tutor creates class |
| `booking_link_shared` | `method` | Tutor shares booking link |
| `booking_started` | `class_id` | Student starts booking |
| `booking_completed` | `class_id`, `session_count` | Student completes booking |
| `session_started` | `session_id` | Session begins |
| `session_completed` | `session_id`, `duration` | Session ends |
| `material_uploaded` | `file_type`, `size_bytes` | File uploaded |
| `note_added` | `type` | Note created |
| `reschedule_requested` | `session_id` | Reschedule requested |
| `sessions_imported` | `count` | Bulk import done |
| `report_generated` | `type` | Report created |

---

## 🔍 Debugging

### **PostHog not tracking?**

Check:
- [ ] Is `NEXT_PUBLIC_POSTHOG_KEY` set?
- [ ] Is PostHog initialized? (Check console in dev mode)
- [ ] Are you calling `Analytics.track()` correctly?
- [ ] Check browser console for errors

### **Sentry not capturing errors?**

Check:
- [ ] Is `NEXT_PUBLIC_SENTRY_DSN` set?
- [ ] Is Sentry initialized? (Check Network tab)
- [ ] Are you in production mode? (Sentry might not send in dev)
- [ ] Check Sentry quotas (free tier has limits)

---

## 📈 Metrics to Monitor Daily

### **User Growth:**
- Daily signups (tutors vs students)
- Profile completion rate

### **Engagement:**
- Classes created per day
- Bookings per day
- Sessions completed per day

### **Quality:**
- Error rate (Sentry)
- Page load time (Vercel Analytics)
- Session completion rate

### **Feature Adoption:**
- Materials uploaded
- Notes added
- Imports used
- Reschedules requested

---

## 🎉 You're All Set!

Your analytics stack is now live! 🚀

**What to do next:**
1. Monitor your dashboards daily
2. Set up alerts for critical errors (Sentry)
3. Create custom funnels (PostHog)
4. Track feature adoption
5. Make data-driven decisions!

---

## 📚 Resources

- PostHog Docs: https://posthog.com/docs
- Sentry Docs: https://docs.sentry.io
- PostHog React SDK: https://posthog.com/docs/libraries/react
- Sentry Next.js: https://docs.sentry.io/platforms/javascript/guides/nextjs/

---

## 💰 Costs Reminder

- **PostHog:** FREE up to 1M events/month
- **Sentry:** FREE up to 5K errors/month
- **Vercel Analytics:** FREE (included)

**Total: $0/month** for your current scale! 🎉

As you grow, monitor usage and upgrade when needed.

---

**Happy tracking! 📊**

