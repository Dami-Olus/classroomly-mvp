'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'
import DashboardLayout from '@/components/DashboardLayout'
import SessionNotesView from '@/components/SessionNotesView'
import MaterialsList from '@/components/MaterialsList'
import SessionRescheduleModal from '@/components/SessionRescheduleModal'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { 
  Calendar, 
  Clock, 
  User, 
  BookOpen, 
  Video,
  ArrowLeft,
  Mail
} from 'lucide-react'
import toast from 'react-hot-toast'
import { formatSessionDateTime, getSessionStatusColor } from '@/lib/sessions'

export default function StudentSessionDetailPage() {
  const params = useParams()
  const { profile } = useAuth()
  const supabase = createClient()
  
  const bookingId = params.id as string
  const sessionId = params.sessionId as string
  
  const [session, setSession] = useState<any>(null)
  const [booking, setBooking] = useState<any>(null)
  const [materials, setMaterials] = useState<any[]>([])
  const [notes, setNotes] = useState<any>(null)
  const [tutor, setTutor] = useState<any>(null)
  const [tutorId, setTutorId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [showRescheduleModal, setShowRescheduleModal] = useState(false)

  useEffect(() => {
    loadSessionData()
  }, [sessionId])

  const handleRescheduleSuccess = () => {
    setShowRescheduleModal(false)
    loadSessionData()
  }

  const handleStartSession = async () => {
    setStarting(true)
    try {
      if (!session) {
        toast.error('Session data not loaded')
        return
      }

      // Create classroom for this session
      const sessionDateTime = new Date(`${session.scheduled_date}T${session.scheduled_time}`)
      
      const { data: classroom, error } = await supabase
        .from('classrooms')
        .insert({
          session_id: sessionId,
          booking_id: bookingId,
          session_date: sessionDateTime.toISOString(),
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

      toast.success('Session started! Joining classroom...')
      
      // Reload data to get updated classroom_id
      await loadSessionData()
      
      // Open classroom in new tab
      window.open(`/classroom/${classroom.id}`, '_blank')
    } catch (error: any) {
      console.error('Error starting session:', error)
      toast.error(error.message || 'Failed to start session')
    } finally {
      setStarting(false)
    }
  }

  const loadSessionData = async () => {
    try {
      // Load session with classroom info
      // Use !sessions_classroom_id_fkey to specify which relationship to use
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .select(`
          *,
          classroom:classrooms!sessions_classroom_id_fkey(
            id,
            room_url,
            status
          )
        `)
        .eq('id', sessionId)
        .single()

      if (sessionError) {
        console.error('Session load error:', sessionError)
        throw sessionError
      }
      
      if (!sessionData) {
        throw new Error('Session not found')
      }
      
      setSession(sessionData)

      // Load booking with class info
      const { data: bookingData, error: bookingError } = await supabase
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
        .eq('id', bookingId)
        .single()

      if (bookingError) throw bookingError
      setBooking(bookingData)

      // Load tutor info
      if (bookingData.class?.tutor_id) {
        setTutorId(bookingData.class.tutor_id)
        
        const { data: tutorData } = await supabase
          .from('tutors')
          .select('user_id')
          .eq('id', bookingData.class.tutor_id)
          .single()

        if (tutorData?.user_id) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('first_name, last_name, email')
            .eq('id', tutorData.user_id)
            .single()

          setTutor(profileData)
        }
      }

      // Load session materials (both session-specific and booking-level)
      const { data: materialsData } = await supabase
        .from('materials')
        .select(`
          *,
          uploader:profiles!uploaded_by(
            first_name,
            last_name
          )
        `)
        .or(`session_id.eq.${sessionId},and(booking_id.eq.${bookingId},session_id.is.null)`)
        .order('created_at', { ascending: false })

      setMaterials(materialsData || [])

      // Load session notes (excluding private notes for students)
      const { data: notesData } = await supabase
        .from('session_notes')
        .select('*')
        .eq('session_id', sessionId)
        .single()

      setNotes(notesData)
    } catch (error: any) {
      console.error('Error loading session:', error)
      console.error('Error details:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        sessionId,
        bookingId
      })
      toast.error(error?.message || 'Failed to load session details')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute requiredRole="student">
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  if (!session || !booking) {
    return (
      <ProtectedRoute requiredRole="student">
        <DashboardLayout>
          <div className="text-center py-12">
            <p className="text-gray-600">Session not found</p>
            <Link href={`/student/bookings/${bookingId}`} className="btn-primary mt-4">
              Back to Booking
            </Link>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  const isCompleted = session.status === 'completed'
  const canJoin = session.classroom_id && (session.status === 'scheduled' || session.status === 'rescheduled')
  const canStart = !session.classroom_id && !isCompleted && (session.status === 'scheduled' || session.status === 'rescheduled')
  const canReschedule = !isCompleted && (session.status === 'scheduled' || session.status === 'rescheduled')

  return (
    <ProtectedRoute requiredRole="student">
      <DashboardLayout>
        <div>
          {/* Header */}
          <div className="mb-6">
            <Link 
              href={`/student/bookings/${bookingId}`}
              className="text-primary-600 hover:text-primary-700 inline-flex items-center gap-2 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Booking
            </Link>
            
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Session {session.session_number}
                </h1>
                <p className="text-gray-600">{booking.class.title}</p>
              </div>
              
              <span className={`px-4 py-2 rounded-full font-medium ${getSessionStatusColor(session.status)}`}>
                {session.status}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Session Details */}
              <div className="card">
                <h2 className="text-xl font-semibold mb-4">Session Details</h2>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-gray-700">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <span className="font-medium">Date:</span>
                    <span>{formatSessionDateTime(session.scheduled_date, session.scheduled_time, session.scheduled_day)}</span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-gray-700">
                    <Clock className="w-5 h-5 text-gray-400" />
                    <span className="font-medium">Duration:</span>
                    <span>{session.duration} minutes</span>
                  </div>
                  
                  {tutor && (
                    <>
                      <div className="flex items-center gap-3 text-gray-700">
                        <User className="w-5 h-5 text-gray-400" />
                        <span className="font-medium">Tutor:</span>
                        <span>{tutor.first_name} {tutor.last_name}</span>
                      </div>
                      
                      <div className="flex items-center gap-3 text-gray-700">
                        <Mail className="w-5 h-5 text-gray-400" />
                        <span className="font-medium">Contact:</span>
                        <span>{tutor.email}</span>
                      </div>
                    </>
                  )}
                  
                  <div className="flex items-center gap-3 text-gray-700">
                    <BookOpen className="w-5 h-5 text-gray-400" />
                    <span className="font-medium">Subject:</span>
                    <span>{booking.class.subject}</span>
                  </div>
                </div>
              </div>

              {/* Session Materials */}
              <div className="card">
                <h2 className="text-xl font-semibold mb-4">Session Materials</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Materials for this session. 📚 Booking-level materials are available across all sessions.
                </p>
                
                {materials.length > 0 ? (
                  <MaterialsList 
                    bookingId={bookingId}
                    sessionId={sessionId}
                    materials={materials}
                    showMaterialType={true}
                  />
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No materials uploaded yet</p>
                    <p className="text-sm mt-2">Your tutor will upload materials here</p>
                  </div>
                )}
              </div>

              {/* Session Notes */}
              {notes && (
                <div className="card">
                  <h2 className="text-xl font-semibold mb-4">Session Notes</h2>
                  <SessionNotesView note={notes} showPrivateNotes={false} />
                </div>
              )}

              {!notes && isCompleted && (
                <div className="card">
                  <h2 className="text-xl font-semibold mb-4">Session Notes</h2>
                  <div className="text-center py-8 text-gray-500">
                    <p>No notes added yet</p>
                    <p className="text-sm mt-2">Your tutor will add notes after the session</p>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Actions */}
              <div className="card">
                <h3 className="font-semibold mb-4">Actions</h3>
                <div className="space-y-2">
                  {canStart && (
                    <button
                      onClick={handleStartSession}
                      disabled={starting}
                      className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Video className="w-4 h-4" />
                      {starting ? 'Starting...' : 'Start Session'}
                    </button>
                  )}
                  
                  {canJoin && session.classroom?.room_url && (
                    <Link
                      href={`/classroom/${session.classroom.room_url}`}
                      target="_blank"
                      className="w-full btn-primary flex items-center justify-center gap-2"
                    >
                      <Video className="w-4 h-4" />
                      Join Classroom
                    </Link>
                  )}
                  
                  {canReschedule && (
                    <button
                      onClick={() => setShowRescheduleModal(true)}
                      className="w-full btn-secondary flex items-center justify-center gap-2"
                    >
                      <Calendar className="w-4 h-4" />
                      Request Reschedule
                    </button>
                  )}
                  
                  {!canJoin && !canStart && !isCompleted && (
                    <div className="text-sm text-gray-600 p-3 bg-gray-50 rounded-lg">
                      Session is being prepared. Refresh the page to check status.
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Info */}
              <div className="card bg-primary-50 border-primary-200">
                <h3 className="font-semibold text-primary-900 mb-3">Quick Info</h3>
                <div className="space-y-2 text-sm text-primary-800">
                  <p>Session: {session.session_number} of {booking.total_sessions || 'ongoing'}</p>
                  <p>Status: {session.status}</p>
                  {isCompleted && session.completed_at && (
                    <p>Completed: {new Date(session.completed_at).toLocaleDateString()}</p>
                  )}
                  {session.cancellation_reason && (
                    <p className="text-red-700">
                      <strong>Cancellation:</strong> {session.cancellation_reason}
                    </p>
                  )}
                </div>
              </div>

              {/* Help */}
              <div className="card bg-blue-50 border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-2">Need Help?</h3>
                <p className="text-sm text-blue-800">
                  If you need to reschedule or have questions, please contact your tutor directly.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Reschedule Modal */}
        {showRescheduleModal && tutorId && session && (
          <SessionRescheduleModal
            bookingId={bookingId}
            sessionId={sessionId}
            currentSession={{
              scheduled_date: session.scheduled_date,
              scheduled_time: session.scheduled_time,
              scheduled_day: session.scheduled_day
            }}
            tutorId={tutorId}
            onClose={() => setShowRescheduleModal(false)}
            onSuccess={handleRescheduleSuccess}
            currentUserId={profile?.id || ''}
            userRole="student"
          />
        )}
      </DashboardLayout>
    </ProtectedRoute>
  )
}

