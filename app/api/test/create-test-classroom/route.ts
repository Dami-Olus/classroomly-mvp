import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Get the first student and tutor for testing
    const { data: students } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'student')
      .limit(1)

    const { data: tutors } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'tutor')
      .limit(1)

    if (!students?.[0] || !tutors?.[0]) {
      return NextResponse.json(
        { error: 'No students or tutors found' },
        { status: 400 }
      )
    }

    // Create a test class
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .insert({
        tutor_id: tutors[0].id,
        title: 'Test Math Class',
        subject: 'Mathematics',
        description: 'A test class for video sessions',
        duration: 60,
        weekly_frequency: 2,
        is_active: true,
      })
      .select()
      .single()

    if (classError) throw classError

    // Create a test booking
    const { data: bookingData, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        student_id: students[0].id,
        class_id: classData.id,
        student_name: 'Test Student',
        student_email: 'test@example.com',
        status: 'confirmed',
        total_sessions: 4,
        completed_sessions: 0,
        scheduled_slots: [
          { day: 'Monday', time: '10:00' },
          { day: 'Wednesday', time: '10:00' }
        ],
      })
      .select()
      .single()

    if (bookingError) throw bookingError

    // Create a test classroom
    const roomUrl = `test-classroom-${Date.now()}`
    const { data: classroomData, error: classroomError } = await supabase
      .from('classrooms')
      .insert({
        booking_id: bookingData.id,
        room_url: roomUrl,
        status: 'scheduled',
      })
      .select()
      .single()

    if (classroomError) throw classroomError

    return NextResponse.json({
      success: true,
      classroom: classroomData,
      booking: bookingData,
      class: classData,
      message: 'Test classroom created successfully',
      roomUrl: roomUrl,
      classroomUrl: `/classroom/${roomUrl}`
    })

  } catch (error: any) {
    console.error('Error creating test classroom:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create test classroom' },
      { status: 500 }
    )
  }
}
