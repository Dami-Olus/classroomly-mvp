# 📊 Analytics & Monitoring Tools Guide

## Overview
This guide covers recommended analytics and monitoring tools for ClassroomLY to track user behavior, sessions, errors, and performance.

---

## �� Recommended Analytics Stack

### **Tier 1: Essential (Add Now)**

#### **1. PostHog** ⭐ RECOMMENDED
**Purpose:** Product analytics + session recording + feature flags

**Why PostHog:**
- ✅ Open source (self-hostable)
- ✅ GDPR compliant
- ✅ Session recordings
- ✅ Heatmaps
- ✅ Feature flags
- ✅ A/B testing
- ✅ Funnels & cohorts
- ✅ Free tier: 1M events/month

**What You Can Track:**
- User signup funnel
- Class creation flow
- Booking completion rate
- Video session duration
- Feature adoption
- User paths/journeys
- Drop-off points

**Setup:**
```bash
npm install posthog-js
```

```typescript
// lib/analytics/posthog.ts
import posthog from 'posthog-js'

export const initPostHog = () => {
  if (typeof window !== 'undefined') {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: 'https://app.posthog.com',
      loaded: (posthog) => {
        if (process.env.NODE_ENV === 'development') posthog.debug()
      },
    })
  }
}

// Track events
posthog.capture('class_created', {
  subject: 'Math',
  duration: 60,
  tutor_id: 'xxx'
})

// Identify users
posthog.identify(user.id, {
  email: user.email,
  role: user.role,
  signup_date: user.created_at
})
```

**Key Events to Track:**
- `user_signup` (with role)
- `profile_completed`
- `class_created`
- `booking_link_shared`
- `booking_completed`
- `session_started`
- `session_completed`
- `material_uploaded`
- `note_added`
- `reschedule_requested`
- `payment_completed`

**Cost:** Free up to 1M events/month, then $0.000225/event

---

#### **2. Plausible Analytics** ⭐ PRIVACY-FOCUSED
**Purpose:** Simple, privacy-friendly web analytics

**Why Plausible:**
- ✅ No cookies needed
- ✅ GDPR/CCPA compliant
- ✅ Lightweight (<1KB)
- ✅ Simple dashboard
- ✅ Open source
- ✅ EU-hosted option

**What You Can Track:**
- Page views
- Unique visitors
- Bounce rate
- Traffic sources
- Geographic data
- Device types
- Custom events

**Setup:**
```html
<!-- Add to app/layout.tsx -->
<script defer data-domain="yourdomain.com" 
  src="https://plausible.io/js/script.js"></script>
```

```typescript
// Track custom events
window.plausible('Class Created', {
  props: { subject: 'Math', duration: 60 }
})
```

**Cost:** $9/month for 10K pageviews

---

#### **3. Sentry** ⭐ ERROR TRACKING
**Purpose:** Error monitoring & performance tracking

**Why Sentry:**
- ✅ Real-time error tracking
- ✅ Stack traces
- ✅ User context
- ✅ Performance monitoring
- ✅ Release tracking
- ✅ Slack/email alerts

**What You Can Track:**
- Frontend errors
- API errors
- Unhandled exceptions
- Performance issues
- Slow API calls
- Failed database queries

**Setup:**
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

```typescript
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
})
```

**Key Features:**
- Error alerts
- Performance monitoring
- Session replays
- Release tracking
- User feedback

**Cost:** Free for 5K errors/month, then $26/month

---

### **Tier 2: Advanced (Add Later)**

#### **4. Mixpanel**
**Purpose:** Advanced product analytics

**Best For:**
- Funnel analysis
- Cohort analysis
- Retention tracking
- User segmentation
- A/B testing

**Key Metrics:**
- DAU/MAU ratio
- Retention curves
- Feature adoption
- User lifetime value

**Cost:** Free up to 100K MTU (Monthly Tracked Users)

---

#### **5. LogRocket**
**Purpose:** Session replay + debugging

**Best For:**
- Reproducing bugs
- Understanding user struggles
- Debugging production issues
- Support tickets

**Features:**
- Session replay
- Console logs
- Network requests
- Redux state
- Error tracking

**Cost:** $99/month for 10K sessions

---

#### **6. Amplitude**
**Purpose:** Product intelligence

**Best For:**
- Behavioral cohorts
- Predictive analytics
- User journey mapping
- Experimentation

**Cost:** Free up to 10M events/month

---

## 🔍 Monitoring Stack

### **1. Better Stack (formerly Logtail)** ⭐
**Purpose:** Log management & uptime monitoring

**Features:**
- Centralized logging
- Uptime monitoring
- Incident management
- Status pages
- Slack alerts

**Setup:**
```bash
npm install @logtail/node @logtail/pino
```

**Cost:** Free for 1GB logs/month

---

### **2. Cronitor**
**Purpose:** Cron job & background task monitoring

**Best For:**
- Email reminders
- Session cleanup
- Report generation
- Data exports

**Cost:** Free for 5 monitors

---

### **3. Checkly**
**Purpose:** API & E2E monitoring

**Best For:**
- API uptime
- Critical user flows
- Performance regression

**Cost:** Free for 10 checks

---

## 📈 Key Metrics to Track

### **User Acquisition:**
- Sign-up rate
- Sign-up source (organic, referral, etc.)
- Time to complete profile
- Drop-off points in signup

### **Activation:**
- % tutors who create a class
- Time to first class creation
- % students who make a booking
- Time to first booking

### **Engagement:**
- Daily/Weekly/Monthly active users
- Sessions per user
- Session duration
- Materials uploaded
- Notes added
- Reschedules requested

### **Retention:**
- Day 1, 7, 30 retention
- Churn rate
- Inactive users
- Re-engagement rate

### **Revenue (Future):**
- Conversion to paid
- MRR/ARR
- Churn rate
- Lifetime value

### **Technical:**
- Page load time
- API response time
- Error rate
- Uptime %
- Database query time

---

## 🎯 Implementation Plan

### **Phase 1: Essential Analytics (Week 1)**

1. **PostHog** - Product analytics
   - Events tracking
   - Session recording
   - Funnel analysis

2. **Sentry** - Error tracking
   - Frontend errors
   - API errors
   - Performance monitoring

3. **Vercel Analytics** - Web vitals
   - Already built-in
   - Just enable in dashboard

**Total Cost:** ~$0-35/month

---

### **Phase 2: Enhanced Monitoring (Month 2)**

4. **Better Stack** - Logging & uptime
   - Centralized logs
   - Uptime checks
   - Incident alerts

5. **Plausible** - Privacy-friendly analytics
   - Pageview tracking
   - Traffic sources

**Total Cost:** ~$18-44/month

---

### **Phase 3: Advanced Analytics (Month 3+)**

6. **LogRocket** - Session replay (if needed)
7. **Mixpanel** - Advanced product analytics
8. **Checkly** - E2E monitoring

**Total Cost:** ~$125-200/month

---

## 💻 Code Implementation

### **Analytics Wrapper**

```typescript
// lib/analytics/index.ts
import posthog from 'posthog-js'
import * as Sentry from '@sentry/nextjs'

export class Analytics {
  static identify(userId: string, traits: Record<string, any>) {
    posthog.identify(userId, traits)
    Sentry.setUser({ id: userId, ...traits })
  }

  static track(event: string, properties?: Record<string, any>) {
    posthog.capture(event, properties)
    
    // Also track in Plausible for pageview events
    if (typeof window !== 'undefined' && (window as any).plausible) {
      (window as any).plausible(event, { props: properties })
    }
  }

  static page(pageName: string, properties?: Record<string, any>) {
    posthog.capture('$pageview', { page: pageName, ...properties })
  }

  static reset() {
    posthog.reset()
    Sentry.setUser(null)
  }
}

// Usage:
Analytics.identify(user.id, {
  email: user.email,
  role: user.role,
  name: user.name
})

Analytics.track('class_created', {
  subject: 'Mathematics',
  duration: 60,
  price: 50
})
```

---

### **Key Events to Implement**

```typescript
// hooks/useAnalytics.ts
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
    trackClassCreated: (classData: any) => {
      Analytics.track('class_created', {
        subject: classData.subject,
        duration: classData.duration,
        price: classData.price
      })
    },

    trackBookingLinkShared: (method: string) => {
      Analytics.track('booking_link_shared', { method })
    },

    // Student events
    trackBookingStarted: () => {
      Analytics.track('booking_started')
    },

    trackBookingCompleted: (bookingData: any) => {
      Analytics.track('booking_completed', {
        class_id: bookingData.class_id,
        session_count: bookingData.session_count
      })
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
      Analytics.track('material_uploaded', { file_type: fileType, size })
    },

    trackNoteAdded: (noteType: string) => {
      Analytics.track('note_added', { type: noteType })
    },

    trackRescheduleRequested: () => {
      Analytics.track('reschedule_requested')
    },

    trackImportSessions: (count: number) => {
      Analytics.track('sessions_imported', { count })
    }
  }
}
```

---

### **Error Tracking Example**

```typescript
// lib/errors/errorHandler.ts
import * as Sentry from '@sentry/nextjs'
import toast from 'react-hot-toast'

export function handleError(error: Error, context?: Record<string, any>) {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', error, 'Context:', context)
  }

  // Send to Sentry
  Sentry.captureException(error, {
    contexts: { custom: context }
  })

  // Show user-friendly message
  toast.error(error.message || 'Something went wrong')
}

// Usage:
try {
  await createClass(classData)
} catch (error) {
  handleError(error as Error, {
    action: 'create_class',
    user_id: user.id,
    class_data: classData
  })
}
```

---

## 🎯 Recommended Setup for ClassroomLY

### **Immediate (This Week):**

1. **PostHog** - Free tier is generous
   - Track all key events
   - Session recordings
   - Funnels

2. **Sentry** - Free tier works great
   - Error tracking
   - Performance monitoring

3. **Vercel Analytics** - Already included
   - Just enable it
   - Track Web Vitals

**Total: $0/month** (on free tiers)

---

### **Month 2:**

4. **Better Stack** - For logging
5. **Plausible** - For simple analytics

**Total: ~$18/month**

---

## 📊 Dashboard Setup

### **Create Custom Dashboards:**

1. **User Health Dashboard** (PostHog)
   - DAU/MAU
   - Retention curves
   - Feature adoption

2. **Conversion Dashboard** (PostHog)
   - Signup → Profile completion
   - Profile → Class creation
   - Booking link → Booking completed

3. **Technical Dashboard** (Sentry + Vercel)
   - Error rate
   - API response times
   - Page load times

4. **Business Dashboard** (Admin + PostHog)
   - User growth
   - Engagement metrics
   - Revenue (future)

---

## 🚀 Next Steps

1. **Set up PostHog** (highest priority)
2. **Set up Sentry** (error tracking)
3. **Add event tracking** to key user actions
4. **Create dashboards** for daily monitoring
5. **Set up alerts** for critical issues

---

## 📝 Event Naming Convention

Use clear, consistent event names:

```typescript
// Good
'user_signup'
'class_created'
'booking_completed'
'session_started'

// Bad
'signup'
'created'
'booked'
'start'
```

Format: `noun_verb` or `verb_noun`

---

## 🔐 Privacy Considerations

1. **Get user consent** for analytics
2. **Anonymize sensitive data**
3. **Don't track PII** unnecessarily
4. **Use privacy-friendly tools** (Plausible)
5. **Comply with GDPR/CCPA**

---

## 💰 Cost Summary

| Tool | Free Tier | Paid (Month 1) | Paid (Scale) |
|------|-----------|----------------|--------------|
| PostHog | 1M events | $0 | $225/month |
| Sentry | 5K errors | $0 | $26/month |
| Vercel Analytics | Included | $0 | $10/month |
| Better Stack | 1GB logs | $0 | $10/month |
| Plausible | N/A | $9 | $19/month |
| **TOTAL** | **$0** | **$9** | **$290/month** |

Start with free tiers, upgrade as you grow!

---

## ✅ Quick Start Checklist

- [ ] Sign up for PostHog
- [ ] Install PostHog SDK
- [ ] Add event tracking to key actions
- [ ] Set up Sentry
- [ ] Configure error boundaries
- [ ] Enable Vercel Analytics
- [ ] Create monitoring dashboards
- [ ] Set up alerts
- [ ] Document key metrics
- [ ] Review weekly

---

**Your analytics stack is ready to implement!** 📊

For questions or help with setup, refer to official docs:
- PostHog: https://posthog.com/docs
- Sentry: https://docs.sentry.io
- Plausible: https://plausible.io/docs

