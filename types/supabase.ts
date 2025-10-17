export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
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
          sessions_per_week: number
          start_date: string
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
          sessions_per_week: number
          start_date: string
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
          sessions_per_week?: number
          start_date?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      sessions: {
        Row: {
          id: string
          booking_id: string
          session_number: number
          scheduled_date: string
          scheduled_time: string
          scheduled_day: string
          duration: number
          status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled' | 'no_show'
          classroom_id: string | null
          completed_at: string | null
          cancelled_at: string | null
          cancellation_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          session_number: number
          scheduled_date: string
          scheduled_time: string
          scheduled_day: string
          duration: number
          status?: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled' | 'no_show'
          classroom_id?: string | null
          completed_at?: string | null
          cancelled_at?: string | null
          cancellation_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          session_number?: number
          scheduled_date?: string
          scheduled_time?: string
          scheduled_day?: string
          duration?: number
          status?: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled' | 'no_show'
          classroom_id?: string | null
          completed_at?: string | null
          cancelled_at?: string | null
          cancellation_reason?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      classrooms: {
        Row: {
          id: string
          booking_id: string
          session_id: string | null
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
          session_id?: string | null
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
          session_id?: string | null
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
          booking_id: string
          session_id: string | null
          uploaded_by: string
          uploader_name: string
          file_name: string
          file_url: string
          file_size: number
          file_type: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          session_id?: string | null
          uploaded_by: string
          uploader_name: string
          file_name: string
          file_url: string
          file_size: number
          file_type: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          session_id?: string | null
          uploaded_by?: string
          uploader_name?: string
          file_name?: string
          file_url?: string
          file_size?: number
          file_type?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      class_notes: {
        Row: {
          id: string
          class_id: string
          tutor_id: string
          student_background: Json
          learning_style: Json
          goals: Json
          parent_contact: Json
          special_considerations: Json
          overall_notes: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          class_id: string
          tutor_id: string
          student_background: Json
          learning_style: Json
          goals: Json
          parent_contact: Json
          special_considerations: Json
          overall_notes: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          class_id?: string
          tutor_id?: string
          student_background?: Json
          learning_style?: Json
          goals?: Json
          parent_contact?: Json
          special_considerations?: Json
          overall_notes?: Json
          created_at?: string
          updated_at?: string
        }
      }
      session_notes: {
        Row: {
          id: string
          session_id: string
          tutor_id: string
          notes: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          session_id: string
          tutor_id: string
          notes: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          tutor_id?: string
          notes?: Json
          created_at?: string
          updated_at?: string
        }
      }
      class_reports: {
        Row: {
          id: string
          class_id: string
          booking_id: string
          tutor_id: string
          student_id: string
          report_period: string
          start_date: string
          end_date: string
          sessions_completed: number
          total_hours: number
          overall_summary: string
          strengths: string
          areas_for_improvement: string
          next_steps: string
          is_shared_with_student: boolean
          shared_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          class_id: string
          booking_id: string
          tutor_id: string
          student_id: string
          report_period: string
          start_date: string
          end_date: string
          sessions_completed: number
          total_hours: number
          overall_summary: string
          strengths: string
          areas_for_improvement: string
          next_steps: string
          is_shared_with_student?: boolean
          shared_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          class_id?: string
          booking_id?: string
          tutor_id?: string
          student_id?: string
          report_period?: string
          start_date?: string
          end_date?: string
          sessions_completed?: number
          total_hours?: number
          overall_summary?: string
          strengths?: string
          areas_for_improvement?: string
          next_steps?: string
          is_shared_with_student?: boolean
          shared_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      reschedule_requests: {
        Row: {
          id: string
          booking_id: string
          session_id: string | null
          requested_by: string
          original_slot: Json
          proposed_slot: Json
          reason: string
          status: 'pending' | 'accepted' | 'declined'
          response_note: string | null
          responded_by: string | null
          responded_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          session_id?: string | null
          requested_by: string
          original_slot: Json
          proposed_slot: Json
          reason: string
          status?: 'pending' | 'accepted' | 'declined'
          response_note?: string | null
          responded_by?: string | null
          responded_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          session_id?: string | null
          requested_by?: string
          original_slot?: Json
          proposed_slot?: Json
          reason?: string
          status?: 'pending' | 'accepted' | 'declined'
          response_note?: string | null
          responded_by?: string | null
          responded_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      whiteboard_sessions: {
        Row: {
          id: string
          room_id: string
          session_data: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          room_id: string
          session_data?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          session_data?: Json
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'tutor' | 'student' | 'admin'
      booking_status: 'pending' | 'confirmed' | 'rescheduled' | 'completed' | 'cancelled'
      classroom_status: 'scheduled' | 'live' | 'completed' | 'cancelled'
      message_type: 'text' | 'file' | 'system'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}