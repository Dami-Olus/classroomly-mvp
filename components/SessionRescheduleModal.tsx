'use client'

import { useState, useEffect } from 'react'
import { X, Calendar, Clock, Loader2, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { generateTimeSlotsFromRanges, type TimeRange } from '@/lib/availability'
import toast from 'react-hot-toast'

interface TimeSlot {
  day: string
  time: string
}

interface SessionRescheduleModalProps {
  bookingId: string
  sessionId: string
  currentSession: {
    scheduled_date: string
    scheduled_time: string
    scheduled_day: string
  }
  tutorId: string
  onClose: () => void
  onSuccess: () => void
  currentUserId: string
  userRole: 'tutor' | 'student'
}

export default function SessionRescheduleModal({
  bookingId,
  sessionId,
  currentSession,
  tutorId,
  onClose,
  onSuccess,
  currentUserId,
  userRole,
}: SessionRescheduleModalProps) {
  const supabase = createClient()
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [bookedSlots, setBookedSlots] = useState<TimeSlot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadAvailability()
  }, [])

  const loadAvailability = async () => {
    try {
      // Get tutor's global availability
      const { data: tutorData, error: tutorError } = await supabase
        .from('tutors')
        .select('availability')
        .eq('id', tutorId)
        .single()

      if (tutorError) throw tutorError

      const availability = tutorData?.availability as any
      if (availability?.slots && Array.isArray(availability.slots)) {
        // Generate available slots from tutor's availability
        const slots = generateTimeSlotsFromRanges(
          availability.slots as TimeRange[],
          60 // Default duration, could be passed as prop
        )
        setAvailableSlots(slots)
      }

      // Load all booked slots for this tutor (across all bookings)
      const { data: bookings } = await supabase
        .from('sessions')
        .select('scheduled_day, scheduled_time, booking_id')
        .neq('id', sessionId) // Exclude current session
        .eq('booking_id', bookingId)
        .in('status', ['scheduled', 'rescheduled'])

      // Also check sessions from other bookings of this tutor
      const { data: otherBookings } = await supabase
        .from('bookings')
        .select('id')
        .eq('tutor_id', tutorId)
        .neq('id', bookingId)

      if (otherBookings && otherBookings.length > 0) {
        const { data: otherSessions } = await supabase
          .from('sessions')
          .select('scheduled_day, scheduled_time')
          .in('booking_id', otherBookings.map(b => b.id))
          .in('status', ['scheduled', 'rescheduled'])

        const allBooked = [
          ...(bookings || []),
          ...(otherSessions || [])
        ].map(s => ({
          day: s.scheduled_day,
          time: s.scheduled_time
        }))

        setBookedSlots(allBooked)
      } else {
        setBookedSlots((bookings || []).map(s => ({
          day: s.scheduled_day,
          time: s.scheduled_time
        })))
      }
    } catch (error) {
      console.error('Error loading availability:', error)
      toast.error('Failed to load available time slots')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!selectedSlot) {
      toast.error('Please select a new time slot')
      return
    }

    if (!reason.trim()) {
      toast.error('Please provide a reason for rescheduling')
      return
    }

    setSubmitting(true)

    try {
      // Create reschedule request
      const { error } = await supabase.from('reschedule_requests').insert({
        booking_id: bookingId,
        session_id: sessionId, // Link to specific session
        requested_by: currentUserId,
        original_slot: {
          day: currentSession.scheduled_day,
          time: currentSession.scheduled_time
        },
        proposed_slot: selectedSlot,
        reason: reason.trim(),
        status: 'pending',
      })

      if (error) throw error

      toast.success('Reschedule request sent!')
      onSuccess()
    } catch (error: any) {
      console.error('Error creating reschedule request:', error)
      toast.error(error.message || 'Failed to send reschedule request')
    } finally {
      setSubmitting(false)
    }
  }

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Request Reschedule</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary-600 mb-4" />
              <p className="text-gray-600">Loading available time slots...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Current Session Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Current Schedule</h3>
                <p className="text-blue-800">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  {currentSession.scheduled_day}
                </p>
                <p className="text-blue-800">
                  <Clock className="w-4 h-4 inline mr-2" />
                  {currentSession.scheduled_time}
                </p>
              </div>

              {/* Select New Time Slot */}
              <div>
                <h3 className="font-semibold mb-3">Select New Time Slot</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Choose from available slots (unavailable slots are shown in red)
                </p>

                {availableSlots.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <AlertCircle className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-600">No available time slots found</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Please contact your {userRole === 'tutor' ? 'student' : 'tutor'} to discuss alternative times
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {DAYS_ORDER.map((day) => {
                      const daySlots = slotsByDay[day]
                      if (!daySlots || daySlots.length === 0) return null

                      return (
                        <div key={day}>
                          <h4 className="font-semibold text-gray-900 mb-2">{day}</h4>
                          <div className="flex flex-wrap gap-2">
                            {daySlots.sort((a, b) => a.time.localeCompare(b.time)).map((slot) => {
                              const isSelected = selectedSlot?.day === slot.day && selectedSlot?.time === slot.time
                              const isBooked = bookedSlots.some(
                                (s) => s.day === slot.day && s.time === slot.time
                              )
                              const isCurrent = currentSession.scheduled_day === slot.day && 
                                              currentSession.scheduled_time === slot.time

                              return (
                                <button
                                  key={`${day}-${slot.time}`}
                                  type="button"
                                  onClick={() => setSelectedSlot(slot)}
                                  disabled={isBooked || isCurrent}
                                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                    isCurrent
                                      ? 'bg-blue-100 text-blue-600 cursor-not-allowed'
                                      : isBooked
                                      ? 'bg-red-100 text-red-400 cursor-not-allowed line-through'
                                      : isSelected
                                      ? 'bg-primary-600 text-white'
                                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                  }`}
                                  title={
                                    isCurrent 
                                      ? 'Current time slot' 
                                      : isBooked 
                                      ? 'This slot is already booked' 
                                      : ''
                                  }
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
                )}
              </div>

              {/* Reason */}
              <div>
                <label htmlFor="reason" className="label">
                  Reason for Rescheduling *
                </label>
                <textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="input"
                  rows={3}
                  placeholder="Please explain why you need to reschedule this session..."
                  required
                />
              </div>

              {selectedSlot && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-900 mb-2">New Schedule</h4>
                  <p className="text-green-800">
                    {selectedSlot.day} at {selectedSlot.time}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="btn-secondary"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedSlot || !reason.trim() || submitting || loading}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Sending Request...
              </>
            ) : (
              'Send Reschedule Request'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

