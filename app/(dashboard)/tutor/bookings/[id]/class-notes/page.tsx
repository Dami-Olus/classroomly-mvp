'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'
import DashboardLayout from '@/components/DashboardLayout'
import ClassNotesForm from '@/components/ClassNotesForm'
import ClassNotesView from '@/components/ClassNotesView'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { ArrowLeft, Edit, FileText, BookOpen } from 'lucide-react'
import toast from 'react-hot-toast'

export default function TutorClassNotesPage() {
  const params = useParams()
  const { profile } = useAuth()
  const supabase = createClient()
  
  const bookingId = params.id as string
  
  const [booking, setBooking] = useState<any>(null)
  const [classNotes, setClassNotes] = useState<any>(null)
  const [tutor, setTutor] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    loadData()
  }, [bookingId])

  const loadData = async () => {
    try {
      // Load booking with class info
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .select(`
          *,
          class:classes(
            id,
            title,
            subject,
            tutor_id
          )
        `)
        .eq('id', bookingId)
        .single()

      if (bookingError) throw bookingError
      setBooking(bookingData)

      // Get tutor ID
      const { data: tutorData } = await supabase
        .from('tutors')
        .select('id')
        .eq('user_id', profile?.id)
        .single()

      setTutor(tutorData)

      // Load class notes
      const { data: notesData } = await supabase
        .from('class_notes')
        .select('*')
        .eq('class_id', bookingData.class.id)
        .single()

      setClassNotes(notesData)

      // If no notes exist, show form by default
      if (!notesData) {
        setIsEditing(true)
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load class notes')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = () => {
    setIsEditing(false)
    loadData()
  }

  const handleCancel = () => {
    if (classNotes) {
      setIsEditing(false)
    }
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

  if (!booking) {
    return (
      <ProtectedRoute requiredRole="tutor">
        <DashboardLayout>
          <div className="text-center py-12">
            <p className="text-gray-600">Booking not found</p>
            <Link href="/tutor/bookings" className="btn-primary mt-4">
              Back to Bookings
            </Link>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

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
                  Class Notes
                </h1>
                <p className="text-gray-600">{booking.class.title}</p>
                <p className="text-sm text-gray-500">Student: {booking.student_name}</p>
              </div>
              
              {classNotes && !isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn-primary flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit Notes
                </button>
              )}
            </div>
          </div>

          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <BookOpen className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">About Class Notes</h3>
                <p className="text-sm text-blue-800">
                  Class notes apply to the entire class and student. Use this space to record
                  important information like student background, learning preferences, goals,
                  and special considerations. These notes are separate from per-session notes.
                </p>
              </div>
            </div>
          </div>

          {/* Notes Content */}
          <div className="card">
            {isEditing || !classNotes ? (
              <>
                <div className="flex items-center gap-2 mb-6">
                  <FileText className="w-5 h-5 text-primary-600" />
                  <h2 className="text-xl font-semibold">
                    {classNotes ? 'Edit Class Notes' : 'Add Class Notes'}
                  </h2>
                </div>
                
                <ClassNotesForm
                  classId={booking.class.id}
                  tutorId={tutor?.id}
                  existingNotes={classNotes}
                  onSave={handleSave}
                  onCancel={handleCancel}
                />
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-6">
                  <FileText className="w-5 h-5 text-primary-600" />
                  <h2 className="text-xl font-semibold">Class Notes</h2>
                </div>
                
                <ClassNotesView notes={classNotes} />
              </>
            )}
          </div>

          {/* Quick Links */}
          <div className="mt-6 flex gap-4">
            <Link
              href={`/tutor/bookings/${bookingId}`}
              className="btn-secondary"
            >
              View All Sessions
            </Link>
            <Link
              href={`/tutor/bookings/${bookingId}/reports`}
              className="btn-secondary"
            >
              Generate Report
            </Link>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

