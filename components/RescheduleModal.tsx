'use client'

import { useState } from 'react'
import { X, Calendar, Clock, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

interface TimeSlot {
  day: string
  time: string
}

interface RescheduleModalProps {
  bookingId: string
  currentSlot: TimeSlot
  availableSlots: TimeSlot[]
  onClose: () => void
  onSuccess: () => void
  currentUserId: string
}

export default function RescheduleModal({
  bookingId,
  currentSlot,
  availableSlots,
  onClose,
  onSuccess,
  currentUserId,
}: RescheduleModalProps) {
  const supabase = createClient()
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

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
        requested_by: currentUserId,
        original_slot: currentSlot,
        proposed_slot: selectedSlot,
        reason: reason.trim(),
        status: 'pending',
      })

      if (error) throw error

      toast.success('Reschedule request sent!')
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Error creating reschedule request:', error)
      
      if (error.message?.includes('Maximum reschedule requests')) {
        toast.error('Maximum reschedule limit reached for this booking')
      } else {
        toast.error(error.message || 'Failed to send reschedule request')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Request Reschedule</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
            disabled={submitting}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Current Slot */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Current Time:</p>
            <div className="flex items-center gap-3 text-lg">
              <Calendar className="w-5 h-5 text-primary-600" />
              <span className="font-semibold">{currentSlot.day}</span>
              <Clock className="w-5 h-5 text-gray-400 ml-4" />
              <span>{currentSlot.time}</span>
            </div>
          </div>

          {/* Select New Slot */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Select New Time:</h3>
            
            {availableSlots.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No available time slots</p>
                <p className="text-sm mt-2">
                  The tutor's availability may be fully booked. Please contact them directly.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {DAYS_ORDER.map((day) => {
                  const daySlots = slotsByDay[day]
                  if (!daySlots || daySlots.length === 0) return null

                  return (
                    <div key={day}>
                      <h4 className="font-medium text-gray-900 mb-2">{day}</h4>
                      <div className="flex flex-wrap gap-2">
                        {daySlots
                          .sort((a, b) => a.time.localeCompare(b.time))
                          .map((slot, index) => {
                            const isSelected =
                              selectedSlot?.day === slot.day &&
                              selectedSlot?.time === slot.time
                            const isCurrent =
                              currentSlot.day === slot.day &&
                              currentSlot.time === slot.time

                            return (
                              <button
                                key={`${day}-${slot.time}-${index}`}
                                type="button"
                                onClick={() => setSelectedSlot(slot)}
                                disabled={isCurrent}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                  isCurrent
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : isSelected
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                              >
                                {slot.time}
                                {isCurrent && (
                                  <span className="ml-2 text-xs">(current)</span>
                                )}
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

          {/* Selected Slot Preview */}
          {selectedSlot && (
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
              <p className="text-sm font-medium text-primary-900 mb-2">
                New proposed time:
              </p>
              <div className="flex items-center gap-3 text-lg text-primary-900">
                <Calendar className="w-5 h-5" />
                <span className="font-semibold">{selectedSlot.day}</span>
                <Clock className="w-5 h-5 ml-4" />
                <span>{selectedSlot.time}</span>
              </div>
            </div>
          )}

          {/* Reason */}
          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Rescheduling *
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="input"
              placeholder="Please explain why you need to reschedule..."
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              This will be shared with the other party
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={submitting}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !selectedSlot || !reason.trim()}
            className="btn-primary"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin inline-block mr-2" />
                Sending...
              </>
            ) : (
              'Send Request'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

