'use client'

import { useEffect, useState } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import DashboardLayout from '@/components/DashboardLayout'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { BookOpen, Calendar, Users, TrendingUp, Video, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { formatDate } from '@/lib/utils'

export default function TutorDashboard() {
  const { profile } = useAuth()
  const supabase = createClient()
  const [activeClasses, setActiveClasses] = useState<any[]>([])
  const [totalBookings, setTotalBookings] = useState<any[]>([])
  const [activeClassrooms, setActiveClassrooms] = useState<any[]>([])
  const [uniqueStudents, setUniqueStudents] = useState(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile) {
      loadDashboardData()
    }
  }, [profile])

  const loadDashboardData = async () => {
    try {
      // Get tutor profile
      const { data: tutorData } = await supabase
        .from('tutors')
        .select('id')
        .eq('user_id', profile?.id)
        .single()

      if (!tutorData) return

      // Load active classes
      const { data: classes } = await supabase
        .from('classes')
        .select('id, title, is_active')
        .eq('tutor_id', tutorData.id)
        .eq('is_active', true)

      // Load all bookings for this tutor
      const { data: bookings } = await supabase
        .from('bookings')
        .select(`
          *,
          class:classes(
            title,
            subject,
            duration,
            tutor_id
          )
        `)
        .in('class_id', classes?.map(c => c.id) || [])

      // Load active classrooms for this tutor
      const { data: classrooms } = await supabase
        .from('classrooms')
        .select(`
          *,
          bookings!inner (
            *,
            classes!inner (
              title,
              subject,
              duration,
              tutor_id
            )
          )
        `)
        .eq('bookings.classes.tutor_id', tutorData.id)
        .in('status', ['live', 'scheduled'])

      const tutorClassrooms = classrooms || []

      // Get unique students
      const studentIds = new Set(bookings?.map(b => b.student_id) || [])

      setActiveClasses(classes || [])
      setTotalBookings(bookings || [])
      setActiveClassrooms(tutorClassrooms)
      setUniqueStudents(studentIds)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const joinClassroom = (roomUrl: string) => {
    window.open(`/classroom/${roomUrl}`, '_blank')
  }

  return (
    <ProtectedRoute requiredRole="tutor">
      <DashboardLayout>
        <div>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-secondary-900 mb-2">
              Welcome back, {profile?.first_name}!
            </h1>
            <p className="text-secondary-600">
              Here's an overview of your tutoring activity
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <StatCard
              icon={<BookOpen className="w-6 h-6 text-primary-600" />}
              title="Active Classes"
              value={activeClasses.length.toString()}
              change="+0%"
            />
            <StatCard
              icon={<Calendar className="w-6 h-6 text-green-600" />}
              title="Total Bookings"
              value={totalBookings.length.toString()}
              change="+0%"
            />
            <StatCard
              icon={<Users className="w-6 h-6 text-blue-600" />}
              title="Students"
              value={uniqueStudents.size.toString()}
              change="+0%"
            />
            <StatCard
              icon={<Video className="w-6 h-6 text-purple-600" />}
              title="Active Classrooms"
              value={activeClassrooms.length.toString()}
              change="+0%"
            />
            <StatCard
              icon={<TrendingUp className="w-6 h-6 text-gray-600" />}
              title="Completed Sessions"
              value={totalBookings.filter(b => b.status === 'completed').length.toString()}
              change="+0%"
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
                  const studentName = booking?.student_name || 'Student'

                  return (
                    <div key={classroom.id} className="bg-secondary-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                            <Video className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-secondary-900">
                              {classInfo?.title || 'Tutoring Session'}
                            </h3>
                            <p className="text-sm text-secondary-600">
                              with {studentName} • {classInfo?.subject}
                            </p>
                            <p className="text-xs text-secondary-500">
                              Status: {classroom.status}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => joinClassroom(classroom.room_url)}
                          className="btn-primary flex items-center gap-2"
                        >
                          <Video className="w-4 h-4" />
                          Start Session
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="card mb-8">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                href="/tutor/classes/create"
                className="btn-primary text-center"
              >
                Create New Class
              </Link>
              <Link
                href="/tutor/classes"
                className="btn-secondary text-center"
              >
                View My Classes
              </Link>
              <Link
                href="/tutor/bookings"
                className="btn-secondary text-center"
              >
                View Bookings
              </Link>
            </div>
          </div>

          {/* Getting Started */}
          <div className="card bg-primary-50 border-primary-200">
            <h2 className="text-xl font-semibold text-primary-900 mb-4">
              🚀 Getting Started
            </h2>
            <div className="space-y-3">
              <Step
                number={1}
                text="Complete your tutor profile"
                href="/tutor/profile"
              />
              <Step
                number={2}
                text="Set your general availability"
                href="/tutor/availability"
              />
              <Step
                number={3}
                text="Create your first class"
                href="/tutor/classes/create"
              />
              <Step
                number={4}
                text="Share your booking link with students"
                href="/tutor/classes"
              />
            </div>
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
  change,
}: {
  icon: React.ReactNode
  title: string
  value: string
  change: string
}) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-2">
        {icon}
        <span className="text-xs text-green-600 font-medium">{change}</span>
      </div>
      <p className="text-2xl font-bold text-secondary-900 mb-1">{value}</p>
      <p className="text-sm text-secondary-600">{title}</p>
    </div>
  )
}

function Step({
  number,
  text,
  href,
}: {
  number: number
  text: string
  href: string
}) {
  return (
    <div className="flex items-center space-x-3">
      <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
        {number}
      </div>
      <Link
        href={href}
        className="text-primary-900 hover:text-primary-700 font-medium"
      >
        {text}
      </Link>
    </div>
  )
}

