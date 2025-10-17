import { createClient } from '@/lib/supabase/client'

export interface ClassroomData {
  id: string
  room_url: string
  booking_id: string
  status: 'scheduled' | 'live' | 'completed' | 'cancelled'
  class_info?: {
    title: string
    subject: string
    duration: number
    tutor_name: string
  }
  booking_info?: {
    student_name: string
    student_email: string
    scheduled_date: string
    scheduled_time: string
  }
}

export interface CreateRoomResponse {
  roomName: string
  roomUrl: string
  config: any
}

export class ClassroomService {
  private supabase = createClient()

  async loadClassroom(roomUrl: string): Promise<ClassroomData | null> {
    try {
      // First, get the classroom data
      const { data: classroomData, error: classroomError } = await this.supabase
        .from('classrooms')
        .select('*')
        .eq('room_url', roomUrl)
        .single()

      if (classroomError) {
        console.error('Error loading classroom:', classroomError)
        return null
      }

      if (!classroomData) {
        return null
      }

      // Then get the booking data
      const { data: bookingData, error: bookingError } = await this.supabase
        .from('bookings')
        .select('*')
        .eq('id', classroomData.booking_id)
        .single()

      if (bookingError) {
        console.error('Error loading booking:', bookingError)
        return null
      }

      // Then get the class data
      const { data: classData, error: classError } = await this.supabase
        .from('classes')
        .select(`
          *,
          tutors!inner (
            user_id,
            profiles!inner (
              first_name,
              last_name
            )
          )
        `)
        .eq('id', bookingData.class_id)
        .single()

      if (classError) {
        console.error('Error loading class:', classError)
        return null
      }

      // Transform the data into a cleaner structure
      return {
        id: classroomData.id,
        room_url: classroomData.room_url,
        booking_id: classroomData.booking_id,
        status: classroomData.status as any,
        class_info: classData ? {
          title: classData.title || 'Tutoring Session',
          subject: classData.subject || 'General',
          duration: classData.duration || 60,
          tutor_name: classData.tutors?.profiles 
            ? `${classData.tutors.profiles.first_name} ${classData.tutors.profiles.last_name}`
            : 'Unknown Tutor'
        } : undefined,
        booking_info: bookingData ? {
          student_name: bookingData.student_name || 'Guest',
          student_email: bookingData.student_email || '',
          scheduled_date: bookingData.scheduled_date || '',
          scheduled_time: bookingData.scheduled_time || ''
        } : undefined
      }
    } catch (error) {
      console.error('Error in loadClassroom:', error)
      return null
    }
  }

  async createDailyRoom(roomName: string): Promise<CreateRoomResponse> {
    try {
      const response = await fetch('/api/daily/create-room', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roomName }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create room')
      }

      const roomData = await response.json()
      
      if (roomData.error) {
        throw new Error(roomData.error)
      }

      return {
        roomName: roomData.roomName,
        roomUrl: roomData.roomUrl,
        config: roomData.config
      }
    } catch (error: any) {
      console.error('Error creating Daily room:', error)
      throw new Error(error.message || 'Failed to create room')
    }
  }

  async updateClassroomStatus(roomUrl: string, status: string): Promise<void> {
    try {
      // First check if the classroom exists
      const { data: existingClassroom, error: checkError } = await this.supabase
        .from('classrooms')
        .select('id, room_url')
        .eq('room_url', roomUrl)
        .single()

      if (checkError) {
        console.warn('Classroom not found for room URL:', roomUrl, checkError)
        // Don't throw error - just log and continue
        return
      }

      if (!existingClassroom) {
        console.warn('No classroom found with room URL:', roomUrl)
        return
      }

      // Update the classroom status
      const { error } = await this.supabase
        .from('classrooms')
        .update({ status })
        .eq('room_url', roomUrl)

      if (error) {
        console.error('Error updating classroom status:', error)
        throw new Error('Failed to update classroom status')
      }

      console.log('Successfully updated classroom status:', { roomUrl, status })
    } catch (error: any) {
      console.error('Error in updateClassroomStatus:', error)
      // Don't throw error - just log and continue
      console.warn('Continuing without updating classroom status')
    }
  }

  async validateRoomAccess(roomUrl: string, userEmail?: string): Promise<boolean> {
    try {
      const classroom = await this.loadClassroom(roomUrl)
      
      if (!classroom) {
        console.log('❌ No classroom found for room URL:', roomUrl)
        return false
      }

      // If user is not logged in, allow access for now (MVP)
      if (!userEmail) {
        console.log('✅ No user email provided, allowing access (MVP mode)')
        return true
      }

      // Check if user is the student for this booking
      const studentEmail = classroom.booking_info?.student_email
      if (studentEmail && studentEmail.toLowerCase() === userEmail.toLowerCase()) {
        console.log('✅ Student access granted for:', userEmail)
        return true
      }

      // Check if user is the tutor for this class
      // First get the booking to find the class_id
      const { data: bookingData, error: bookingError } = await this.supabase
        .from('bookings')
        .select('class_id')
        .eq('id', classroom.booking_id)
        .single()

      if (!bookingError && bookingData?.class_id) {
        const { data: classData, error: classError } = await this.supabase
          .from('classes')
          .select(`
            tutors!inner (
              user_id,
              profiles!inner (
                email
              )
            )
          `)
          .eq('id', bookingData.class_id)
          .single()

        if (!classError && classData?.tutors?.profiles?.email) {
          const tutorEmail = classData.tutors.profiles.email
          if (tutorEmail.toLowerCase() === userEmail.toLowerCase()) {
            console.log('✅ Tutor access granted for:', userEmail)
            return true
          }
        }
      }

      console.log('❌ Access denied for:', userEmail)
      console.log('❌ Student email in booking:', studentEmail)
      console.log('❌ Classroom data:', classroom)
      return false
    } catch (error) {
      console.error('Error validating room access:', error)
      return false
    }
  }
}

export const classroomService = new ClassroomService()
