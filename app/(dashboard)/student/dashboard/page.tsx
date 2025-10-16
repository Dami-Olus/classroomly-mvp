'use client'

import { useEffect, useState } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import DashboardLayout from '@/components/DashboardLayout'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { Calendar, BookOpen, Clock, Video, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDate } from '@/lib/utils'

export default function StudentDashboard() {
  const { profile } = useAuth()
  const supabase = createClient()
  const [upcomingBookings, setUpcomingBookings] = useState<any[]>([])
  const [activeClassrooms, setActiveClassrooms] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalBookings: 0,
    completedSessions: 0,
    upcomingSessions: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile) {
      loadDashboardData()
    }
  }, [profile])

  const loadDashboardData = async () => {
    if (!profile?.id) {
      console.error('No profile found for student')
      toast.error('Profile not found. Please try logging in again.')
      setLoading(false)
      return
    }

    try {
      console.log('Loading dashboard data for student:', profile?.id)
      
      // Test database connection first
      const { data: testData, error: testError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', profile.id)
        .single()
      
      if (testError) {
        console.error('Database connection test failed:', testError)
        throw new Error(`Database connection failed: ${testError.message}`)
      }
      
      console.log('Database connection successful')
      
      // Load upcoming bookings (simplified query)
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('*, classes(title, subject, duration, tutor_id)')
        .eq('student_id', profile?.id)
        .in('status', ['confirmed', 'rescheduled'])
        .order('created_at', { ascending: false })
        .limit(5)

      if (bookingsError) {
        console.error('Error loading bookings:', bookingsError)
        // Don't throw error for empty results, just log and continue
        if (bookingsError.code !== 'PGRST116') {
          console.error('Bookings error details:', {
            code: bookingsError.code,
            message: bookingsError.message,
            details: bookingsError.details,
            hint: bookingsError.hint
          })
          throw bookingsError
        }
      }

      // Get tutor details for bookings
      const bookingsWithTutors = await Promise.all(
        (bookings || []).map(async (booking: any) => {
          if (booking.classes?.tutor_id) {
            const { data: tutor } = await supabase
              .from('tutors')
              .select('user_id')
              .eq('id', booking.classes.tutor_id)
              .single()

            if (tutor?.user_id) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('first_name, last_name, profile_image')
                .eq('id', tutor.user_id)
                .single()

              return {
                ...booking,
                classes: {
                  ...booking.classes,
                  tutor: {
                    user: profile
                  }
                }
              }
            }
          }
          return booking
        })
      )

      // Load active classrooms for this student (simplified)
      const { data: classrooms, error: classroomsError } = await supabase
        .from('classrooms')
        .select('*, booking_id')
        .in('status', ['live', 'scheduled'])
        .order('created_at', { ascending: false })

      if (classroomsError) {
        console.error('Error loading classrooms:', classroomsError)
        // Don't throw error for empty results, just log and continue
        if (classroomsError.code !== 'PGRST116') {
          throw classroomsError
        }
      }

      // Filter classrooms for this student by checking booking
      const studentClassrooms = await Promise.all(
        (classrooms || []).map(async (classroom: any) => {
          const { data: booking } = await supabase
            .from('bookings')
            .select('*, classes(title, subject, duration, tutor_id)')
            .eq('id', classroom.booking_id)
            .eq('student_id', profile?.id)
            .single()

          if (booking) {
            // Get tutor info
            if (booking.classes?.tutor_id) {
              const { data: tutor } = await supabase
                .from('tutors')
                .select('user_id')
                .eq('id', booking.classes.tutor_id)
                .single()

              if (tutor?.user_id) {
                const { data: tutorProfile } = await supabase
                  .from('profiles')
                  .select('first_name, last_name, profile_image')
                  .eq('id', tutor.user_id)
                  .single()

                return {
                  ...classroom,
                  bookings: {
                    ...booking,
                    classes: {
                      ...booking.classes,
                      tutors: {
                        profiles: tutorProfile
                      }
                    }
                  }
                }
              }
            }
            return {
              ...classroom,
              bookings: booking
            }
          }
          return null
        })
      )

      const filteredClassrooms = studentClassrooms.filter(c => c !== null)

      setUpcomingBookings(bookingsWithTutors || [])
      setActiveClassrooms(filteredClassrooms)

      // Calculate stats
      const { data: allBookings, error: statsError } = await supabase
        .from('bookings')
        .select('status, total_sessions, completed_sessions')
        .eq('student_id', profile?.id)

      if (statsError) {
        console.error('Error loading stats:', statsError)
        // Don't throw error for empty results, just log and continue
        if (statsError.code !== 'PGRST116') {
          throw statsError
        }
      }

      const totalBookings = allBookings?.length || 0
      const completedSessions = allBookings?.reduce((sum, b) => sum + (b.completed_sessions || 0), 0) || 0
      const upcomingSessions = allBookings?.filter(b => b.status === 'confirmed' || b.status === 'rescheduled').length || 0

      setStats({
        totalBookings,
        completedSessions,
        upcomingSessions,
      })
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      // Show more specific error message
      if (error instanceof Error) {
        toast.error(`Failed to load dashboard data: ${error.message}`)
      } else {
        toast.error('Failed to load dashboard data')
      }
    } finally {
      setLoading(false)
    }
  }

  const joinClassroom = (roomUrl: string) => {
    window.open(`/classroom/${roomUrl}`, '_blank')
  }

  return (
    <ProtectedRoute requiredRole="student">
      <DashboardLayout>
        <div>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-secondary-900 mb-2">
              Welcome back, {profile?.first_name}!
            </h1>
            <p className="text-secondary-600">
              Manage your tutoring sessions and track your progress
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <StatCard
              icon={<BookOpen className="w-6 h-6 text-primary-600" />}
              title="Total Bookings"
              value={stats.totalBookings.toString()}
            />
            <StatCard
              icon={<Calendar className="w-6 h-6 text-green-600" />}
              title="Upcoming Sessions"
              value={stats.upcomingSessions.toString()}
            />
            <StatCard
              icon={<Video className="w-6 h-6 text-blue-600" />}
              title="Active Classrooms"
              value={activeClassrooms.length.toString()}
            />
            <StatCard
              icon={<Clock className="w-6 h-6 text-orange-600" />}
              title="Completed Sessions"
              value={stats.completedSessions.toString()}
            />
          </div>

          {/* Active Classrooms */}
          {activeClassrooms.length > 0 && (
            <div className="card mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Active Classrooms</h2>
                <span className="text-sm text-secondary-600">
                  {activeClassrooms.length} session(s)
                </span>
              </div>
              <div className="space-y-3">
                {activeClassrooms.map((classroom) => {
                  const booking = classroom.bookings
                  const classInfo = booking?.classes
                  const tutor = classInfo?.tutors?.profiles
                  const tutorName = tutor 
                    ? `${tutor.first_name} ${tutor.last_name}`
                    : 'Unknown Tutor'

                  return (
                    <div key={classroom.id} className="bg-secondary-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Video className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-secondary-900">
                              {classInfo?.title || 'Tutoring Session'}
                            </h3>
                            <p className="text-sm text-secondary-600">
                              with {tutorName} • {classInfo?.subject}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => joinClassroom(classroom.room_url)}
                          className="btn-primary flex items-center gap-2"
                        >
                          <Video className="w-4 h-4" />
                          Join Classroom
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Upcoming Sessions */}
          <div className="card mb-8">
            <h2 className="text-xl font-semibold mb-4">Recent Bookings</h2>
            {upcomingBookings.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
                <p className="text-secondary-600 mb-4">
                  You don't have any upcoming sessions
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingBookings.map((booking) => {
                  const classInfo = booking.class
                  const tutor = classInfo?.tutor?.user
                  const tutorName = tutor 
                    ? `${tutor.first_name} ${tutor.last_name}`
                    : 'Unknown Tutor'

                  return (
                    <div key={booking.id} className="bg-secondary-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-secondary-900">
                              {classInfo?.title || 'Tutoring Session'}
                            </h3>
                            <p className="text-sm text-secondary-600">
                              with {tutorName} • {classInfo?.subject}
                            </p>
                            <p className="text-xs text-secondary-500">
                              Booked {formatDate(booking.created_at)}
                            </p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          booking.status === 'confirmed' 
                            ? 'bg-green-100 text-green-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {booking.status}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Getting Started */}
          <div className="card bg-primary-50 border-primary-200">
            <h2 className="text-xl font-semibold text-primary-900 mb-4">
              🎯 Get Started
            </h2>
            <p className="text-primary-800 mb-4">
              Receive a booking link from your tutor to schedule your first
              session!
            </p>
            <p className="text-sm text-primary-700">
              When a tutor shares their class link with you, you can book
              sessions instantly without any complex setup.
            </p>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

function StatCard({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode
  title: string
  value: string
}) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-2">{icon}</div>
      <p className="text-2xl font-bold text-secondary-900 mb-1">{value}</p>
      <p className="text-sm text-secondary-600">{title}</p>
    </div>
  )
}

