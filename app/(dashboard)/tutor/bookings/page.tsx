'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'
import DashboardLayout from '@/components/DashboardLayout'
import SessionsList from '@/components/SessionsList'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Calendar, User, Mail, BookOpen, FileText, BarChart } from 'lucide-react'
import toast from 'react-hot-toast'
import { getBookingSessions, getSessionStats } from '@/lib/sessions'

interface BookingWithSessions {
  id: string
  student_name: string
  student_email: string
  status: string
  notes: string | null
  total_sessions: number
  start_date: string
  created_at: string
  class: {
    title: string
    subject: string
    duration: number
  }
  sessions?: any[]
  stats?: any
}

export default function TutorBookingsPage() {
  const { profile } = useAuth()
  const supabase = createClient()
  const [bookings, setBookings] = useState<BookingWithSessions[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'confirmed' | 'completed' | 'cancelled'>('all')
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null)

  useEffect(() => {
    loadBookings()
  }, [profile])

  const loadBookings = async () => {
    if (!profile) return

    try {
      // Get tutor profile
      const { data: tutorData } = await supabase
        .from('tutors')
        .select('id')
        .eq('user_id', profile.id)
        .single()

      if (!tutorData) return

      // Get all classes for this tutor
      const { data: classes } = await supabase
        .from('classes')
        .select('id')
        .eq('tutor_id', tutorData.id)

      if (!classes) return

      const classIds = classes.map((c) => c.id)

      // Get bookings for these classes
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          class:classes(
            title,
            subject,
            duration
          )
        `)
        .in('class_id', classIds)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Load sessions and stats for each booking
      const bookingsWithSessions = await Promise.all(
        (data || []).map(async (booking: any) => {
          const sessions = await getBookingSessions(booking.id)
          const stats = await getSessionStats(booking.id)
          return {
            ...booking,
            sessions,
            stats,
          }
        })
      )

      setBookings(bookingsWithSessions as any)
    } catch (error) {
      console.error('Error loading bookings:', error)
      toast.error('Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  const handleStartSession = async (sessionId: string) => {
    try {
      // Create classroom for this session
      const { data: classroom, error } = await supabase
        .from('classrooms')
        .insert({
          session_id: sessionId,
          status: 'scheduled',
          room_url: Math.random().toString(36).substring(2, 14),
        })
        .select()
        .single()

      if (error) throw error

      // Update session with classroom_id
      await supabase
        .from('sessions')
        .update({ classroom_id: classroom.id })
        .eq('id', sessionId)

      toast.success('Classroom created! Opening...')
      window.open(`/classroom/${classroom.room_url}`, '_blank')
      
      // Reload bookings to show updated classroom
      loadBookings()
    } catch (error) {
      console.error('Error starting session:', error)
      toast.error('Failed to start session')
    }
  }

  const filteredBookings = bookings.filter((booking) => {
    if (filter === 'all') return true
    return booking.status === filter
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <ProtectedRoute requiredRole="tutor">
      <DashboardLayout>
        <div>
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Bookings</h1>
            <p className="text-gray-600">
              Manage your student bookings and sessions
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {['all', 'confirmed', 'completed', 'cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status as any)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === status
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
                {status === 'all' && ` (${bookings.length})`}
                {status !== 'all' && ` (${bookings.filter((b) => b.status === status).length})`}
              </button>
            ))}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredBookings.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No bookings found
              </h3>
              <p className="text-gray-600 mb-6">
                {filter === 'all'
                  ? 'When students book your classes, they will appear here'
                  : `No ${filter} bookings at the moment`}
              </p>
              <Link href="/tutor/classes" className="btn-primary">
                View My Classes
              </Link>
            </div>
          )}

          {/* Bookings List */}
          {!loading && filteredBookings.length > 0 && (
            <div className="space-y-6">
              {filteredBookings.map((booking) => (
                <div key={booking.id} className="card">
                  {/* Booking Header */}
                  <div className="flex items-start justify-between mb-4 pb-4 border-b">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-xl font-semibold text-gray-900">
                          {booking.class.title}
                        </h2>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                          {booking.status}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>{booking.student_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          <span>{booking.student_email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4" />
                          <span>{booking.class.subject}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>Started: {new Date(booking.start_date).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {booking.notes && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-700">
                            <strong>Notes:</strong> {booking.notes}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/tutor/bookings/${booking.id}`}
                        className="btn-secondary text-sm flex items-center gap-2"
                      >
                        <FileText className="w-4 h-4" />
                        Full Details
                      </Link>
                      
                      <Link
                        href={`/tutor/bookings/${booking.id}/reports`}
                        className="btn-secondary text-sm flex items-center gap-2"
                      >
                        <BarChart className="w-4 h-4" />
                        Reports
                      </Link>
                    </div>
                  </div>

                  {/* Session Stats */}
                  {booking.stats && (
                    <div className="grid grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">{booking.stats.total}</p>
                        <p className="text-sm text-gray-600">Total Sessions</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">{booking.stats.completed}</p>
                        <p className="text-sm text-gray-600">Completed</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">{booking.stats.scheduled}</p>
                        <p className="text-sm text-gray-600">Scheduled</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-purple-600">{booking.stats.totalHours}h</p>
                        <p className="text-sm text-gray-600">Total Hours</p>
                      </div>
                    </div>
                  )}

                  {/* Sessions List */}
                  {booking.sessions && (
                    <div className="mt-4">
                      <button
                        onClick={() => setExpandedBooking(expandedBooking === booking.id ? null : booking.id)}
                        className="text-sm font-medium text-primary-600 hover:text-primary-700 mb-3"
                      >
                        {expandedBooking === booking.id ? '▼ Hide Sessions' : '▶ Show All Sessions'}
                      </button>
                      
                      {expandedBooking === booking.id && (
                        <SessionsList
                          sessions={booking.sessions}
                          bookingId={booking.id}
                          role="tutor"
                          onStartSession={handleStartSession}
                        />
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
