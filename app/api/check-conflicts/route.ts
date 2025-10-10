import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { classId, selectedSlots } = await request.json()

    // Get all confirmed bookings for this class
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('scheduled_slots')
      .eq('class_id', classId)
      .in('status', ['confirmed', 'rescheduled'])

    if (error) throw error

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

