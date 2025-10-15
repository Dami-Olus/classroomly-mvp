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


