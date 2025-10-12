import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { classId, tutorId, selectedSlots } = await request.json()

    console.log('🌍 GLOBAL CONFLICT CHECK - Checking tutor availability across ALL classes')
    console.log('Tutor ID:', tutorId)
    console.log('Class ID:', classId)
    console.log('Selected slots:', selectedSlots)

    // Get all confirmed bookings for this TUTOR (across all classes)
    // This is the key change: query by tutor_id instead of class_id
    let query = supabase
      .from('bookings')
      .select('scheduled_slots, class_id')
      .in('status', ['confirmed', 'rescheduled'])

    if (tutorId) {
      // Global tutor availability - check ALL tutor's bookings
      query = query.eq('tutor_id', tutorId)
      console.log('Querying by tutor_id (global availability)')
    } else if (classId) {
      // Fallback to class-specific (old behavior)
      query = query.eq('class_id', classId)
      console.log('Querying by class_id (legacy behavior)')
    } else {
      throw new Error('Either tutorId or classId must be provided')
    }

    const { data: bookings, error } = await query

    if (error) throw error

    console.log('Found bookings:', bookings?.length || 0)

    // Check for conflicts
    const conflicts: string[] = []
    
    if (bookings) {
      bookings.forEach((booking) => {
        const bookedSlots = booking.scheduled_slots as Array<{ day: string; time: string }>
        
        selectedSlots.forEach((newSlot: { day: string; time: string }) => {
          const hasConflict = bookedSlots.some(
            (booked) => booked.day === newSlot.day && booked.time === newSlot.time
          )
          
          if (hasConflict) {
            conflicts.push(`${newSlot.day} at ${newSlot.time}`)
          }
        })
      })
    }

    console.log('Conflicts found:', conflicts)

    return NextResponse.json({
      hasConflicts: conflicts.length > 0,
      conflicts,
    })
  } catch (error: any) {
    console.error('Error checking conflicts:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to check conflicts' },
      { status: 500 }
    )
  }
}

