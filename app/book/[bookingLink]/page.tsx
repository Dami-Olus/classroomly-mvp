'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useTimezone } from '@/hooks/useTimezone'
import {
  BookOpen,
  Clock,
  Calendar,
  DollarSign,
  User,
  Mail,
  CheckCircle,
  ArrowLeft,
  Globe,
  Info,
} from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'
import type { ClassWithTutor } from '@/types'
import { generateTimeSlotsFromRanges, type TimeRange } from '@/lib/availability'
import { generateSessions, createSessions } from '@/lib/sessions'
import { DualTimeDisplay, TimeSlotWithTimezone, TimezoneInfoDisplay } from '@/components/DualTimeDisplay'

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
  const { timezone: studentTimezone, timezoneInfo } = useTimezone()

  const [classData, setClassData] = useState<ClassWithTutor | null>(null)
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState(false)
  const [success, setSuccess] = useState(false)
  const [showAuthPrompt, setShowAuthPrompt] = useState(false)
  const [tutorTimezone, setTutorTimezone] = useState<string>('UTC')

  const [formData, setFormData] = useState({
    studentName: '',
    studentEmail: '',
    notes: '',
    startDate: '',
    totalSessions: 12, // Default to 12 sessions
  })

  const [selectedSlots, setSelectedSlots] = useState<BookableSlot[]>([])
  const [availableSlots, setAvailableSlots] = useState<BookableSlot[]>([])
  const [bookedSlots, setBookedSlots] = useState<BookableSlot[]>([])

  useEffect(() => {
    loadClassData()
  }, [bookingLink])

  // Handle authentication redirect
  useEffect(() => {
    if (user && showAuthPrompt) {
      // User has authenticated, hide the prompt and continue with booking
      setShowAuthPrompt(false)
      // Auto-submit the form if they were trying to book
      if (selectedSlots.length > 0) {
        handleSubmit(new Event('submit') as any)
      }
    }
  }, [user, showAuthPrompt, selectedSlots.length])

  // Pre-fill form if user is logged in
  useEffect(() => {
    if (profile && !formData.studentName) {
      setFormData(prev => ({
        ...prev,
        studentName: `${profile.first_name} ${profile.last_name}`,
        studentEmail: profile.email,
      }))
    }
  }, [profile])

  const loadBookedSlots = async (idToSearch: string, isTutorId: boolean = false) => {
    try {
      console.log('=== Loading Booked Slots (GLOBAL TUTOR AVAILABILITY) ===')
      console.log(isTutorId ? 'Tutor ID:' : 'Class ID:', idToSearch)
      
      // Query by tutor_id to get ALL bookings across ALL classes
      const query = supabase
        .from('bookings')
        .select('id, scheduled_slots, status, student_name, class_id, tutor_id')
      
      if (isTutorId) {
        query.eq('tutor_id', idToSearch)
      } else {
        query.eq('class_id', idToSearch)
      }
      
      const { data: allBookings } = await query
      
      console.log(`ALL bookings for this ${isTutorId ? 'TUTOR' : 'class'} (any status):`, allBookings)
      
      // Now get only confirmed/rescheduled bookings
      const confirmedQuery = supabase
        .from('bookings')
        .select('scheduled_slots, status, student_name, class_id, tutor_id')
        .in('status', ['confirmed', 'rescheduled'])
      
      if (isTutorId) {
        confirmedQuery.eq('tutor_id', idToSearch)
      } else {
        confirmedQuery.eq('class_id', idToSearch)
      }
      
      const { data: bookings, error } = await confirmedQuery
      
      console.log('Confirmed bookings only. Error:', error, 'Data:', bookings)
      console.log('🌍 GLOBAL SYSTEM: These slots are unavailable across ALL classes for this tutor')

      if (error) {
        console.error('Error loading booked slots:', error)
        return
      }

      // Extract all booked slots
      const allBookedSlots: BookableSlot[] = []
      if (bookings) {
        console.log('Raw bookings data:', bookings)
        bookings.forEach((booking) => {
          console.log('Processing booking.scheduled_slots:', booking.scheduled_slots)
          const slots = booking.scheduled_slots as BookableSlot[]
          if (slots && Array.isArray(slots)) {
            allBookedSlots.push(...slots)
          }
        })
      }

      console.log('Loaded booked slots:', allBookedSlots)
      console.log('Total booked slots count:', allBookedSlots.length)
      setBookedSlots(allBookedSlots)
    } catch (error) {
      console.error('Error in loadBookedSlots:', error)
    }
  }

  const loadClassData = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select(`
          *,
          tutor:tutors(
            id,
            availability,
            user:profiles(
              first_name,
              last_name,
              email,
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

      console.log('=== Class Data Loaded ===')
      console.log('Class ID:', data.id)
      console.log('Class Title:', data.title)
      console.log('Tutor ID:', data.tutor?.id)
      console.log('Tutor availability:', data.tutor?.availability)
      
      setClassData(data as any)
      
      // Set tutor timezone
      const tutorTz = (data.tutor as any)?.timezone || 'UTC'
      setTutorTimezone(tutorTz)
      
      // Debug timezone information
      console.log('🌍 TIMEZONE DEBUG:')
      console.log('Student timezone:', studentTimezone)
      console.log('Tutor timezone:', tutorTz)
      console.log('Timezone info:', timezoneInfo)
      
      // Generate available slots from TUTOR's global availability (not class-specific)
      const tutorAvailability = (data.tutor as any)?.availability
      if (tutorAvailability && tutorAvailability.slots && Array.isArray(tutorAvailability.slots)) {
        console.log('🕐 GENERATING TIME SLOTS:')
        console.log('Tutor availability slots:', tutorAvailability.slots)
        console.log('Converting from tutor timezone:', tutorTz, 'to student timezone:', studentTimezone)
        
        const slots = generateTimeSlotsFromRanges(
          tutorAvailability.slots as TimeRange[],
          data.duration || 60
        )
        console.log('Generated slots from TUTOR availability:', slots.length, 'slots')
        console.log('Generated slots for student:', slots)
        setAvailableSlots(slots)
      } else {
        console.warn('Tutor has no availability set')
        toast.error('This tutor has not configured their availability yet')
        setAvailableSlots([])
      }
      
      // Load booked slots from ALL of this tutor's bookings (not just this class)
      const tutorId = (data.tutor as any)?.id
      if (tutorId) {
        console.log('Loading booked slots for TUTOR (global):', tutorId)
        await loadBookedSlots(tutorId, true) // Pass true to indicate tutor-level query
      }
    } catch (error) {
      console.error('Error loading class:', error)
      toast.error('Failed to load class details')
    } finally {
      setLoading(false)
    }
  }

  const toggleSlotSelection = (slot: BookableSlot) => {
    // Check if slot is already booked
    const isBooked = bookedSlots.some(
      (s) => s.day === slot.day && s.time === slot.time
    )
    
    if (isBooked) {
      toast.error('This time slot is already booked')
      return
    }

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

    // Check if user is authenticated
    if (!user) {
      setShowAuthPrompt(true)
      return
    }

    setBooking(true)

    try {
      // Get tutor ID from class data
      const tutorId = (classData as any).tutor?.id
      if (!tutorId) {
        throw new Error('Tutor information not found')
      }

      // Validate start date
      if (!formData.startDate) {
        throw new Error('Please select a start date for your sessions')
      }

      // Validate selectedSlots before creating booking
      if (!selectedSlots || selectedSlots.length === 0) {
        throw new Error('No time slots selected. Please select at least one time slot.')
      }

      // Ensure selectedSlots is a valid array
      const validSlots = Array.isArray(selectedSlots) ? selectedSlots : []
      if (validSlots.length === 0) {
        throw new Error('Invalid time slots selected. Please try again.')
      }

      // Create booking with student_id and tutor_id
      const bookingData = {
        class_id: classData.id,
        tutor_id: tutorId, // Add tutor_id for global availability tracking
        student_id: user?.id || null,
        student_name: formData.studentName,
        student_email: formData.studentEmail,
        scheduled_slots: validSlots, // Use validated slots
        total_sessions: formData.totalSessions,
        sessions_per_week: validSlots.length,
        start_date: formData.startDate,
        notes: formData.notes,
        status: 'confirmed' as const,
      }

      console.log('Creating booking with data:', bookingData)
      console.log('User authenticated:', !!user)
      console.log('🌍 GLOBAL AVAILABILITY: This booking will block slots across ALL tutor classes')
      
      // Check for scheduling conflicts before creating booking (check tutor-level)
      console.log('Checking for scheduling conflicts (global tutor availability)...')
      const conflictResponse = await fetch('/api/check-conflicts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tutorId: tutorId, // Use tutorId instead of classId for global check
          classId: classData.id,
          selectedSlots,
        }),
      })

      if (!conflictResponse.ok) {
        throw new Error('Failed to check for scheduling conflicts')
      }

      const conflictData = await conflictResponse.json()
      console.log('Conflict check result:', conflictData)

      if (conflictData.hasConflicts) {
        const conflictList = conflictData.conflicts.join(', ')
        throw new Error(
          `The following time slots are already booked: ${conflictList}. Please select different times.`
        )
      }
      
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

      // Generate sessions based on class schedule and booking parameters
      console.log('Generating sessions for booking...')
      const classSchedule = {
        days: selectedSlots.map(s => s.day),
        times: selectedSlots.map(s => s.time),
        duration: classData.duration,
      }

      const sessions = await generateSessions({
        bookingId: createdBooking.id,
        classSchedule,
        startDate: new Date(formData.startDate),
        totalSessions: formData.totalSessions,
      })

      console.log(`Generated ${sessions.length} sessions`)

      // Create all sessions in the database
      await createSessions(sessions)
      console.log('Sessions created successfully')

      // Send booking confirmation emails
      try {
        const tutor = classData.tutor as any
        const tutorUser = tutor?.user
        
        console.log('📧 Attempting to send booking confirmation emails...')
        console.log('Tutor info:', { 
          name: `${tutorUser?.first_name} ${tutorUser?.last_name}`, 
          email: tutorUser?.email 
        })
        console.log('Student info:', { 
          name: formData.studentName, 
          email: formData.studentEmail 
        })
        
        const emailResponse = await fetch('/api/send-booking-confirmation', {
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

        if (!emailResponse.ok) {
          const errorData = await emailResponse.json()
          console.error('📧 Email API error:', errorData)
          toast.error('Booking created but email notification failed. Please contact support.')
        } else {
          const emailData = await emailResponse.json()
          console.log('📧 Emails sent successfully:', emailData)
          toast.success('Booking confirmed! Check your email for details.')
        }
      } catch (emailError) {
        console.error('📧 Failed to send emails:', emailError)
        toast.error('Booking created but email notification failed. Please contact support.')
      }

      setSuccess(true)
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
  }, {} as Record<string, BookableSlot[]>)

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
                <label htmlFor="startDate" className="label">
                  <Calendar className="w-4 h-4 inline-block mr-2" />
                  Start Date *
                </label>
                <input
                  type="date"
                  id="startDate"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  min={new Date().toISOString().split('T')[0]}
                  className="input"
                  required
                />
                <p className="text-xs text-secondary-500 mt-1">
                  When would you like your sessions to begin?
                </p>
              </div>

              <div>
                <label htmlFor="totalSessions" className="label">
                  <Clock className="w-4 h-4 inline-block mr-2" />
                  Number of Sessions
                </label>
                <select
                  id="totalSessions"
                  value={formData.totalSessions}
                  onChange={(e) =>
                    setFormData({ ...formData, totalSessions: parseInt(e.target.value) })
                  }
                  className="input"
                >
                  <option value={4}>4 sessions (1 month)</option>
                  <option value={8}>8 sessions (2 months)</option>
                  <option value={12}>12 sessions (3 months)</option>
                  <option value={16}>16 sessions (4 months)</option>
                  <option value={24}>24 sessions (6 months)</option>
                  <option value={48}>48 sessions (1 year)</option>
                </select>
                <p className="text-xs text-secondary-500 mt-1">
                  Based on your weekly schedule. You can add more sessions later.
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

          {/* Timezone Information */}
          <div className="card bg-blue-50 border-blue-200">
            <div className="flex items-center gap-2 mb-3">
              <Globe className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-blue-900">Timezone Information</h3>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Your timezone:</span>
                <TimezoneInfoDisplay timezone={studentTimezone} showDetails={true} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Tutor timezone:</span>
                <TimezoneInfoDisplay timezone={tutorTimezone} showDetails={true} />
              </div>
              {studentTimezone !== tutorTimezone && (
                <div className="text-sm text-blue-700 bg-blue-100 p-2 rounded">
                  <Info className="w-4 h-4 inline mr-1" />
                  Times are automatically converted to your timezone
                </div>
              )}
            </div>
          </div>

          {/* Select Time Slots */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-2">Select Time Slots</h2>
            <p className="text-secondary-600 mb-4">
              Choose up to {classData.weekly_frequency} session
              {classData.weekly_frequency > 1 ? 's' : ''} per week ({selectedSlots.length}{' '}
              selected)
              {studentTimezone !== tutorTimezone && (
                <span className="block mt-1 text-blue-600">
                  Times shown in your timezone ({studentTimezone})
                </span>
              )}
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
                        const isBooked = bookedSlots.some(
                          (s) => s.day === slot.day && s.time === slot.time
                        )
                        
                        // Debug logging for first slot to see what's happening
                        if (index === 0 && bookedSlots.length > 0) {
                          console.log('Checking slot:', slot, 'against booked:', bookedSlots[0], 'isBooked:', isBooked)
                        }
                        
                        return (
                          <button
                            key={`${day}-${slot.time}-${index}`}
                            type="button"
                            onClick={() => toggleSlotSelection(slot)}
                            disabled={isBooked}
                            className={`px-4 py-2 rounded-lg font-medium transition-all ${
                              isBooked
                                ? 'bg-red-100 text-red-400 cursor-not-allowed line-through'
                                : isSelected
                                ? 'bg-primary-600 text-white'
                                : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
                            }`}
                            title={isBooked ? 'This slot is already booked' : ''}
                          >
                            <div className="text-center">
                              <div className="font-medium">{slot.time}</div>
                              {studentTimezone !== tutorTimezone && (
                                <div className="text-xs opacity-75 mt-1">
                                  <DualTimeDisplay
                                    time={slot.time}
                                    fromTz={tutorTimezone}
                                    toTz={studentTimezone}
                                    showLabels={false}
                                    showOffset={false}
                                    compact={true}
                                  />
                                </div>
                              )}
                            </div>
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

        {/* Authentication Prompt Modal */}
        {showAuthPrompt && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Sign In Required
                </h3>
                <p className="text-gray-600">
                  Please sign in to your account to book this class. If you don't have an account, you can create one for free.
                </p>
              </div>

              <div className="space-y-3">
                <Link
                  href={`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`}
                  className="w-full btn-primary text-center block"
                >
                  Sign In
                </Link>
                <Link
                  href={`/signup?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`}
                  className="w-full btn-secondary text-center block"
                >
                  Create Account
                </Link>
                <button
                  onClick={() => setShowAuthPrompt(false)}
                  className="w-full text-gray-500 hover:text-gray-700 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

