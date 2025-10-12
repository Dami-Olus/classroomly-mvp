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
import { uploadFile } from '@/lib/storage'
import { generateTimeSlotsFromRanges, type TimeRange } from '@/lib/availability'
import { ArrowLeft, Calendar, Clock, User, FileText, Loader2, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface BookingData {
  id: string
  student_name: string
  student_email: string
  scheduled_slots: Array<{ day: string; time: string }>
  status: string
  notes: string | null
  created_at: string
  tutor_id: string
  class: {
    title: string
    subject: string
    duration: number
    tutor: {
      id: string
      availability: any
    }
  }
}

export default function BookingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const bookingId = params.id as string
  const { user, profile } = useAuth()
  const supabase = createClient()

  const [booking, setBooking] = useState<BookingData | null>(null)
  const [materials, setMaterials] = useState<any[]>([])
  const [rescheduleRequests, setRescheduleRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'details' | 'materials' | 'reschedule'>('details')
  const [showRescheduleModal, setShowRescheduleModal] = useState(false)
  const [selectedSlotForReschedule, setSelectedSlotForReschedule] = useState<{ day: string; time: string } | null>(null)
  const [availableSlots, setAvailableSlots] = useState<Array<{ day: string; time: string }>>([])

  useEffect(() => {
    loadBookingData()
  }, [bookingId])

  const loadBookingData = async () => {
    try {
      // Load booking with tutor availability
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
              availability
            )
          )
        `)
        .eq('id', bookingId)
        .single()

      if (bookingError) throw bookingError
      setBooking(bookingData as any)

      // Generate available slots from tutor's availability
      const tutorAvailability = (bookingData as any).class?.tutor?.availability
      if (tutorAvailability?.slots && Array.isArray(tutorAvailability.slots)) {
        const slots = generateTimeSlotsFromRanges(
          tutorAvailability.slots as TimeRange[],
          (bookingData as any).class.duration || 60
        )
        setAvailableSlots(slots)
      }

      // Load materials
      await loadMaterials()
      
      // Load reschedule requests
      await loadRescheduleRequests()
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
      throw error // Re-throw to be handled by FileUpload component
    }
  }

  if (loading) {
    return (
      <ProtectedRoute requireRole="tutor">
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
      <ProtectedRoute requireRole="tutor">
        <DashboardLayout>
          <div className="text-center py-12">
            <p className="text-gray-500">Booking not found</p>
            <Link href="/tutor/bookings" className="btn-primary mt-4 inline-block">
              Back to Bookings
            </Link>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requireRole="tutor">
      <DashboardLayout>
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Link
              href="/tutor/bookings"
              className="text-primary-600 hover:text-primary-700 flex items-center gap-2 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Bookings
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">
              {booking.class.title}
            </h1>
            <p className="text-gray-600 mt-2">{booking.class.subject}</p>
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
            </div>
          </div>

          {/* Content */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Student Info */}
              <div className="card">
                <h2 className="text-xl font-semibold mb-4">Student Information</h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="font-medium">{booking.student_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{booking.student_email}</p>
                    </div>
                  </div>
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

              {/* Notes */}
              {booking.notes && (
                <div className="card">
                  <h2 className="text-xl font-semibold mb-4">Student Notes</h2>
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

