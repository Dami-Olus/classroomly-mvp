import { createClient } from '@/lib/supabase/client'

export interface SessionData {
  booking_id: string
  session_number: number
  scheduled_date: string // YYYY-MM-DD
  scheduled_time: string // HH:MM
  scheduled_day: string // 'Monday', 'Tuesday', etc.
  duration: number // minutes
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled' | 'no_show'
}

export interface GenerateSessionsParams {
  bookingId: string
  classSchedule: {
    days: string[] // ['Monday', 'Wednesday']
    times: string[] // ['14:00', '14:00']
    duration: number // minutes
  }
  startDate: Date
  totalSessions?: number // If null/undefined, generate 12 sessions by default
}

/**
 * Generate session instances for a booking
 */
export async function generateSessions(params: GenerateSessionsParams): Promise<SessionData[]> {
  const { bookingId, classSchedule, startDate, totalSessions = 12 } = params
  const sessions: SessionData[] = []
  
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  
  // Map class schedule days to day indices
  const scheduleDayIndices = classSchedule.days.map(day => daysOfWeek.indexOf(day))
  
  let sessionNumber = 1
  let currentDate = new Date(startDate)
  
  // Find the first scheduled day on or after the start date
  while (sessionNumber <= totalSessions) {
    const currentDayIndex = currentDate.getDay()
    const scheduleIndex = scheduleDayIndices.indexOf(currentDayIndex)
    
    if (scheduleIndex !== -1) {
      // This is a scheduled day
      const dayName = classSchedule.days[scheduleIndex]
      const time = classSchedule.times[scheduleIndex]
      
      sessions.push({
        booking_id: bookingId,
        session_number: sessionNumber,
        scheduled_date: currentDate.toISOString().split('T')[0], // YYYY-MM-DD
        scheduled_time: time,
        scheduled_day: dayName,
        duration: classSchedule.duration,
        status: 'scheduled',
      })
      
      sessionNumber++
    }
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1)
    
    // Safety check: don't generate more than 1 year of sessions
    if (currentDate > new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)) {
      break
    }
  }
  
  return sessions
}

/**
 * Create sessions in the database
 */
export async function createSessions(sessions: SessionData[]): Promise<void> {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('sessions')
    .insert(sessions)
  
  if (error) {
    console.error('Error creating sessions:', error)
    throw error
  }
}

/**
 * Get all sessions for a booking
 */
export async function getBookingSessions(bookingId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('sessions')
    .select(`
      *,
      classroom:classrooms(
        id,
        room_url,
        status
      )
    `)
    .eq('booking_id', bookingId)
    .order('session_number', { ascending: true })
  
  if (error) {
    console.error('Error fetching sessions:', error)
    throw error
  }
  
  return data
}

/**
 * Get upcoming sessions for a booking
 */
export async function getUpcomingSessions(bookingId: string, limit = 10) {
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]
  
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('booking_id', bookingId)
    .in('status', ['scheduled', 'rescheduled'])
    .gte('scheduled_date', today)
    .order('scheduled_date', { ascending: true })
    .order('scheduled_time', { ascending: true })
    .limit(limit)
  
  if (error) {
    console.error('Error fetching upcoming sessions:', error)
    throw error
  }
  
  return data
}

/**
 * Get past sessions for a booking
 */
export async function getPastSessions(bookingId: string, limit = 10) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('booking_id', bookingId)
    .in('status', ['completed', 'cancelled', 'no_show'])
    .order('scheduled_date', { ascending: false })
    .limit(limit)
  
  if (error) {
    console.error('Error fetching past sessions:', error)
    throw error
  }
  
  return data
}

/**
 * Update session status
 */
export async function updateSessionStatus(
  sessionId: string,
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled' | 'no_show',
  reason?: string
) {
  const supabase = createClient()
  
  const updates: any = { status }
  
  if (status === 'completed') {
    updates.completed_at = new Date().toISOString()
  }
  
  if (status === 'cancelled' && reason) {
    updates.cancelled_at = new Date().toISOString()
    updates.cancellation_reason = reason
  }
  
  const { error } = await supabase
    .from('sessions')
    .update(updates)
    .eq('id', sessionId)
  
  if (error) {
    console.error('Error updating session status:', error)
    throw error
  }
}

/**
 * Reschedule a session
 */
export async function rescheduleSession(
  sessionId: string,
  newDate: string,
  newTime: string,
  newDay: string
) {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('sessions')
    .update({
      scheduled_date: newDate,
      scheduled_time: newTime,
      scheduled_day: newDay,
      status: 'rescheduled',
    })
    .eq('id', sessionId)
  
  if (error) {
    console.error('Error rescheduling session:', error)
    throw error
  }
}

/**
 * Link a classroom to a session
 */
export async function linkClassroomToSession(sessionId: string, classroomId: string) {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('sessions')
    .update({ classroom_id: classroomId })
    .eq('id', sessionId)
  
  if (error) {
    console.error('Error linking classroom to session:', error)
    throw error
  }
}

/**
 * Get session statistics for a booking
 */
export async function getSessionStats(bookingId: string) {
  const supabase = createClient()
  
  const { data: sessions, error } = await supabase
    .from('sessions')
    .select('status, duration')
    .eq('booking_id', bookingId)
  
  if (error) {
    console.error('Error fetching session stats:', error)
    throw error
  }
  
  const total = sessions?.length || 0
  const completed = sessions?.filter(s => s.status === 'completed').length || 0
  const scheduled = sessions?.filter(s => s.status === 'scheduled').length || 0
  const cancelled = sessions?.filter(s => s.status === 'cancelled').length || 0
  const totalHours = sessions
    ?.filter(s => s.status === 'completed')
    .reduce((sum, s) => sum + (s.duration || 0), 0) / 60 || 0
  
  return {
    total,
    completed,
    scheduled,
    cancelled,
    totalHours: Math.round(totalHours * 10) / 10, // Round to 1 decimal
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
  }
}

/**
 * Format session date/time for display
 */
export function formatSessionDateTime(date: string, time: string, day: string): string {
  const sessionDate = new Date(`${date}T${time}`)
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }
  return sessionDate.toLocaleDateString('en-US', options)
}

/**
 * Check if session is in the past
 */
export function isSessionInPast(date: string, time: string): boolean {
  const sessionDateTime = new Date(`${date}T${time}`)
  return sessionDateTime < new Date()
}

/**
 * Check if session is today
 */
export function isSessionToday(date: string): boolean {
  const today = new Date().toISOString().split('T')[0]
  return date === today
}

/**
 * Get session status color
 */
export function getSessionStatusColor(status: string): string {
  switch (status) {
    case 'scheduled':
      return 'bg-blue-100 text-blue-800'
    case 'completed':
      return 'bg-green-100 text-green-800'
    case 'cancelled':
      return 'bg-red-100 text-red-800'
    case 'rescheduled':
      return 'bg-yellow-100 text-yellow-800'
    case 'no_show':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

