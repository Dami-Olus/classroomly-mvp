'use client'

import { useEffect, useState } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import DashboardLayout from '@/components/DashboardLayout'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Calendar, Clock, User, Mail, BookOpen, Video, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDate, formatTime } from '@/lib/utils'
import type { BookingWithDetails } from '@/types'

export default function TutorBookingsPage() {
  const { profile } = useAuth()
  const supabase = createClient()
  const [bookings, setBookings] = useState<BookingWithDetails[]>([])
  const [classrooms, setClassrooms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'confirmed' | 'completed' | 'cancelled'>('all')

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

      // Load classrooms for these bookings
      const { data: classroomsData, error: classroomsError } = await supabase
        .from('classrooms')
        .select(`
          *,
          booking:bookings(
            id,
            student_id,
            status
          )
        `)
        .in('booking_id', data?.map(b => b.id) || [])

      if (classroomsError) throw classroomsError

      setBookings(data as any || [])
      setClassrooms(classroomsData || [])
    } catch (error) {
      console.error('Error loading bookings:', error)
      toast.error('Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  const joinClassroom = (roomUrl: string) => {
    window.open(`/classroom/${roomUrl}`, '_blank')
  }

  const filteredBookings = bookings.filter((booking) => {
    if (filter === 'all') return true
    return booking.status === filter
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-700'
      case 'completed':
        return 'bg-blue-100 text-blue-700'
      case 'cancelled':
        return 'bg-red-100 text-red-700'
      case 'rescheduled':
        return 'bg-yellow-100 text-yellow-700'
      default:
        return 'bg-secondary-100 text-secondary-700'
    }
  }

  if (loading) {
    return (
      <ProtectedRoute requiredRole="tutor">
        <DashboardLayout>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-secondary-600">Loading bookings...</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requiredRole="tutor">
      <DashboardLayout>
        <div>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-secondary-900 mb-2">
              Bookings
            </h1>
            <p className="text-secondary-600">
              Manage your student bookings and sessions
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto">
            {[
              { key: 'all', label: 'All' },
              { key: 'confirmed', label: 'Confirmed' },
              { key: 'completed', label: 'Completed' },
              { key: 'cancelled', label: 'Cancelled' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as any)}
                className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                  filter === tab.key
                    ? 'bg-primary-600 text-white'
                    : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
                }`}
              >
                {tab.label}
                <span className="ml-2 text-sm">
                  (
                  {tab.key === 'all'
                    ? bookings.length
                    : bookings.filter((b) => b.status === tab.key).length}
                  )
                </span>
              </button>
            ))}
          </div>

          {filteredBookings.length === 0 ? (
            <div className="card text-center py-12">
              <Calendar className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-secondary-900 mb-2">
                No bookings yet
              </h2>
              <p className="text-secondary-600">
                {filter === 'all'
                  ? 'Share your class links to start receiving bookings'
                  : `No ${filter} bookings`}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBookings.map((booking) => {
                const classInfo = booking.class as any
                const slots = booking.scheduled_slots as any[]

                return (
                  <div key={booking.id} className="card">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-secondary-900">
                            {classInfo?.title || 'Unknown Class'}
                          </h3>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              booking.status
                            )}`}
                          >
                            {booking.status}
                          </span>
                        </div>
                        <p className="text-secondary-600 text-sm">
                          {classInfo?.subject} • {classInfo?.duration} minutes
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <div className="flex items-center gap-2 text-secondary-600 mb-2">
                          <User className="w-4 h-4" />
                          <span className="font-medium">
                            {booking.student_name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-secondary-600">
                          <Mail className="w-4 h-4" />
                          <span className="text-sm">{booking.student_email}</span>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm text-secondary-600 mb-1">
                          Booked:{' '}
                          <span className="font-medium">
                            {formatDate(booking.created_at || '')}
                          </span>
                        </p>
                        <p className="text-sm text-secondary-600">
                          Sessions:{' '}
                          <span className="font-medium">
                            {booking.completed_sessions} / {booking.total_sessions} completed
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Start Session Button */}
                    {(() => {
                      const classroom = classrooms.find(c => c.booking_id === booking.id)
                      return classroom && (
                        <div className="mb-4">
                          <button
                            onClick={() => joinClassroom(classroom.room_url)}
                            className="btn-primary flex items-center gap-2 w-full justify-center"
                          >
                            <Video className="w-4 h-4" />
                            Start Session
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        </div>
                      )
                    })()}

                    {/* Scheduled Slots */}
                    <div className="bg-secondary-50 rounded-lg p-4">
                      <p className="text-sm font-medium text-secondary-900 mb-2">
                        Scheduled Sessions:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {slots.map((slot, index) => (
                          <div
                            key={index}
                            className="bg-white px-3 py-1 rounded-lg text-sm"
                          >
                            <span className="font-medium">{slot.day}</span> at{' '}
                            <span className="text-primary-600">{slot.time}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {booking.notes && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm text-secondary-600">
                          <strong>Student Notes:</strong> {booking.notes}
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

