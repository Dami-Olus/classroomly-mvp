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


