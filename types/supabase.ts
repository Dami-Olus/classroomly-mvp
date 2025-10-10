export type Json =
  | string
  | number
  | boolean
  | null
  | { [key]: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          first_name: string
          last_name: string
          role: 'tutor' | 'student' | 'admin'
          profile_image: string | null
          timezone: string | null
          is_email_verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          first_name: string
          last_name: string
          role?: 'tutor' | 'student' | 'admin'
          profile_image?: string | null
          timezone?: string | null
          is_email_verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          first_name?: string
          last_name?: string
          role?: 'tutor' | 'student' | 'admin'
          profile_image?: string | null
          timezone?: string | null
          is_email_verified?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      tutors: {
        Row: {
          id: string
          user_id: string
          bio: string | null
          expertise: string[]
          education: string | null
          experience: string | null
          hourly_rate: number | null
          availability: Json | null
          rating: number | null
          total_reviews: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          bio?: string | null
          expertise?: string[]
          education?: string | null
          experience?: string | null
          hourly_rate?: number | null
          availability?: Json | null
          rating?: number | null
          total_reviews?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          bio?: string | null
          expertise?: string[]
          education?: string | null
          experience?: string | null
          hourly_rate?: number | null
          availability?: Json | null
          rating?: number | null
          total_reviews?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      classes: {
        Row: {
          id: string
          tutor_id: string
          title: string
          subject: string
          description: string | null
          duration: 30 | 60 | 120
          weekly_frequency: number
          price_per_session: number | null
          available_slots: Json
          booking_link: string
          max_students: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tutor_id: string
          title: string
          subject: string
          description?: string | null
          duration: 30 | 60 | 120
          weekly_frequency: number
          price_per_session?: number | null
          available_slots?: Json
          booking_link: string
          max_students?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tutor_id?: string
          title?: string
          subject?: string
          description?: string | null
          duration?: 30 | 60 | 120
          weekly_frequency?: number
          price_per_session?: number | null
          available_slots?: Json
          booking_link?: string
          max_students?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          class_id: string
          student_id: string | null
          student_name: string
          student_email: string
          scheduled_slots: Json
          status: 'pending' | 'confirmed' | 'rescheduled' | 'completed' | 'cancelled'
          total_sessions: number
          completed_sessions: number
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          class_id: string
          student_id?: string | null
          student_name: string
          student_email: string
          scheduled_slots: Json
          status?: 'pending' | 'confirmed' | 'rescheduled' | 'completed' | 'cancelled'
          total_sessions: number
          completed_sessions?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          class_id?: string
          student_id?: string | null
          student_name?: string
          student_email?: string
          scheduled_slots?: Json
          status?: 'pending' | 'confirmed' | 'rescheduled' | 'completed' | 'cancelled'
          total_sessions?: number
          completed_sessions?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      classrooms: {
        Row: {
          id: string
          booking_id: string
          session_date: string
          room_url: string
          video_co_room_id: string | null
          status: 'scheduled' | 'live' | 'completed' | 'cancelled'
          joined_at: string | null
          ended_at: string | null
          duration: number | null
          recording_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          session_date: string
          room_url: string
          video_co_room_id?: string | null
          status?: 'scheduled' | 'live' | 'completed' | 'cancelled'
          joined_at?: string | null
          ended_at?: string | null
          duration?: number | null
          recording_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          session_date?: string
          room_url?: string
          video_co_room_id?: string | null
          status?: 'scheduled' | 'live' | 'completed' | 'cancelled'
          joined_at?: string | null
          ended_at?: string | null
          duration?: number | null
          recording_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          classroom_id: string
          sender_id: string
          sender_name: string
          content: string
          type: 'text' | 'file' | 'system'
          is_read: boolean
          read_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          classroom_id: string
          sender_id: string
          sender_name: string
          content: string
          type?: 'text' | 'file' | 'system'
          is_read?: boolean
          read_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          classroom_id?: string
          sender_id?: string
          sender_name?: string
          content?: string
          type?: 'text' | 'file' | 'system'
          is_read?: boolean
          read_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      materials: {
        Row: {
          id: string
          classroom_id: string
          uploader_id: string
          uploader_name: string
          file_name: string
          file_url: string
          file_type: string
          file_size: number
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          classroom_id: string
          uploader_id: string
          uploader_name: string
          file_name: string
          file_url: string
          file_type: string
          file_size: number
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          classroom_id?: string
          uploader_id?: string
          uploader_name?: string
          file_name?: string
          file_url?: string
          file_type?: string
          file_size?: number
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

