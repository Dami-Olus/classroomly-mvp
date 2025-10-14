'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'
import DashboardLayout from '@/components/DashboardLayout'
import SessionNotesForm from '@/components/SessionNotesForm'
import SessionNotesView from '@/components/SessionNotesView'
import MaterialsList from '@/components/MaterialsList'
import FileUpload from '@/components/FileUpload'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { 
  Calendar, 
  Clock, 
  User, 
  BookOpen, 
  Video, 
  Edit, 
  CheckCircle,
  XCircle,
  ArrowLeft,
  FileText
} from 'lucide-react'
import toast from 'react-hot-toast'
import { formatSessionDateTime, getSessionStatusColor, updateSessionStatus, rescheduleSession } from '@/lib/sessions'

export default function TutorSessionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { profile } = useAuth()
  const supabase = createClient()
  
  const bookingId = params.id as string
  const sessionId = params.sessionId as string
  
  const [session, setSession] = useState<any>(null)
  const [booking, setBooking] = useState<any>(null)
  const [materials, setMaterials] = useState<any[]>([])
  const [notes, setNotes] = useState<any>(null)
  const [tutorId, setTutorId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showNotesForm, setShowNotesForm] = useState(false)
  const [showReschedule, setShowReschedule] = useState(false)
  const [rescheduleData, setRescheduleData] = useState({
    date: '',
    time: '',
    day: ''
  })

  useEffect(() => {
    loadSessionData()
  }, [sessionId])

  const loadSessionData = async () => {
    try {
      // Get tutor ID for current user (always fetch fresh)
      let currentTutorId = tutorId
      if (profile && !currentTutorId) {
        const { data: tutorData } = await supabase
          .from('tutors')
          .select('id')
          .eq('user_id', profile.id)
          .single()
        
        if (tutorData) {
          currentTutorId = tutorData.id
          setTutorId(tutorData.id)
        }
      }

      // Load session
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
        .single()

      if (sessionError) throw sessionError
      setSession(sessionData)

      // Load booking with class info
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .select(`
          *,
          class:classes(
            title,
            subject,
            duration
          )
        `)
        .eq('id', bookingId)
        .single()

      if (bookingError) throw bookingError
      setBooking(bookingData)

      // Load session materials
      const { data: materialsData } = await supabase
        .from('session_materials')
        .select('*')
        .eq('session_id', sessionId)

      setMaterials(materialsData || [])

      // Load session notes
      const { data: notesData } = await supabase
        .from('session_notes')
        .select('*')
        .eq('session_id', sessionId)
        .single()

      setNotes(notesData)

      // Initialize reschedule data
      if (sessionData) {
        setRescheduleData({
          date: sessionData.scheduled_date,
          time: sessionData.scheduled_time,
          day: sessionData.scheduled_day
        })
      }
    } catch (error) {
      console.error('Error loading session:', error)
      toast.error('Failed to load session details')
    } finally {
      setLoading(false)
    }
  }

  const handleStartSession = async () => {
    try {
      if (!session) {
        toast.error('Session data not loaded')
        return
      }

      // Create classroom for this session
      // Combine scheduled_date and scheduled_time to create session_date timestamp
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

      toast.success('Classroom created! Opening...')
      window.open(`/classroom/${classroom.room_url}`, '_blank')
      
      // Reload to show updated classroom
      loadSessionData()
    } catch (error) {
      console.error('Error starting session:', error)
      toast.error('Failed to start session')
    }
  }

  const handleCompleteSession = async () => {
    try {
      await updateSessionStatus(sessionId, 'completed')
      toast.success('Session marked as completed')
      setShowNotesForm(true)
      loadSessionData()
    } catch (error) {
      console.error('Error completing session:', error)
      toast.error('Failed to complete session')
    }
  }

  const handleCancelSession = async () => {
    const reason = prompt('Please provide a reason for cancellation:')
    if (!reason) return

    try {
      await updateSessionStatus(sessionId, 'cancelled', reason)
      toast.success('Session cancelled')
      loadSessionData()
    } catch (error) {
      console.error('Error cancelling session:', error)
      toast.error('Failed to cancel session')
    }
  }

  const handleReschedule = async () => {
    try {
      await rescheduleSession(
        sessionId,
        rescheduleData.date,
        rescheduleData.time,
        rescheduleData.day
      )
      toast.success('Session rescheduled successfully')
      setShowReschedule(false)
      loadSessionData()
    } catch (error) {
      console.error('Error rescheduling session:', error)
      toast.error('Failed to reschedule session')
    }
  }

  const handleMaterialUpload = async (file: File) => {
    if (!profile) return
    
    try {
      const { uploadFile } = await import('@/lib/storage')
      
      // Upload file to storage
      const result = await uploadFile(file, bookingId, profile.id)
      
      // Save material reference to database
      const uploaderName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown'
      
      const { error } = await supabase
        .from('materials')
        .insert({
          booking_id: bookingId,
          session_id: sessionId,
          file_name: result.fileName,
          file_url: result.url,
          file_size: result.fileSize,
          file_type: result.fileType,
          uploaded_by: profile.id,
          uploader_name: uploaderName,
        })
      
      if (error) throw error
      
      toast.success('Material uploaded successfully!')
      loadSessionData()
    } catch (error: any) {
      console.error('Upload error:', error)
      toast.error(error.message || 'Failed to upload file')
      throw error // Re-throw so FileUpload can handle it
    }
  }

  const handleMaterialDeleted = () => {
    loadSessionData()
  }

  const handleNotesSaved = () => {
    setShowNotesForm(false)
    loadSessionData()
  }

  if (loading) {
    return (
      <ProtectedRoute requiredRole="tutor">
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
      <ProtectedRoute requiredRole="tutor">
        <DashboardLayout>
          <div className="text-center py-12">
            <p className="text-gray-600">Session not found</p>
            <Link href={`/tutor/bookings/${bookingId}`} className="btn-primary mt-4">
              Back to Booking
            </Link>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  const canStartSession = session.status === 'scheduled' || session.status === 'rescheduled'
  const canComplete = session.status !== 'completed' && session.status !== 'cancelled'
  const isCompleted = session.status === 'completed'

  return (
    <ProtectedRoute requiredRole="tutor">
      <DashboardLayout>
        <div>
          {/* Header */}
          <div className="mb-6">
            <Link 
              href={`/tutor/bookings/${bookingId}`}
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
                  
                  <div className="flex items-center gap-3 text-gray-700">
                    <User className="w-5 h-5 text-gray-400" />
                    <span className="font-medium">Student:</span>
                    <span>{booking.student_name}</span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-gray-700">
                    <BookOpen className="w-5 h-5 text-gray-400" />
                    <span className="font-medium">Subject:</span>
                    <span>{booking.class.subject}</span>
                  </div>
                </div>

                {/* Reschedule Form */}
                {showReschedule && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold mb-3">Reschedule Session</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="label">New Date</label>
                        <input
                          type="date"
                          value={rescheduleData.date}
                          onChange={(e) => setRescheduleData({ ...rescheduleData, date: e.target.value })}
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="label">New Time</label>
                        <input
                          type="time"
                          value={rescheduleData.time}
                          onChange={(e) => setRescheduleData({ ...rescheduleData, time: e.target.value })}
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="label">Day of Week</label>
                        <select
                          value={rescheduleData.day}
                          onChange={(e) => setRescheduleData({ ...rescheduleData, day: e.target.value })}
                          className="input"
                        >
                          <option value="Monday">Monday</option>
                          <option value="Tuesday">Tuesday</option>
                          <option value="Wednesday">Wednesday</option>
                          <option value="Thursday">Thursday</option>
                          <option value="Friday">Friday</option>
                          <option value="Saturday">Saturday</option>
                          <option value="Sunday">Sunday</option>
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={handleReschedule} className="btn-primary">
                          Confirm Reschedule
                        </button>
                        <button onClick={() => setShowReschedule(false)} className="btn-secondary">
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Session Materials */}
              <div className="card">
                <h2 className="text-xl font-semibold mb-4">Session Materials</h2>
                
                <FileUpload
                  onUpload={handleMaterialUpload}
                />
                
                <div className="mt-4">
                  <MaterialsList
                    bookingId={bookingId}
                    materials={materials}
                    onDelete={handleMaterialDeleted}
                  />
                </div>
              </div>

              {/* Session Notes */}
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Session Notes</h2>
                  {notes && !showNotesForm && (
                    <button
                      onClick={() => setShowNotesForm(true)}
                      className="btn-secondary text-sm flex items-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Edit Notes
                    </button>
                  )}
                </div>

                {loading ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>Loading...</p>
                  </div>
                ) : showNotesForm || !notes ? (
                  tutorId ? (
                    <SessionNotesForm
                      bookingId={bookingId}
                      sessionId={sessionId}
                      tutorId={tutorId}
                      existingNote={notes}
                      onSave={handleNotesSaved}
                      onCancel={() => setShowNotesForm(false)}
                    />
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>Unable to load tutor information. Please refresh the page.</p>
                    </div>
                  )
                ) : (
                  <SessionNotesView note={notes} showPrivateNotes={true} />
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Actions */}
              <div className="card">
                <h3 className="font-semibold mb-4">Actions</h3>
                <div className="space-y-2">
                  {canStartSession && !session.classroom_id && (
                    <button
                      onClick={handleStartSession}
                      className="w-full btn-primary flex items-center justify-center gap-2"
                    >
                      <Video className="w-4 h-4" />
                      Start Session
                    </button>
                  )}
                  
                  {session.classroom_id && (
                    <Link
                      href={`/classroom/${session.classroom_id}`}
                      target="_blank"
                      className="w-full btn-primary flex items-center justify-center gap-2"
                    >
                      <Video className="w-4 h-4" />
                      Enter Classroom
                    </Link>
                  )}
                  
                  {canComplete && (
                    <button
                      onClick={handleCompleteSession}
                      className="w-full btn-secondary flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Mark as Completed
                    </button>
                  )}
                  
                  {!showReschedule && canStartSession && (
                    <button
                      onClick={() => setShowReschedule(true)}
                      className="w-full btn-secondary flex items-center justify-center gap-2"
                    >
                      <Calendar className="w-4 h-4" />
                      Reschedule
                    </button>
                  )}
                  
                  {canStartSession && (
                    <button
                      onClick={handleCancelSession}
                      className="w-full bg-red-600 text-white hover:bg-red-700 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      Cancel Session
                    </button>
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
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

