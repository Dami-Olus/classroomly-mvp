import { createEvents, DateArray, EventAttributes } from 'ics'

interface CalendarEvent {
  title: string
  description?: string
  location?: string
  startTime: Date
  duration: number // in minutes
  organizer?: {
    name: string
    email: string
  }
  attendees?: Array<{
    name: string
    email: string
  }>
}

export function generateICSFile(events: CalendarEvent[]): string | null {
  try {
    const icsEvents: EventAttributes[] = events.map((event) => {
      const start = event.startTime
      const startArray: DateArray = [
        start.getFullYear(),
        start.getMonth() + 1,
        start.getDate(),
        start.getHours(),
        start.getMinutes(),
      ]

      return {
        start: startArray,
        duration: { minutes: event.duration },
        title: event.title,
        description: event.description || '',
        location: event.location || '',
        status: 'CONFIRMED' as const,
        busyStatus: 'BUSY' as const,
        organizer: event.organizer
          ? { name: event.organizer.name, email: event.organizer.email }
          : undefined,
        attendees: event.attendees?.map((a) => ({
          name: a.name,
          email: a.email,
          rsvp: true,
        })),
      }
    })

    const { error, value } = createEvents(icsEvents)

    if (error) {
      console.error('Error creating ICS file:', error)
      return null
    }

    return value || null
  } catch (error) {
    console.error('Error generating ICS:', error)
    return null
  }
}

export function downloadICSFile(icsContent: string, filename: string = 'booking.ics') {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(link.href)
}

