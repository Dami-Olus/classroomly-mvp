'use client'

import { useState } from 'react'
import { Calendar, Download } from 'lucide-react'
import { generateICSFile, downloadICSFile } from '@/lib/calendar'
import toast from 'react-hot-toast'

interface BookingSession {
  day: string
  time: string
  className: string
  tutorName: string
  duration: number
  location?: string
}

interface AddToCalendarButtonProps {
  sessions: BookingSession[]
  className?: string
}

export default function AddToCalendarButton({
  sessions,
  className = '',
}: AddToCalendarButtonProps) {
  const [generating, setGenerating] = useState(false)

  const handleDownload = () => {
    setGenerating(true)

    try {
      // Convert sessions to calendar events
      const events = sessions.map((session) => {
        // Calculate next occurrence of this day
        const today = new Date()
        const dayIndex = [
          'Sunday',
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
        ].indexOf(session.day)
        
        const currentDayIndex = today.getDay()
        let daysUntilNext = dayIndex - currentDayIndex
        if (daysUntilNext <= 0) daysUntilNext += 7

        const sessionDate = new Date(today)
        sessionDate.setDate(today.getDate() + daysUntilNext)
        
        const [hours, minutes] = session.time.split(':')
        sessionDate.setHours(parseInt(hours), parseInt(minutes), 0, 0)

        return {
          title: session.className,
          description: `Tutoring session with ${session.tutorName}`,
          location: session.location || 'Online - Classroomly Virtual Classroom',
          startTime: sessionDate,
          duration: session.duration,
          organizer: {
            name: session.tutorName,
            email: 'noreply@classroomly.com',
          },
        }
      })

      const icsContent = generateICSFile(events)

      if (!icsContent) {
        throw new Error('Failed to generate calendar file')
      }

      downloadICSFile(icsContent, 'classroomly-sessions.ics')
      toast.success('Calendar file downloaded!')
    } catch (error) {
      console.error('Error generating calendar:', error)
      toast.error('Failed to generate calendar file')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={generating}
      className={`btn-secondary flex items-center gap-2 ${className}`}
    >
      {generating ? (
        <>
          <div className="w-4 h-4 border-2 border-secondary-600 border-t-transparent rounded-full animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Calendar className="w-4 h-4" />
          Add to Calendar
        </>
      )}
    </button>
  )
}

