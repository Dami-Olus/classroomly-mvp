'use client'

import { useState } from 'react'
import { Plus, X, Calendar as CalendarIcon } from 'lucide-react'

interface TimeSlot {
  day: string
  startTime: string
  endTime: string
}

interface AvailabilitySelectorProps {
  availableSlots: TimeSlot[]
  onChange: (slots: TimeSlot[]) => void
}

const DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
]

const TIME_OPTIONS = [
  '00:00', '01:00', '02:00', '03:00', '04:00', '05:00',
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00', '22:00', '23:00',
]

export default function AvailabilitySelector({
  availableSlots,
  onChange,
}: AvailabilitySelectorProps) {
  const [selectedDay, setSelectedDay] = useState(DAYS[0])
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('17:00')

  const addTimeSlot = () => {
    // Validate that end time is after start time
    if (startTime >= endTime) {
      return
    }

    // Check if this day already has a range that overlaps
    const hasOverlap = availableSlots.some(
      (slot) =>
        slot.day === selectedDay &&
        ((startTime >= slot.startTime && startTime < slot.endTime) ||
          (endTime > slot.startTime && endTime <= slot.endTime) ||
          (startTime <= slot.startTime && endTime >= slot.endTime))
    )

    if (hasOverlap) {
      return
    }

    onChange([
      ...availableSlots,
      { day: selectedDay, startTime, endTime },
    ])
  }

  const removeTimeSlot = (index: number) => {
    onChange(availableSlots.filter((_, i) => i !== index))
  }

  // Quick add buttons for common schedules
  const addMorning = () => {
    setStartTime('09:00')
    setEndTime('12:00')
  }

  const addAfternoon = () => {
    setStartTime('13:00')
    setEndTime('17:00')
  }

  const addEvening = () => {
    setStartTime('18:00')
    setEndTime('21:00')
  }

  const addFullDay = () => {
    setStartTime('09:00')
    setEndTime('17:00')
  }

  // Group slots by day for display
  const slotsByDay = availableSlots.reduce((acc, slot, index) => {
    if (!acc[slot.day]) {
      acc[slot.day] = []
    }
    acc[slot.day].push({ ...slot, index })
    return acc
  }, {} as Record<string, (TimeSlot & { index: number })[]>)

  return (
    <div className="space-y-6">
      {/* Add Time Range */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="text-xs text-secondary-600 block mb-1">Day</label>
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              className="input"
            >
              {DAYS.map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="text-xs text-secondary-600 block mb-1">
              Start Time
            </label>
            <select
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="input"
            >
              {TIME_OPTIONS.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="text-xs text-secondary-600 block mb-1">
              End Time
            </label>
            <select
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="input"
            >
              {TIME_OPTIONS.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={addTimeSlot}
            disabled={startTime >= endTime}
            className="btn-primary flex items-center gap-2 whitespace-nowrap self-end"
          >
            <Plus className="w-4 h-4" />
            Add Range
          </button>
        </div>

        {/* Quick Add Buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={addMorning}
            className="text-xs btn-secondary"
          >
            Morning (9-12)
          </button>
          <button
            type="button"
            onClick={addAfternoon}
            className="text-xs btn-secondary"
          >
            Afternoon (13-17)
          </button>
          <button
            type="button"
            onClick={addEvening}
            className="text-xs btn-secondary"
          >
            Evening (18-21)
          </button>
          <button
            type="button"
            onClick={addFullDay}
            className="text-xs btn-secondary"
          >
            Full Day (9-17)
          </button>
        </div>
      </div>

      {/* Display Selected Slots */}
      {availableSlots.length === 0 ? (
        <div className="text-center py-8 bg-secondary-50 rounded-lg border-2 border-dashed border-secondary-200">
          <CalendarIcon className="w-12 h-12 text-secondary-300 mx-auto mb-2" />
          <p className="text-secondary-600">
            No availability set yet. Add time ranges to show when you're free.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <h3 className="font-semibold text-secondary-900 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            Your Weekly Availability ({availableSlots.length} range
            {availableSlots.length !== 1 ? 's' : ''})
          </h3>

          {DAYS.map((day) => {
            const daySlots = slotsByDay[day]
            if (!daySlots || daySlots.length === 0) return null

            return (
              <div key={day} className="bg-secondary-50 rounded-lg p-4">
                <h4 className="font-semibold text-secondary-900 mb-3">
                  {day}
                </h4>
                <div className="space-y-2">
                  {daySlots
                    .sort((a, b) => a.startTime.localeCompare(b.startTime))
                    .map((slot) => (
                      <div
                        key={slot.index}
                        className="flex items-center justify-between bg-white rounded-lg p-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
                          <span className="font-mono font-medium text-secondary-900">
                            {slot.startTime}
                          </span>
                          <span className="text-secondary-500">→</span>
                          <span className="font-mono font-medium text-secondary-900">
                            {slot.endTime}
                          </span>
                          <span className="text-xs text-secondary-500">
                            ({calculateDuration(slot.startTime, slot.endTime)})
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeTimeSlot(slot.index)}
                          className="text-red-600 hover:text-red-700 p-1 hover:bg-red-50 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <strong>💡 How it works:</strong> Students will see these time ranges 
          and can select specific times within them when booking. For example, if you 
          set "Monday 8:00 - 17:00", students can book at 8:00, 9:00, 10:00, etc. 
          based on your class duration.
        </p>
      </div>
    </div>
  )
}

function calculateDuration(start: string, end: string): string {
  const [startHour, startMin] = start.split(':').map(Number)
  const [endHour, endMin] = end.split(':').map(Number)
  
  const startMinutes = startHour * 60 + startMin
  const endMinutes = endHour * 60 + endMin
  const duration = endMinutes - startMinutes
  
  const hours = Math.floor(duration / 60)
  const minutes = duration % 60
  
  if (hours === 0) return `${minutes}min`
  if (minutes === 0) return `${hours}h`
  return `${hours}h ${minutes}min`
}
