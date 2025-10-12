'use client'

import { useState } from 'react'
import { Calendar, Clock, CheckCircle, XCircle, Loader2, MessageSquare } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

interface RescheduleRequest {
  id: string
  original_slot: { day: string; time: string }
  proposed_slot: { day: string; time: string }
  reason: string
  status: string
  response_note: string | null
  created_at: string
  responded_at: string | null
  requester: {
    first_name: string
    last_name: string
  }
  responder?: {
    first_name: string
    last_name: string
  }
}

interface RescheduleRequestsProps {
  requests: RescheduleRequest[]
  currentUserId: string
  bookingId: string
  onUpdate: () => void
}

export default function RescheduleRequests({
  requests,
  currentUserId,
  bookingId,
  onUpdate,
}: RescheduleRequestsProps) {
  const supabase = createClient()
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [responseNote, setResponseNote] = useState<Record<string, string>>({})

  const handleRespond = async (requestId: string, action: 'accepted' | 'declined') => {
    setProcessingId(requestId)

    try {
      const request = requests.find((r) => r.id === requestId)
      if (!request) throw new Error('Request not found')

      // Update reschedule request status
      const { error: updateError } = await supabase
        .from('reschedule_requests')
        .update({
          status: action,
          responded_by: currentUserId,
          response_note: responseNote[requestId] || null,
          responded_at: new Date().toISOString(),
        })
        .eq('id', requestId)

      if (updateError) throw updateError

      // If accepted, update the booking's scheduled_slots
      if (action === 'accepted') {
        // Get current booking
        const { data: booking, error: fetchError } = await supabase
          .from('bookings')
          .select('scheduled_slots')
          .eq('id', bookingId)
          .single()

        if (fetchError) throw fetchError

        // Update the slot in the array
        const slots = booking.scheduled_slots as Array<{ day: string; time: string }>
        const updatedSlots = slots.map((slot) =>
          slot.day === request.original_slot.day && slot.time === request.original_slot.time
            ? request.proposed_slot
            : slot
        )

        // Update booking with new slots
        const { error: bookingUpdateError } = await supabase
          .from('bookings')
          .update({
            scheduled_slots: updatedSlots,
            status: 'rescheduled',
          })
          .eq('id', bookingId)

        if (bookingUpdateError) throw bookingUpdateError

        toast.success('Reschedule request accepted and booking updated!')
      } else {
        toast.success('Reschedule request declined')
      }

      onUpdate()
    } catch (error: any) {
      console.error('Error responding to reschedule request:', error)
      toast.error(error.message || 'Failed to respond to request')
    } finally {
      setProcessingId(null)
    }
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p>No reschedule requests</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => {
        const isPending = request.status === 'pending'
        const isRequester = request.requester && currentUserId
        const canRespond = isPending && !isRequester

        return (
          <div
            key={request.id}
            className={`bg-white border rounded-lg p-4 ${
              isPending ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200'
            }`}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-gray-900">
                    {request.requester.first_name} {request.requester.last_name}
                  </span>
                  <span className="text-sm text-gray-500">requested reschedule</span>
                </div>
                <p className="text-xs text-gray-500">
                  {new Date(request.created_at).toLocaleString()}
                </p>
              </div>
              
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  request.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-800'
                    : request.status === 'accepted'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
              </span>
            </div>

            {/* Time Change */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Original */}
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs font-medium text-gray-600 mb-2">Original Time:</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{request.original_slot.day}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span>{request.original_slot.time}</span>
                  </div>
                </div>
              </div>

              {/* Proposed */}
              <div className="bg-primary-50 rounded-lg p-3 border border-primary-200">
                <p className="text-xs font-medium text-primary-900 mb-2">Proposed Time:</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-primary-600" />
                    <span className="font-medium text-primary-900">
                      {request.proposed_slot.day}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-primary-600" />
                    <span className="text-primary-900">{request.proposed_slot.time}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Reason */}
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <div className="flex items-start gap-2">
                <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-600 mb-1">Reason:</p>
                  <p className="text-sm text-gray-700">{request.reason}</p>
                </div>
              </div>
            </div>

            {/* Response Note (if exists) */}
            {request.response_note && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-xs font-medium text-blue-900 mb-1">Response:</p>
                <p className="text-sm text-blue-800">{request.response_note}</p>
                {request.responder && (
                  <p className="text-xs text-blue-600 mt-1">
                    - {request.responder.first_name} {request.responder.last_name}
                  </p>
                )}
              </div>
            )}

            {/* Actions (if pending and user can respond) */}
            {canRespond && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Response Note (Optional)
                  </label>
                  <textarea
                    value={responseNote[request.id] || ''}
                    onChange={(e) =>
                      setResponseNote({ ...responseNote, [request.id]: e.target.value })
                    }
                    rows={2}
                    className="input text-sm"
                    placeholder="Add a note to your response..."
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleRespond(request.id, 'accepted')}
                    disabled={processingId === request.id}
                    className="flex-1 btn-primary flex items-center justify-center gap-2"
                  >
                    {processingId === request.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Accept
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleRespond(request.id, 'declined')}
                    disabled={processingId === request.id}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                  >
                    {processingId === request.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <XCircle className="w-4 h-4" />
                        Decline
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Response Info (if not pending) */}
            {!isPending && request.responded_at && (
              <div className="text-xs text-gray-500 mt-2">
                Responded on {new Date(request.responded_at).toLocaleString()}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

