'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { BookOpen, Calendar, Users, Video, Loader2, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

interface DemoDataSetupProps {
  role: 'tutor' | 'student'
  onComplete?: () => void
}

export default function DemoDataSetup({ role, onComplete }: DemoDataSetupProps) {
  const { profile } = useAuth()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [completed, setCompleted] = useState(false)

  const setupTutorDemoData = async () => {
    if (!profile) return

    try {
      setLoading(true)

      // Get tutor profile
      const { data: tutorData } = await supabase
        .from('tutors')
        .select('id')
        .eq('user_id', profile.id)
        .single()

      if (!tutorData) {
        toast.error('Tutor profile not found')
        return
      }

      // Create demo class
      const { data: demoClass, error: classError } = await supabase
        .from('classes')
        .insert({
          tutor_id: tutorData.id,
          title: 'Mathematics Tutoring',
          subject: 'Mathematics',
          description: 'Comprehensive math tutoring for all levels',
          duration: 60,
          weekly_frequency: 3,
          price_per_session: 25.00,
          max_students: 1,
          booking_link: 'demo-math-tutoring',
          is_active: true
        })
        .select()
        .single()

      if (classError) throw classError

      // Create demo booking
      const { data: demoBooking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          class_id: demoClass.id,
          student_name: 'Demo Student',
          student_email: 'demo@example.com',
          status: 'confirmed',
          total_sessions: 4,
          completed_sessions: 1,
          start_date: new Date().toISOString().split('T')[0],
          notes: 'Demo booking for testing purposes'
        })
        .select()
        .single()

      if (bookingError) throw bookingError

      // Create demo sessions
      const sessions = [
        {
          booking_id: demoBooking.id,
          session_number: 1,
          scheduled_date: new Date().toISOString().split('T')[0],
          scheduled_time: '14:00',
          scheduled_day: 'Monday',
          duration: 60,
          status: 'completed'
        },
        {
          booking_id: demoBooking.id,
          session_number: 2,
          scheduled_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          scheduled_time: '14:00',
          scheduled_day: 'Monday',
          duration: 60,
          status: 'scheduled'
        },
        {
          booking_id: demoBooking.id,
          session_number: 3,
          scheduled_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          scheduled_time: '14:00',
          scheduled_day: 'Monday',
          duration: 60,
          status: 'scheduled'
        }
      ]

      for (const session of sessions) {
        await supabase
          .from('sessions')
          .insert(session)
      }

      // Create demo classroom for next session
      const nextSession = sessions[1]
      const { data: demoClassroom, error: classroomError } = await supabase
        .from('classrooms')
        .insert({
          booking_id: demoBooking.id,
          session_date: new Date(`${nextSession.scheduled_date}T${nextSession.scheduled_time}`).toISOString(),
          room_url: 'demo-classroom-123',
          status: 'scheduled',
          duration: 60
        })
        .select()
        .single()

      if (classroomError) throw classroomError

      // Update session with classroom
      await supabase
        .from('sessions')
        .update({ classroom_id: demoClassroom.id })
        .eq('booking_id', demoBooking.id)
        .eq('session_number', 2)

      setCompleted(true)
      toast.success('Demo data created successfully!')
      
      if (onComplete) {
        setTimeout(onComplete, 2000)
      }
    } catch (error: any) {
      console.error('Error setting up demo data:', error)
      toast.error(error.message || 'Failed to create demo data')
    } finally {
      setLoading(false)
    }
  }

  const setupStudentDemoData = async () => {
    if (!profile) return

    try {
      setLoading(true)

      // Create demo booking for student
      const { data: demoBooking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          student_id: profile.id,
          class_id: 'demo-class-id', // This would need to exist
          student_name: profile.first_name + ' ' + profile.last_name,
          student_email: profile.email,
          status: 'confirmed',
          total_sessions: 3,
          completed_sessions: 0,
          start_date: new Date().toISOString().split('T')[0],
          notes: 'Demo booking for testing purposes'
        })
        .select()
        .single()

      if (bookingError) throw bookingError

      setCompleted(true)
      toast.success('Demo data created successfully!')
      
      if (onComplete) {
        setTimeout(onComplete, 2000)
      }
    } catch (error: any) {
      console.error('Error setting up demo data:', error)
      toast.error(error.message || 'Failed to create demo data')
    } finally {
      setLoading(false)
    }
  }

  const handleSetup = () => {
    if (role === 'tutor') {
      setupTutorDemoData()
    } else {
      setupStudentDemoData()
    }
  }

  if (completed) {
    return (
      <div className="card bg-green-50 border-green-200">
        <div className="flex items-center space-x-3 mb-4">
          <CheckCircle className="w-6 h-6 text-green-600" />
          <h2 className="text-xl font-semibold text-green-900">
            🎉 Demo Data Created!
          </h2>
        </div>
        <p className="text-green-800 mb-4">
          Your dashboard now has sample data to help you explore the platform. 
          You can see how classes, bookings, and sessions work.
        </p>
        <div className="flex items-center space-x-2 text-sm text-green-700">
          <CheckCircle className="w-4 h-4" />
          <span>Demo class created</span>
        </div>
        <div className="flex items-center space-x-2 text-sm text-green-700 mt-1">
          <CheckCircle className="w-4 h-4" />
          <span>Sample bookings added</span>
        </div>
        <div className="flex items-center space-x-2 text-sm text-green-700 mt-1">
          <CheckCircle className="w-4 h-4" />
          <span>Demo sessions scheduled</span>
        </div>
      </div>
    )
  }

  return (
    <div className="card bg-blue-50 border-blue-200">
      <div className="flex items-center space-x-3 mb-4">
        <BookOpen className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-blue-900">
          🚀 See ClassroomLY in Action
        </h2>
      </div>
      
      <p className="text-blue-800 mb-4">
        {role === 'tutor' 
          ? 'Get a quick preview of how ClassroomLY works by adding some demo data to your account.'
          : 'See how your dashboard will look with sample bookings and sessions.'
        }
      </p>

      <div className="space-y-3 mb-6">
        <div className="flex items-center space-x-3">
          <Calendar className="w-5 h-5 text-blue-600" />
          <span className="text-blue-800">
            {role === 'tutor' ? 'Demo class with sample bookings' : 'Sample tutoring sessions'}
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <Users className="w-5 h-5 text-blue-600" />
          <span className="text-blue-800">
            {role === 'tutor' ? 'Virtual classroom setup' : 'Student dashboard preview'}
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <Video className="w-5 h-5 text-blue-600" />
          <span className="text-blue-800">
            {role === 'tutor' ? 'Session management tools' : 'Classroom access'}
          </span>
        </div>
      </div>

      <div className="flex space-x-3">
        <button
          onClick={handleSetup}
          disabled={loading}
          className="btn-primary flex items-center space-x-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Creating Demo Data...</span>
            </>
          ) : (
            <>
              <BookOpen className="w-4 h-4" />
              <span>Add Demo Data</span>
            </>
          )}
        </button>
        
        <button
          onClick={onComplete}
          className="btn-secondary"
        >
          Skip for Now
        </button>
      </div>

      <p className="text-xs text-blue-600 mt-3">
        You can always remove demo data later from your account settings.
      </p>
    </div>
  )
}
