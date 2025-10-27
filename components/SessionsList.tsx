'use client'

import { useState } from 'react'
import { Calendar, Clock, Video, Edit, FileText, ChevronDown, ChevronUp } from 'lucide-react'
import { formatSessionDateTime, getSessionStatusColor, isSessionInPast, isSessionToday } from '@/lib/sessions'
import Link from 'next/link'

interface Session {
  id: string
  session_number: number
  scheduled_date: string
  scheduled_time: string
  scheduled_day: string
  duration: number
  status: string
  classroom_id?: string
  classroom?: {
    id: string
    room_url: string
    status: string
  }
}

interface SessionsListProps {
  sessions: Session[]
  bookingId: string
  role: 'tutor' | 'student'
  onStartSession?: (sessionId: string) => void
}

export default function SessionsList({ sessions, bookingId, role, onStartSession }: SessionsListProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  
  // Split sessions into upcoming and past
  const now = new Date()
  const upcomingSessions = sessions.filter(s => {
    const sessionDate = new Date(`${s.scheduled_date}T${s.scheduled_time}`)
    return sessionDate >= now || s.status === 'scheduled' || s.status === 'rescheduled'
  }).sort((a, b) => {
    const dateA = new Date(`${a.scheduled_date}T${a.scheduled_time}`)
    const dateB = new Date(`${b.scheduled_date}T${b.scheduled_time}`)
    return dateA.getTime() - dateB.getTime()
  })
  
  const pastSessions = sessions.filter(s => {
    const sessionDate = new Date(`${s.scheduled_date}T${s.scheduled_time}`)
    return sessionDate < now && (s.status === 'completed' || s.status === 'cancelled' || s.status === 'no_show')
  }).sort((a, b) => {
    const dateA = new Date(`${a.scheduled_date}T${a.scheduled_time}`)
    const dateB = new Date(`${b.scheduled_date}T${b.scheduled_time}`)
    return dateB.getTime() - dateA.getTime()
  })

  const canStartSession = (session: Session) => {
    if (role !== 'tutor') return false
    if (session.status !== 'scheduled' && session.status !== 'rescheduled') return false
    
    const sessionDate = new Date(`${session.scheduled_date}T${session.scheduled_time}`)
    const now = new Date()
    const fiveMinutesBefore = new Date(sessionDate.getTime() - 5 * 60 * 1000)
    
    return now >= fiveMinutesBefore
  }

  const canJoinSession = (session: Session) => {
    if (role !== 'student') return false
    if (!session.classroom?.room_url) return false
    if (session.status !== 'scheduled' && session.status !== 'rescheduled') return false
    
    return true
  }

  return (
    <div className="space-y-4">
      {/* Upcoming Sessions */}
      <div className="card">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between mb-4"
        >
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-semibold">
              Upcoming Sessions ({upcomingSessions.length})
            </h3>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {isExpanded && (
          <div className="space-y-2">
            {upcomingSessions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No upcoming sessions</p>
              </div>
            ) : (
              upcomingSessions.map((session) => (
                <div
                  key={session.id}
                  className={`border rounded-lg p-3 sm:p-4 transition-all ${
                    isSessionToday(session.scheduled_date)
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="font-semibold text-sm sm:text-base text-gray-900">
                          Session {session.session_number}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getSessionStatusColor(session.status)}`}>
                          {session.status}
                        </span>
                        {isSessionToday(session.scheduled_date) && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Today
                          </span>
                        )}
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatSessionDateTime(session.scheduled_date, session.scheduled_time, session.scheduled_day)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{session.duration} min</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-shrink-0 w-full sm:w-auto">
                      {/* Tutor Actions */}
                      {role === 'tutor' && (
                        <>
                          {canStartSession(session) && !session.classroom_id && (
                            <button
                              onClick={() => onStartSession?.(session.id)}
                              className="btn-primary text-xs sm:text-sm flex items-center justify-center gap-2"
                            >
                              <Video className="w-4 h-4" />
                              Start Session
                            </button>
                          )}
                          
                          {session.classroom?.room_url && (
                            <Link
                              href={`/classroom/${session.classroom.room_url}`}
                              target="_blank"
                              className="btn-primary text-xs sm:text-sm flex items-center justify-center gap-2"
                            >
                              <Video className="w-4 h-4" />
                              Enter Classroom
                            </Link>
                          )}
                          
                          <Link
                            href={`/tutor/bookings/${bookingId}/sessions/${session.id}`}
                            className="btn-secondary text-xs sm:text-sm flex items-center justify-center gap-2"
                          >
                            <FileText className="w-4 h-4" />
                            Details
                          </Link>
                        </>
                      )}

                      {/* Student Actions */}
                      {role === 'student' && (
                        <>
                          {canJoinSession(session) && (
                            <Link
                              href={`/classroom/${session.classroom?.room_url}`}
                              target="_blank"
                              className="btn-primary text-xs sm:text-sm flex items-center justify-center gap-2"
                            >
                              <Video className="w-4 h-4" />
                              Join Classroom
                            </Link>
                          )}
                          
                          <Link
                            href={`/student/bookings/${bookingId}/sessions/${session.id}`}
                            className="btn-secondary text-xs sm:text-sm flex items-center justify-center gap-2"
                          >
                            <FileText className="w-4 h-4" />
                            Details
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Past Sessions */}
      {pastSessions.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold">
              Past Sessions ({pastSessions.length})
            </h3>
          </div>

          <div className="space-y-2">
            {pastSessions.slice(0, 5).map((session) => (
              <div
                key={session.id}
                className="border border-gray-200 rounded-lg p-3 sm:p-4 bg-gray-50"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-medium text-sm sm:text-base text-gray-700">
                        Session {session.session_number}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getSessionStatusColor(session.status)}`}>
                        {session.status}
                      </span>
                    </div>
                    
                    <div className="text-xs sm:text-sm text-gray-600">
                      {formatSessionDateTime(session.scheduled_date, session.scheduled_time, session.scheduled_day)}
                    </div>
                  </div>

                  <Link
                    href={`/${role}/bookings/${bookingId}/sessions/${session.id}`}
                    className="btn-secondary text-xs sm:text-sm flex items-center justify-center gap-2 w-full sm:w-auto"
                  >
                    <FileText className="w-4 h-4" />
                    View
                  </Link>
                </div>
              </div>
            ))}
            
            {pastSessions.length > 5 && (
              <div className="text-center pt-2">
                <Link
                  href={`/${role}/bookings/${bookingId}`}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  View all {pastSessions.length} past sessions →
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <div className="card text-center">
          <p className="text-2xl font-bold text-gray-900">{sessions.length}</p>
          <p className="text-sm text-gray-600">Total Sessions</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-green-600">
            {sessions.filter(s => s.status === 'completed').length}
          </p>
          <p className="text-sm text-gray-600">Completed</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-blue-600">{upcomingSessions.length}</p>
          <p className="text-sm text-gray-600">Upcoming</p>
        </div>
      </div>
    </div>
  )
}

