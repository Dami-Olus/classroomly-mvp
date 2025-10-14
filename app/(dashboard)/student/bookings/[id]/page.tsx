'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import ProtectedRoute from '@/components/ProtectedRoute'
import DashboardLayout from '@/components/DashboardLayout'
import FileUpload from '@/components/FileUpload'
import MaterialsList from '@/components/MaterialsList'
import RescheduleModal from '@/components/RescheduleModal'
import RescheduleRequests from '@/components/RescheduleRequests'
import SessionNotesView from '@/components/SessionNotesView'
import { uploadFile } from '@/lib/storage'
import { generateTimeSlotsFromRanges, type TimeRange } from '@/lib/availability'
import { ArrowLeft, Calendar, Clock, User, FileText, Loader2, Video, RefreshCw, StickyNote } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface BookingData {
  id: string
  student_name: string
  scheduled_slots: Array<{ day: string; time: string }>
  status: string
  notes: string | null
  created_at: string
  class: {
    title: string
    subject: string
    duration: number
    tutor: {
      user: {
        first_name: string
        last_name: string
      }
    }
  }
  classroom?: {
    id: string
    room_url: string
    status: string
  }
}

export default function StudentBookingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const bookingId = params.id as string
  const { user, profile } = useAuth()
  const supabase = createClient()

  const [booking, setBooking] = useState<BookingData | null>(null)
  const [materials, setMaterials] = useState<any[]>([])
  const [rescheduleRequests, setRescheduleRequests] = useState<any[]>([])
  const [sessionNote, setSessionNote] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'details' | 'materials' | 'reschedule' | 'notes'>('details')
  const [showRescheduleModal, setShowRescheduleModal] = useState(false)
  const [selectedSlotForReschedule, setSelectedSlotForReschedule] = useState<{ day: string; time: string } | null>(null)
  const [availableSlots, setAvailableSlots] = useState<Array<{ day: string; time: string }>>([])

  useEffect(() => {
    loadBookingData()
  }, [bookingId])

  const loadBookingData = async () => {
    try {
      // Load booking with classroom
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .select(`
          *,
          class:classes(
            title,
            subject,
            duration,
            tutor:tutors(
              id,
              availability,
              user:profiles(
                first_name,
                last_name
              )
            )
          ),
          classroom:classrooms!booking_id(
            id,
            room_url,
            status
          )
        `)
        .eq('id', bookingId)
        .single()

      if (bookingError) throw bookingError
      
      // Extract first classroom if it's an array
      const processedData = {
        ...bookingData,
        classroom: Array.isArray(bookingData.classroom) 
          ? bookingData.classroom[0] 
          : bookingData.classroom
      }
      
      setBooking(processedData as any)

      // Generate available slots from tutor's availability
      const tutorAvailability = (bookingData as any).class?.tutor?.availability
      const tutorId = (bookingData as any).class?.tutor?.id
      
      if (tutorAvailability?.slots && Array.isArray(tutorAvailability.slots)) {
        const allSlots = generateTimeSlotsFromRanges(
          tutorAvailability.slots as TimeRange[],
          (bookingData as any).class.duration || 60
        )
        
        // Get all booked slots for this tutor (global availability)
        console.log('Fetching bookings for tutor_id:', tutorId)
        const { data: tutorBookings, error: bookingsError } = await supabase
          .from('bookings')
          .select('scheduled_slots, tutor_id, id')
          .eq('tutor_id', tutorId)
          .in('status', ['confirmed', 'rescheduled'])
          .neq('id', bookingId) // Exclude current booking
        
        if (bookingsError) {
          console.error('Error fetching tutor bookings:', bookingsError)
        }
        
        console.log('Tutor bookings fetched:', tutorBookings?.length || 0, tutorBookings)
        
        // Extract booked slots
        const bookedSlots: Array<{day: string, time: string}> = []
        if (tutorBookings) {
          tutorBookings.forEach(booking => {
            const slots = booking.scheduled_slots as Array<{day: string, time: string}>
            if (slots) {
              console.log('Adding booked slots from booking:', booking.id, slots)
              bookedSlots.push(...slots)
            }
          })
        }
        
        // Filter out booked slots
        const availableForReschedule = allSlots.filter(slot => 
          !bookedSlots.some(booked => 
            booked.day === slot.day && booked.time === slot.time
          )
        )
        
        console.log('📊 Reschedule Availability:')
        console.log('- Total slots from tutor availability:', allSlots.length)
        console.log('- Booked slots (other bookings):', bookedSlots.length)
        console.log('- Available for reschedule:', availableForReschedule.length)
        console.log('- Booked slots details:', bookedSlots)
        
        setAvailableSlots(availableForReschedule)
      }

      // Load materials
      await loadMaterials()
      
      // Load reschedule requests
      await loadRescheduleRequests()
      
      // Load session notes
      await loadSessionNotes()
    } catch (error: any) {
      console.error('Error loading booking:', error)
      toast.error('Failed to load booking details')
    } finally {
      setLoading(false)
    }
  }

  const loadMaterials = async () => {
    try {
      const { data, error } = await supabase
        .from('session_materials')
        .select(`
          *,
          uploader:profiles!uploaded_by(
            first_name,
            last_name
          )
        `)
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setMaterials(data || [])
    } catch (error: any) {
      console.error('Error loading materials:', error)
    }
  }

  const loadRescheduleRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('reschedule_requests')
        .select(`
          *,
          requester:profiles!requested_by(
            first_name,
            last_name
          ),
          responder:profiles!responded_by(
            first_name,
            last_name
          )
        `)
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setRescheduleRequests(data || [])
    } catch (error: any) {
      console.error('Error loading reschedule requests:', error)
    }
  }

  const loadSessionNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('session_notes')
        .select('*')
        .eq('booking_id', bookingId)
        .single()

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows returned, which is fine (no notes yet)
        console.error('Error loading session notes:', error)
      }
      
      setSessionNote(data || null)
    } catch (error: any) {
      console.error('Error in loadSessionNotes:', error)
    }
  }

  const handleUpload = async (file: File) => {
    if (!user?.id) {
      throw new Error('You must be logged in to upload files')
    }

    try {
      // Upload file to storage
      const uploadResult = await uploadFile(file, bookingId, user.id)

      // Save metadata to database
      const { error } = await supabase.from('session_materials').insert({
        booking_id: bookingId,
        uploaded_by: user.id,
        file_name: uploadResult.fileName,
        file_url: uploadResult.url,
        file_size: uploadResult.fileSize,
        file_type: uploadResult.fileType,
      })

      if (error) throw error

      // Reload materials
      await loadMaterials()
    } catch (error) {
      throw error
    }
  }

  if (loading) {
    return (
      <ProtectedRoute requiredRole="student">
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  if (!booking) {
    return (
      <ProtectedRoute requiredRole="student">
        <DashboardLayout>
          <div className="text-center py-12">
            <p className="text-gray-500">Booking not found</p>
            <Link href="/student/bookings" className="btn-primary mt-4 inline-block">
              Back to Bookings
            </Link>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  const tutorName = `${booking.class.tutor.user.first_name} ${booking.class.tutor.user.last_name}`
  const canJoinClassroom = booking.classroom && ['active', 'scheduled'].includes(booking.classroom.status)

  return (
    <ProtectedRoute requiredRole="student">
      <DashboardLayout>
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Link
              href="/student/bookings"
              className="text-primary-600 hover:text-primary-700 flex items-center gap-2 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Bookings
            </Link>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {booking.class.title}
                </h1>
                <p className="text-gray-600 mt-2">
                  with {tutorName} • {booking.class.subject}
                </p>
              </div>
              {canJoinClassroom && booking.classroom && (
                <Link
                  href={`/classroom/${booking.classroom.room_url}`}
                  className="btn-primary flex items-center gap-2"
                >
                  <Video className="w-5 h-5" />
                  Join Classroom
                </Link>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <div className="flex gap-6">
              <button
                onClick={() => setActiveTab('details')}
                className={`pb-4 px-2 font-medium transition-colors ${
                  activeTab === 'details'
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Booking Details
              </button>
              <button
                onClick={() => setActiveTab('materials')}
                className={`pb-4 px-2 font-medium transition-colors ${
                  activeTab === 'materials'
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Materials ({materials.length})
              </button>
              <button
                onClick={() => setActiveTab('reschedule')}
                className={`pb-4 px-2 font-medium transition-colors ${
                  activeTab === 'reschedule'
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Reschedule ({rescheduleRequests.filter(r => r.status === 'pending').length})
              </button>
              <button
                onClick={() => setActiveTab('notes')}
                className={`pb-4 px-2 font-medium transition-colors ${
                  activeTab === 'notes'
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <StickyNote className="w-4 h-4 inline-block mr-1" />
                Notes {sessionNote && '✓'}
              </button>
            </div>
          </div>

          {/* Content */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Tutor Info */}
              <div className="card">
                <h2 className="text-xl font-semibold mb-4">Tutor</h2>
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <p className="font-medium">{tutorName}</p>
                </div>
              </div>

              {/* Schedule */}
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Schedule</h2>
                  {booking.status !== 'completed' && booking.status !== 'cancelled' && (
                    <button
                      onClick={() => {
                        if (booking.scheduled_slots.length > 0) {
                          setSelectedSlotForReschedule(booking.scheduled_slots[0])
                          setShowRescheduleModal(true)
                        }
                      }}
                      className="text-sm btn-secondary flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Request Reschedule
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {booking.scheduled_slots.map((slot, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Calendar className="w-5 h-5 text-primary-600" />
                      <span className="font-medium">{slot.day}</span>
                      <Clock className="w-5 h-5 text-gray-400 ml-auto" />
                      <span>{slot.time}</span>
                      <span className="text-gray-500">({booking.class.duration} min)</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* My Notes */}
              {booking.notes && (
                <div className="card">
                  <h2 className="text-xl font-semibold mb-4">Your Notes</h2>
                  <p className="text-gray-700">{booking.notes}</p>
                </div>
              )}

              {/* Status */}
              <div className="card">
                <h2 className="text-xl font-semibold mb-4">Status</h2>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    booking.status === 'confirmed'
                      ? 'bg-green-100 text-green-800'
                      : booking.status === 'completed'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                </span>
              </div>
            </div>
          )}

          {activeTab === 'materials' && (
            <div className="space-y-6">
              {/* Upload Section */}
              <div className="card">
                <h2 className="text-xl font-semibold mb-4">Upload Materials</h2>
                <p className="text-gray-600 mb-4 text-sm">
                  Share files with your tutor (homework, questions, etc.)
                </p>
                <FileUpload onUpload={handleUpload} />
              </div>

              {/* Materials List */}
              <div className="card">
                <h2 className="text-xl font-semibold mb-4">Shared Materials</h2>
                <MaterialsList
                  bookingId={bookingId}
                  materials={materials}
                  currentUserId={user?.id}
                  onDelete={loadMaterials}
                />
              </div>
            </div>
          )}

          {activeTab === 'reschedule' && (
            <div className="space-y-6">
              {/* Reschedule Requests */}
              <div className="card">
                <h2 className="text-xl font-semibold mb-4">Reschedule Requests</h2>
                <RescheduleRequests
                  requests={rescheduleRequests}
                  currentUserId={user?.id || ''}
                  bookingId={bookingId}
                  onUpdate={() => {
                    loadRescheduleRequests()
                    loadBookingData() // Reload to get updated slots
                  }}
                />
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-6">
              {/* Session Notes (Read-Only for Students) */}
              <div className="card">
                <h2 className="text-xl font-semibold mb-4">Session Notes</h2>
                {sessionNote ? (
                  <SessionNotesView
                    note={sessionNote}
                    showPrivateNotes={false} // Students cannot see private notes
                    canEdit={false}
                    canDelete={false}
                  />
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <StickyNote className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    <p>No session notes yet</p>
                    <p className="text-sm mt-2">
                      Your tutor will add notes after your session
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Reschedule Modal */}
        {showRescheduleModal && selectedSlotForReschedule && (
          <RescheduleModal
            bookingId={bookingId}
            currentSlot={selectedSlotForReschedule}
            availableSlots={availableSlots}
            onClose={() => {
              setShowRescheduleModal(false)
              setSelectedSlotForReschedule(null)
            }}
            onSuccess={() => {
              loadRescheduleRequests()
              loadBookingData()
            }}
            currentUserId={user?.id || ''}
          />
        )}
      </DashboardLayout>
    </ProtectedRoute>
  )
}

