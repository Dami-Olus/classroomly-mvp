'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { BookOpen, Loader2, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

interface DemoDataButtonProps {
  role: 'tutor' | 'student'
  onComplete?: () => void
}

export default function DemoDataButton({ role, onComplete }: DemoDataButtonProps) {
  const { profile } = useAuth()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [showRemoveOption, setShowRemoveOption] = useState(false)
  const [isRemovalMode, setIsRemovalMode] = useState(false)

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

      // Generate unique booking link to avoid conflicts
      const uniqueBookingLink = `demo-math-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`

      // Create demo class with unique booking link
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
          booking_link: uniqueBookingLink, // Use unique booking link
          is_active: true
        })
        .select()
        .single()

      if (classError) {
        console.error('Error creating demo class:', classError)
        throw new Error(`Failed to create demo class: ${classError.message}`)
      }

      // Create demo booking
      const { data: demoBooking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          class_id: demoClass.id,
          tutor_id: tutorData.id,
          student_name: 'Demo Student',
          student_email: 'demo@example.com',
          status: 'confirmed',
          total_sessions: 4,
          completed_sessions: 1,
          scheduled_slots: [
            { day: 'Monday', time: '14:00' },
            { day: 'Wednesday', time: '14:00' }
          ],
          sessions_per_week: 2,
          start_date: new Date().toISOString().split('T')[0],
          notes: 'Demo booking for testing purposes'
        })
        .select()
        .single()

      if (bookingError) {
        console.error('Error creating demo booking:', bookingError)
        throw new Error(`Failed to create demo booking: ${bookingError.message}`)
      }

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
        const { error: sessionError } = await supabase
          .from('sessions')
          .insert(session)

        if (sessionError) {
          console.error('Error creating demo session:', sessionError)
          // Continue with other sessions even if one fails
        }
      }

      // Create demo classroom for next session
      const nextSession = sessions[1]
      const { data: demoClassroom, error: classroomError } = await supabase
        .from('classrooms')
        .insert({
          booking_id: demoBooking.id,
          session_date: new Date(`${nextSession.scheduled_date}T${nextSession.scheduled_time}`).toISOString(),
          room_url: `demo-classroom-${Date.now()}`,
          status: 'scheduled',
          duration: 60
        })
        .select()
        .single()

      if (classroomError) {
        console.error('Error creating demo classroom:', classroomError)
        // Don't throw error, demo data is still useful without classroom
      } else {
        // Update session with classroom
        await supabase
          .from('sessions')
          .update({ classroom_id: demoClassroom.id })
          .eq('booking_id', demoBooking.id)
          .eq('session_number', 2)
      }

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

      // For students, we can't create demo data without a tutor
      // Instead, show them how to get started
      toast('Ask your tutor for a booking link to get started!', {
        icon: 'ℹ️',
        duration: 4000,
      })
      
      setCompleted(true)
      
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

  const removeDemoData = async () => {
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

      // Find demo classes (those with booking_link starting with 'demo-math-')
      const { data: demoClasses, error: classesError } = await supabase
        .from('classes')
        .select('id')
        .eq('tutor_id', tutorData.id)
        .like('booking_link', 'demo-math-%')

      if (classesError) {
        console.error('Error finding demo classes:', classesError)
        throw new Error(`Failed to find demo classes: ${classesError.message}`)
      }

      if (!demoClasses || demoClasses.length === 0) {
        toast('No demo data found to remove', {
          icon: 'ℹ️',
          duration: 4000,
        })
        return
      }

      const classIds = demoClasses.map(c => c.id)

      // Delete demo bookings
      const { error: bookingsError } = await supabase
        .from('bookings')
        .delete()
        .in('class_id', classIds)

      if (bookingsError) {
        console.error('Error deleting demo bookings:', bookingsError)
        // Continue with other deletions even if this fails
      }

      // Delete demo sessions
      const { error: sessionsError } = await supabase
        .from('sessions')
        .delete()
        .in('booking_id', 
          await supabase
            .from('bookings')
            .select('id')
            .in('class_id', classIds)
            .then(({ data }) => data?.map(b => b.id) || [])
        )

      if (sessionsError) {
        console.error('Error deleting demo sessions:', sessionsError)
        // Continue with other deletions even if this fails
      }

      // Delete demo classrooms
      const { error: classroomsError } = await supabase
        .from('classrooms')
        .delete()
        .in('booking_id', 
          await supabase
            .from('bookings')
            .select('id')
            .in('class_id', classIds)
            .then(({ data }) => data?.map(b => b.id) || [])
        )

      if (classroomsError) {
        console.error('Error deleting demo classrooms:', classroomsError)
        // Continue with other deletions even if this fails
      }

      // Delete demo classes
      const { error: classesDeleteError } = await supabase
        .from('classes')
        .delete()
        .in('id', classIds)

      if (classesDeleteError) {
        console.error('Error deleting demo classes:', classesDeleteError)
        throw new Error(`Failed to delete demo classes: ${classesDeleteError.message}`)
      }

      toast.success('Demo data removed successfully!')
      setCompleted(false)
      setShowRemoveOption(false)
      setIsRemovalMode(false)
      
      if (onComplete) {
        setTimeout(onComplete, 2000)
      }
    } catch (error: any) {
      console.error('Error removing demo data:', error)
      toast.error(error.message || 'Failed to remove demo data')
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

  if (completed || isRemovalMode) {
    return (
      <div className="card bg-green-50 border-green-200">
        <div className="flex items-center space-x-3 mb-4">
          <CheckCircle className="w-6 h-6 text-green-600" />
          <h2 className="text-xl font-semibold text-green-900">
            {isRemovalMode ? '🧹 Remove Demo Data' : '🎉 Demo Data Created!'}
          </h2>
        </div>
        <p className="text-green-800 mb-4">
          {isRemovalMode 
            ? 'Remove the demo data from your account to clean up your dashboard.'
            : 'Your dashboard now has sample data to help you explore the platform. You can see how classes, bookings, and sessions work.'
          }
        </p>
        {!isRemovalMode && (
          <>
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
          </>
        )}
        
        <div className="mt-4 pt-4 border-t border-green-200">
          {!isRemovalMode ? (
            <button
              onClick={() => setIsRemovalMode(true)}
              className="text-sm text-green-700 hover:text-green-800 underline"
            >
              Remove Demo Data
            </button>
          ) : (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800 mb-3">
                This will permanently delete all demo data including classes, bookings, and sessions.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={removeDemoData}
                  disabled={loading}
                  className="btn-secondary text-sm bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Removing...
                    </>
                  ) : (
                    'Yes, Remove Demo Data'
                  )}
                </button>
                <button
                  onClick={() => setIsRemovalMode(false)}
                  className="btn-secondary text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
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
          <BookOpen className="w-5 h-5 text-blue-600" />
          <span className="text-blue-800">
            {role === 'tutor' ? 'Demo class with sample bookings' : 'Sample tutoring sessions'}
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <BookOpen className="w-5 h-5 text-blue-600" />
          <span className="text-blue-800">
            {role === 'tutor' ? 'Virtual classroom setup' : 'Student dashboard preview'}
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <BookOpen className="w-5 h-5 text-blue-600" />
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
      </div>

      <p className="text-xs text-blue-600 mt-3">
        You can always remove demo data later from your account settings.
      </p>
    </div>
  )
}
