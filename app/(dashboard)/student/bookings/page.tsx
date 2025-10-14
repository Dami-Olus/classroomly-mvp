'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'
import DashboardLayout from '@/components/DashboardLayout'
import SessionsList from '@/components/SessionsList'
import AddToCalendarButton from '@/components/AddToCalendarButton'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Calendar, User, BookOpen, FileText, BarChart } from 'lucide-react'
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
  scheduled_slots: any[]
  class: {
    title: string
    subject: string
    duration: number
  }
  sessions?: any[]
  stats?: any
  tutor?: {
    user: {
      first_name: string
      last_name: string
      email: string
    }
  }
}

export default function StudentBookingsPage() {
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
      // Get bookings for this student
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          class:classes(
            id,
            title,
            subject,
            duration,
            tutor_id
          )
        `)
        .eq('student_id', profile.id)
        .order('created_at', { ascending: false })

      if (bookingsError) throw bookingsError

      // Load tutor info, sessions and stats for each booking
      const bookingsWithDetails = await Promise.all(
        (bookingsData || []).map(async (booking: any) => {
          // Get tutor info
          let tutorInfo = null
          if (booking.class?.tutor_id) {
            const { data: tutor } = await supabase
              .from('tutors')
              .select('user_id')
              .eq('id', booking.class.tutor_id)
              .single()

            if (tutor?.user_id) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('first_name, last_name, email')
                .eq('id', tutor.user_id)
                .single()

              tutorInfo = { user: profile }
            }
          }

          const sessions = await getBookingSessions(booking.id)
          const stats = await getSessionStats(booking.id)
          
          return {
            ...booking,
            tutor: tutorInfo,
            sessions,
            stats,
          }
        })
      )

      setBookings(bookingsWithDetails as any)
    } catch (error) {
      console.error('Error loading bookings:', error)
      toast.error('Failed to load bookings')
    } finally {
      setLoading(false)
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
    <ProtectedRoute requiredRole="student">
      <DashboardLayout>
        <div>
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Bookings</h1>
            <p className="text-gray-600">
              View your tutoring sessions and class schedule
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
                  ? 'Your tutoring sessions will appear here once you book a class'
                  : `No ${filter} bookings at the moment`}
              </p>
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
                        {booking.tutor && (
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span>
                              Tutor: {booking.tutor.user.first_name} {booking.tutor.user.last_name}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4" />
                          <span>{booking.class.subject}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>Started: {new Date(booking.start_date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {booking.scheduled_slots?.map(s => `${s.day}s at ${s.time}`).join(', ')}
                          </span>
                        </div>
                      </div>

                      {booking.notes && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-700">
                            <strong>Your Notes:</strong> {booking.notes}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {booking.scheduled_slots && booking.scheduled_slots.length > 0 && (
                        <AddToCalendarButton
                          title={booking.class.title}
                          description={`${booking.class.subject} tutoring session`}
                          location="Online"
                          startTime={booking.scheduled_slots[0].time}
                          endTime={booking.class.duration ? 
                            new Date(new Date(`2000-01-01T${booking.scheduled_slots[0].time}`).getTime() + booking.class.duration * 60000).toTimeString().slice(0, 5) : 
                            ''}
                          recurrence={`WEEKLY;BYDAY=${booking.scheduled_slots.map((s: any) => s.day.slice(0, 2).toUpperCase()).join(',')}`}
                        />
                      )}
                      
                      <Link
                        href={`/student/bookings/${booking.id}`}
                        className="btn-secondary text-sm flex items-center gap-2"
                      >
                        <FileText className="w-4 h-4" />
                        Full Details
                      </Link>
                      
                      <Link
                        href={`/student/bookings/${booking.id}/reports`}
                        className="btn-secondary text-sm flex items-center gap-2"
                      >
                        <BarChart className="w-4 h-4" />
                        View Reports
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
                        <p className="text-sm text-gray-600">Upcoming</p>
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
                          role="student"
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
