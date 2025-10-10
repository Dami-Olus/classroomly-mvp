import { Database } from './supabase'

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Tutor = Database['public']['Tables']['tutors']['Row']
export type Class = Database['public']['Tables']['classes']['Row']
export type Booking = Database['public']['Tables']['bookings']['Row']
export type Classroom = Database['public']['Tables']['classrooms']['Row']
export type Message = Database['public']['Tables']['messages']['Row']
export type Material = Database['public']['Tables']['materials']['Row']

export type UserRole = 'tutor' | 'student' | 'admin'
export type BookingStatus = 'pending' | 'confirmed' | 'rescheduled' | 'completed' | 'cancelled'
export type ClassroomStatus = 'scheduled' | 'live' | 'completed' | 'cancelled'
export type MessageType = 'text' | 'file' | 'system'

// Updated TimeSlot to support ranges
export interface TimeSlot {
  day: string
  startTime: string  // e.g., "08:00"
  endTime: string    // e.g., "17:00"
}

// For actual booked sessions
export interface BookedSlot {
  day: string
  time: string       // Specific time chosen from range
  dateTime?: string
}

export interface TutorWithProfile extends Tutor {
  profile?: Profile
}

export interface ClassWithTutor extends Class {
  tutor?: TutorWithProfile
}

export interface BookingWithDetails extends Booking {
  class?: ClassWithTutor
  student?: Profile
  classrooms?: Classroom[]
}

export interface ClassroomWithDetails extends Classroom {
  booking?: BookingWithDetails
  messages?: Message[]
  materials?: Material[]
}
