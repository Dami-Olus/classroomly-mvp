'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import {
  BookOpen,
  Clock,
  Calendar,
  DollarSign,
  User,
  Mail,
  CheckCircle,
  ArrowLeft,
} from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'
import type { ClassWithTutor } from '@/types'

interface BookableSlot {
  day: string
  time: string
}

const DAYS_ORDER = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
]

export default function PublicBookingPage() {
  const params = useParams()
  const router = useRouter()
  const bookingLink = params.bookingLink as string
  const supabase = createClient()
  const { user, profile } = useAuth()

  const [classData, setClassData] = useState<ClassWithTutor | null>(null)
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState(false)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    studentName: '',
    studentEmail: '',
    notes: '',
  })

  const [selectedSlots, setSelectedSlots] = useState<BookableSlot[]>([])
  const [availableSlots, setAvailableSlots] = useState<BookableSlot[]>([])

  useEffect(() => {
    loadClassData()
  }, [bookingLink])

  // Pre-fill form if user is logged in
  useEffect(() => {
    if (profile && !formData.studentName) {
      setFormData({
        studentName: `${profile.first_name} ${profile.last_name}`,
        studentEmail: profile.email,
        notes: '',
      })
    }
  }, [profile])

  const loadClassData = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select(`
          *,
          tutor:tutors(
            *,
            user:profiles(
              first_name,
              last_name,
              profile_image
            )
          )
        `)
        .eq('booking_link', bookingLink)
        .eq('is_active', true)
        .single()

      if (error) throw error

      if (!data) {
        toast.error('Class not found or no longer available')
        return
      }

      setClassData(data as any)
      setAvailableSlots((data.available_slots as BookableSlot[]) || [])
    } catch (error) {
      console.error('Error loading class:', error)
      toast.error('Failed to load class details')
    } finally {
      setLoading(false)
    }
  }

  const toggleSlotSelection = (slot: BookableSlot) => {
    const isSelected = selectedSlots.some(
      (s) => s.day === slot.day && s.time === slot.time
    )

    if (isSelected) {
      setSelectedSlots(
        selectedSlots.filter((s) => !(s.day === slot.day && s.time === slot.time))
      )
    } else {
      // Check if we've reached the weekly frequency limit
      if (classData && selectedSlots.length >= classData.weekly_frequency) {
        toast.error(
          `You can only select up to ${classData.weekly_frequency} session${
            classData.weekly_frequency > 1 ? 's' : ''
          } per week`
        )
        return
      }
      setSelectedSlots([...selectedSlots, slot])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedSlots.length === 0) {
      toast.error('Please select at least one time slot')
      return
    }

    if (!classData) return

    setBooking(true)

    try {
      // Create booking with student_id if user is logged in
      const bookingData = {
        class_id: classData.id,
        student_id: user?.id || null, // Add user ID if logged in
        student_name: formData.studentName,
        student_email: formData.studentEmail,
        scheduled_slots: selectedSlots,
        total_sessions: selectedSlots.length,
        notes: formData.notes,
        status: 'confirmed' as const,
      }

      console.log('Creating booking with data:', bookingData)
      console.log('User authenticated:', !!user)
      console.log('User ID:', user?.id)
      
      const { data: createdBooking, error: bookingError } = await supabase
        .from('bookings')
        .insert(bookingData)
        .select()
        .single()

      if (bookingError) {
        console.error('Booking error details:', bookingError)
        throw bookingError
      }

      if (!createdBooking) {
        throw new Error('Failed to create booking')
      }

      // Create classroom sessions for each selected slot
      const classroomPromises = selectedSlots.map((slot) => {
        // Create a future date for the session (next occurrence of the day)
        const today = new Date()
        const dayIndex = [
          'Sunday',
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
        ].indexOf(slot.day)
        const currentDayIndex = today.getDay()
        let daysUntilNext = dayIndex - currentDayIndex
        if (daysUntilNext <= 0) daysUntilNext += 7

        const sessionDate = new Date(today)
        sessionDate.setDate(today.getDate() + daysUntilNext)
        const [hours, minutes] = slot.time.split(':')
        sessionDate.setHours(parseInt(hours), parseInt(minutes), 0, 0)

        const roomUrl = Math.random().toString(36).substring(2, 14)

        return supabase.from('classrooms').insert({
          booking_id: createdBooking.id,
          session_date: sessionDate.toISOString(),
          room_url: roomUrl,
          status: 'scheduled',
        })
      })

      await Promise.all(classroomPromises)

      // Send booking confirmation emails
      try {
        const tutor = classData.tutor as any
        const tutorUser = tutor?.user
        
        await fetch('/api/send-booking-confirmation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentName: formData.studentName,
            studentEmail: formData.studentEmail,
            tutorName: `${tutorUser?.first_name} ${tutorUser?.last_name}`,
            tutorEmail: tutorUser?.email,
            className: classData.title,
            subject: classData.subject,
            duration: classData.duration,
            scheduledSlots: selectedSlots,
            bookingId: createdBooking.id,
            notes: formData.notes,
          }),
        })
      } catch (emailError) {
        console.error('Failed to send emails:', emailError)
        // Don't fail the booking if email fails
      }

      setSuccess(true)
      toast.success('Booking confirmed! Check your email for details.')
    } catch (error: any) {
      console.error('Error creating booking:', error)
      toast.error(error.message || 'Failed to create booking')
    } finally {
      setBooking(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-secondary-600">Loading class details...</p>
        </div>
      </div>
    )
  }

  if (!classData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary-50 px-4">
        <div className="card max-w-md text-center">
          <BookOpen className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-secondary-900 mb-2">
            Class Not Found
          </h1>
          <p className="text-secondary-600 mb-6">
            This booking link is invalid or the class is no longer available.
          </p>
          <Link href="/" className="btn-primary">
            Go to Homepage
          </Link>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-secondary-100 px-4">
        <div className="card max-w-2xl">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-green-900 mb-2">
              Booking Confirmed! 🎉
            </h1>
            <p className="text-green-700 mb-6">
              Your tutoring sessions have been scheduled successfully.
            </p>

            <div className="bg-white rounded-lg p-6 mb-6 text-left">
              <h2 className="font-semibold text-secondary-900 mb-4">
                What's Next?
              </h2>
              <ul className="space-y-3 text-secondary-700">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>
                    Check your email ({formData.studentEmail}) for booking confirmation and
                    session details
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>
                    You'll receive classroom links before each session
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>
                    Your tutor will contact you if any changes are needed
                  </span>
                </li>
              </ul>
            </div>

            <div className="bg-primary-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-primary-900">
                <strong>Selected Sessions:</strong>
              </p>
              <div className="mt-2 space-y-1">
                {selectedSlots.map((slot, index) => (
                  <p key={index} className="text-primary-800">
                    {slot.day}s at {slot.time}
                  </p>
                ))}
              </div>
            </div>

            <Link href="/" className="btn-primary">
              Back to Homepage
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const tutor = classData.tutor as any
  const tutorName = `${tutor?.user?.first_name || ''} ${
    tutor?.user?.last_name || ''
  }`.trim()

  // Group slots by day
  const slotsByDay = availableSlots.reduce((acc, slot) => {
    if (!acc[slot.day]) acc[slot.day] = []
    acc[slot.day].push(slot)
    return acc
  }, {} as Record<string, TimeSlot[]>)

  const DAYS_ORDER = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ]

  return (
    <div className="min-h-screen bg-secondary-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-primary-600 hover:text-primary-700 flex items-center gap-2 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Homepage
          </Link>
          <div className="card">
            <div className="flex items-start gap-6">
              {tutor?.user?.profile_image ? (
                <img
                  src={tutor.user.profile_image}
                  alt={tutorName}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center">
                  <User className="w-10 h-10 text-primary-600" />
                </div>
              )}

              <div className="flex-1">
                <p className="text-sm text-secondary-600 mb-1">Tutored by</p>
                <h1 className="text-3xl font-bold text-secondary-900 mb-2">
                  {classData.title}
                </h1>
                <p className="text-lg text-primary-600 font-medium mb-2">
                  with {tutorName}
                </p>
                <p className="text-secondary-600">{classData.subject}</p>
              </div>
            </div>

            {classData.description && (
              <p className="text-secondary-700 mt-4 pt-4 border-t">
                {classData.description}
              </p>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6 pt-6 border-t">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary-600" />
                <div>
                  <p className="text-xs text-secondary-600">Duration</p>
                  <p className="font-medium">{classData.duration} minutes</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary-600" />
                <div>
                  <p className="text-xs text-secondary-600">Frequency</p>
                  <p className="font-medium">
                    {classData.weekly_frequency}x per week
                  </p>
                </div>
              </div>
              {classData.price_per_session && (
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-primary-600" />
                  <div>
                    <p className="text-xs text-secondary-600">Price</p>
                    <p className="font-medium">
                      ${classData.price_per_session}/session
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Booking Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Your Information */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Your Information</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="studentName" className="label">
                  <User className="w-4 h-4 inline-block mr-2" />
                  Full Name *
                </label>
                <input
                  type="text"
                  id="studentName"
                  value={formData.studentName}
                  onChange={(e) =>
                    setFormData({ ...formData, studentName: e.target.value })
                  }
                  className="input"
                  placeholder="John Doe"
                  required
                />
              </div>

              <div>
                <label htmlFor="studentEmail" className="label">
                  <Mail className="w-4 h-4 inline-block mr-2" />
                  Email Address *
                </label>
                <input
                  type="email"
                  id="studentEmail"
                  value={formData.studentEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, studentEmail: e.target.value })
                  }
                  className="input"
                  placeholder="john@example.com"
                  required
                />
                <p className="text-xs text-secondary-500 mt-1">
                  We'll send session details and classroom links to this email
                </p>
              </div>

              <div>
                <label htmlFor="notes" className="label">
                  Notes (Optional)
                </label>
                <textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className="input"
                  rows={3}
                  placeholder="Any specific topics you'd like to focus on?"
                />
              </div>
            </div>
          </div>

          {/* Select Time Slots */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-2">Select Time Slots</h2>
            <p className="text-secondary-600 mb-4">
              Choose up to {classData.weekly_frequency} session
              {classData.weekly_frequency > 1 ? 's' : ''} per week ({selectedSlots.length}{' '}
              selected)
            </p>

            <div className="space-y-4">
              {DAYS_ORDER.map((day) => {
                const daySlots = slotsByDay[day]
                if (!daySlots || daySlots.length === 0) return null

                return (
                  <div key={day}>
                    <h3 className="font-semibold text-secondary-900 mb-2">
                      {day}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {daySlots.sort((a, b) => a.time.localeCompare(b.time)).map((slot, index) => {
                        const isSelected = selectedSlots.some(
                          (s) => s.day === slot.day && s.time === slot.time
                        )
                        return (
                          <button
                            key={`${day}-${slot.time}-${index}`}
                            type="button"
                            onClick={() => toggleSlotSelection(slot)}
                            className={`px-4 py-2 rounded-lg font-medium transition-all ${
                              isSelected
                                ? 'bg-primary-600 text-white'
                                : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
                            }`}
                          >
                            {slot.time}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={booking || selectedSlots.length === 0}
            className="w-full btn-primary text-lg py-4"
          >
            {booking
              ? 'Confirming Booking...'
              : `Confirm Booking (${selectedSlots.length} session${
                  selectedSlots.length !== 1 ? 's' : ''
                })`}
          </button>
        </form>
      </div>
    </div>
  )
}

