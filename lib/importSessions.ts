import { createClient } from '@/lib/supabase/client'
import { generateSessions, createSessions } from '@/lib/sessions'

export interface ImportRow {
  studentName: string
  studentEmail: string
  days: string // Comma-separated: "Monday,Wednesday"
  time: string // HH:MM format
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export interface ImportSummary {
  totalStudents: number
  totalSessions: number
  studentsToCreate: number
  studentsExisting: number
  conflicts: string[]
}

/**
 * Generate CSV template for session import
 */
export function generateImportTemplate(): string {
  const headers = ['Student Name', 'Student Email', 'Days (comma-separated)', 'Time (HH:MM)']
  const exampleRows = [
    ['John Doe', 'john@example.com', 'Monday,Wednesday', '14:00'],
    ['Jane Smith', 'jane@example.com', 'Tuesday,Thursday', '16:00'],
    ['Bob Johnson', 'bob@example.com', 'Friday', '10:00'],
  ]

  const csvContent = [
    headers.join(','),
    ...exampleRows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')

  return csvContent
}

/**
 * Download CSV template
 */
export function downloadTemplate() {
  const csv = generateImportTemplate()
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', 'session_import_template.csv')
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Parse CSV file
 */
export async function parseCSV(file: File): Promise<ImportRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const lines = text.split('\n').filter(line => line.trim())
        
        if (lines.length < 2) {
          throw new Error('CSV file is empty or has no data rows')
        }

        // Skip header row
        const dataLines = lines.slice(1)
        
        const rows: ImportRow[] = dataLines.map((line, index) => {
          // Handle CSV with quoted fields
          const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g)
          if (!matches || matches.length < 4) {
            throw new Error(`Row ${index + 2}: Invalid format. Expected 4 columns.`)
          }

          const [name, email, days, time] = matches.map(m => m.replace(/^"|"$/g, '').trim())

          return {
            studentName: name,
            studentEmail: email,
            days: days,
            time: time
          }
        })

        resolve(rows)
      } catch (error: any) {
        reject(error)
      }
    }
    
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}

/**
 * Validate import data
 */
export function validateImportData(rows: ImportRow[]): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/

  rows.forEach((row, index) => {
    const rowNum = index + 2 // Account for header row

    // Validate student name
    if (!row.studentName || row.studentName.trim().length < 2) {
      errors.push(`Row ${rowNum}: Student name is required and must be at least 2 characters`)
    }

    // Validate email format
    if (row.studentEmail && !row.studentEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      errors.push(`Row ${rowNum}: Invalid email format: ${row.studentEmail}`)
    }

    // Validate days
    const daysList = row.days.split(',').map(d => d.trim())
    daysList.forEach(day => {
      if (!validDays.includes(day)) {
        errors.push(`Row ${rowNum}: Invalid day "${day}". Use: Monday, Tuesday, etc.`)
      }
    })

    if (daysList.length === 0) {
      errors.push(`Row ${rowNum}: At least one day is required`)
    }

    // Validate time format
    if (!row.time.match(timeRegex)) {
      errors.push(`Row ${rowNum}: Invalid time format "${row.time}". Use HH:MM (e.g., 14:00, 09:30)`)
    }

    // Warning for missing email
    if (!row.studentEmail) {
      warnings.push(`Row ${rowNum}: No email provided for ${row.studentName}. Student won't receive notifications.`)
    }
  })

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Check for scheduling conflicts
 */
export async function checkImportConflicts(
  rows: ImportRow[],
  tutorId: string,
  classId: string
): Promise<string[]> {
  const supabase = createClient()
  const conflicts: string[] = []

  try {
    // Get all existing bookings for this tutor
    const { data: existingBookings } = await supabase
      .from('bookings')
      .select('id, student_name, scheduled_slots')
      .eq('tutor_id', tutorId)
      .in('status', ['confirmed', 'rescheduled'])

    if (!existingBookings) return conflicts

    // Extract all booked slots
    const bookedSlots: Array<{ day: string; time: string; studentName: string }> = []
    existingBookings.forEach(booking => {
      booking.scheduled_slots?.forEach((slot: any) => {
        bookedSlots.push({
          day: slot.day,
          time: slot.time,
          studentName: booking.student_name
        })
      })
    })

    // Check each import row for conflicts
    rows.forEach(row => {
      const daysList = row.days.split(',').map(d => d.trim())
      
      daysList.forEach(day => {
        const conflict = bookedSlots.find(
          booked => booked.day === day && booked.time === row.time
        )
        
        if (conflict) {
          conflicts.push(
            `${row.studentName} (${day} ${row.time}) conflicts with existing booking for ${conflict.studentName}`
          )
        }
      })
    })
  } catch (error) {
    console.error('Error checking conflicts:', error)
  }

  return conflicts
}

/**
 * Generate import summary
 */
export async function generateImportSummary(
  rows: ImportRow[],
  tutorId: string
): Promise<ImportSummary> {
  const supabase = createClient()
  
  // Get unique students
  const uniqueStudents = new Set(rows.map(r => r.studentEmail.toLowerCase()).filter(Boolean))
  const totalStudents = uniqueStudents.size || rows.length

  // Check which students already exist
  let studentsExisting = 0
  if (uniqueStudents.size > 0) {
    const { data: existingProfiles } = await supabase
      .from('profiles')
      .select('email')
      .in('email', Array.from(uniqueStudents))

    studentsExisting = existingProfiles?.length || 0
  }

  // Calculate total sessions (each row can have multiple days)
  const totalSessions = rows.reduce((sum, row) => {
    const daysCount = row.days.split(',').length
    return sum + daysCount
  }, 0)

  return {
    totalStudents,
    totalSessions,
    studentsToCreate: totalStudents - studentsExisting,
    studentsExisting,
    conflicts: await checkImportConflicts(rows, tutorId, '')
  }
}

/**
 * Import sessions from CSV data
 */
export async function importSessions(
  rows: ImportRow[],
  classId: string,
  tutorId: string,
  totalSessionsPerStudent: number = 12,
  startDate: Date = new Date()
): Promise<{ success: boolean; bookingsCreated: number; sessionsCreated: number; error?: string }> {
  const supabase = createClient()

  try {
    let bookingsCreated = 0
    let sessionsCreated = 0

    // Process each student (row)
    for (const row of rows) {
      // Create or get student profile
      let studentId: string | null = null

      if (row.studentEmail) {
        // Check if student already exists
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', row.studentEmail.toLowerCase())
          .single()

        if (existingProfile) {
          studentId = existingProfile.id
        }
      }

      // Parse days and create scheduled slots
      const daysList = row.days.split(',').map(d => d.trim())
      const scheduledSlots = daysList.map(day => ({
        day,
        time: row.time
      }))

      // Validate scheduled slots
      if (!scheduledSlots || scheduledSlots.length === 0) {
        throw new Error(`No valid time slots for student ${row.studentName}. Please check the days and time format.`)
      }

      // Create booking
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          class_id: classId,
          tutor_id: tutorId,
          student_id: studentId,
          student_name: row.studentName,
          student_email: row.studentEmail || null,
          scheduled_slots: scheduledSlots,
          total_sessions: totalSessionsPerStudent,
          sessions_per_week: daysList.length,
          start_date: startDate.toISOString().split('T')[0],
          status: 'confirmed'
        })
        .select()
        .single()

      if (bookingError) {
        console.error('Error creating booking:', bookingError)
        throw new Error(`Failed to create booking for ${row.studentName}: ${bookingError.message}`)
      }

      bookingsCreated++

      // Generate sessions for this booking
      const classSchedule = {
        days: daysList,
        times: daysList.map(() => row.time), // Same time for all days
        duration: 60 // Default duration, could be from class settings
      }

      const sessions = await generateSessions({
        bookingId: booking.id,
        classSchedule,
        startDate,
        totalSessions: totalSessionsPerStudent
      })

      // Create all sessions
      await createSessions(sessions)
      sessionsCreated += sessions.length
    }

    return {
      success: true,
      bookingsCreated,
      sessionsCreated
    }
  } catch (error: any) {
    console.error('Error importing sessions:', error)
    return {
      success: false,
      bookingsCreated: 0,
      sessionsCreated: 0,
      error: error.message || 'Failed to import sessions'
    }
  }
}

