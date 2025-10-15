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


