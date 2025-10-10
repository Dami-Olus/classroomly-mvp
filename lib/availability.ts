// Utility functions for handling availability ranges

export interface TimeRange {
  day: string
  startTime: string
  endTime: string
}

export interface TimeSlot {
  day: string
  time: string
}

/**
 * Generate specific time slots from time ranges based on class duration
 * Example: Monday 08:00-17:00 with 60min duration → 08:00, 09:00, 10:00, ..., 16:00
 */
export function generateTimeSlotsFromRanges(
  ranges: TimeRange[],
  durationMinutes: number
): TimeSlot[] {
  const slots: TimeSlot[] = []

  ranges.forEach((range) => {
    const { day, startTime, endTime } = range
    
    // Convert times to minutes
    const [startHour, startMin] = startTime.split(':').map(Number)
    const [endHour, endMin] = endTime.split(':').map(Number)
    
    const startMinutes = startHour * 60 + startMin
    const endMinutes = endHour * 60 + endMin
    
    // Generate slots at duration intervals
    let currentMinutes = startMinutes
    
    while (currentMinutes + durationMinutes <= endMinutes) {
      const hours = Math.floor(currentMinutes / 60)
      const minutes = currentMinutes % 60
      const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
      
      slots.push({
        day,
        time: timeString,
      })
      
      currentMinutes += durationMinutes
    }
  })

  return slots
}

/**
 * Format time range for display
 */
export function formatTimeRange(startTime: string, endTime: string): string {
  return `${formatTime(startTime)} - ${formatTime(endTime)}`
}

/**
 * Format time in 12-hour format
 */
export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
}

/**
 * Calculate duration between two times in minutes
 */
export function calculateDuration(startTime: string, endTime: string): number {
  const [startHour, startMin] = startTime.split(':').map(Number)
  const [endHour, endMin] = endTime.split(':').map(Number)
  
  const startMinutes = startHour * 60 + startMin
  const endMinutes = endHour * 60 + endMin
  
  return endMinutes - startMinutes
}

/**
 * Format duration in human-readable format
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  
  if (hours === 0) return `${mins}min`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}min`
}

