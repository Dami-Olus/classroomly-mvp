'use client'

import { useEffect, useState } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import DashboardLayout from '@/components/DashboardLayout'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Calendar, Clock, BookOpen, User } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDate } from '@/lib/utils'
import type { BookingWithDetails } from '@/types'
import AddToCalendarButton from '@/components/AddToCalendarButton'

export default function StudentBookingsPage() {
  const { profile } = useAuth()
  const supabase = createClient()
  const [bookings, setBookings] = useState<BookingWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBookings()
  }, [profile])

  const loadBookings = async () => {
    if (!profile) return

    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          class:classes(
            title,
            subject,
            duration,
            tutor:tutors(
              user:profiles(
                first_name,
                last_name,
                profile_image
              )
            )
          )
        `)
        .eq('student_id', profile.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setBookings(data as any || [])
    } catch (error) {
      console.error('Error loading bookings:', error)
      toast.error('Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

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
      <ProtectedRoute requiredRole="student">
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
    <ProtectedRoute requiredRole="student">
      <DashboardLayout>
        <div>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-secondary-900 mb-2">
              My Bookings
            </h1>
            <p className="text-secondary-600">
              View and manage your tutoring sessions
            </p>
          </div>

          {bookings.length === 0 ? (
            <div className="card text-center py-12">
              <Calendar className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-secondary-900 mb-2">
                No bookings yet
              </h2>
              <p className="text-secondary-600">
                When you book tutoring sessions, they'll appear here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => {
                const classInfo = booking.class as any
                const tutor = classInfo?.tutor as any
                const tutorUser = tutor?.user
                const tutorName = tutorUser
                  ? `${tutorUser.first_name} ${tutorUser.last_name}`
                  : 'Unknown Tutor'
                const slots = booking.scheduled_slots as any[]

                return (
                  <div key={booking.id} className="card">
                    <div className="flex items-start gap-4 mb-4">
                      {tutorUser?.profile_image ? (
                        <img
                          src={tutorUser.profile_image}
                          alt={tutorName}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
                          <User className="w-8 h-8 text-primary-600" />
                        </div>
                      )}

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
                        <p className="text-secondary-600 text-sm mb-1">
                          with {tutorName}
                        </p>
                        <p className="text-secondary-600 text-sm">
                          {classInfo?.subject} • {classInfo?.duration} minutes
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-secondary-600">
                          Booked on
                        </p>
                        <p className="font-medium">
                          {formatDate(booking.created_at || '')}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-secondary-600">Progress</p>
                        <p className="font-medium">
                          {booking.completed_sessions} / {booking.total_sessions} sessions
                        </p>
                      </div>
                    </div>

                    {/* Scheduled Slots */}
                    <div className="bg-secondary-50 rounded-lg p-4">
                      <p className="text-sm font-medium text-secondary-900 mb-2">
                        Your Weekly Sessions:
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

