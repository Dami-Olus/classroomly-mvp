import { createClient } from '@/lib/supabase/client'

export interface WhiteboardSession {
  id: string
  room_id: string
  session_data: any
  created_at: string
  updated_at: string
}

export interface WhiteboardData {
  roomId?: string
  timestamp?: string
  excalidrawUrl?: string
  elements?: any[]
  appState?: any
  files?: any
  [key: string]: any // Allow additional properties
}

class WhiteboardService {
  /**
   * Save whiteboard session data
   */
  async saveWhiteboardSession(roomId: string, data: WhiteboardData, userId?: string): Promise<WhiteboardSession> {
    try {
      const supabase = createClient()
      
      // Use the room ID directly - whiteboard is shared per session/room between tutor and student
      const { data: session, error } = await supabase
        .from('whiteboard_sessions')
        .upsert({
          room_id: roomId,
          session_data: data,
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('Error saving whiteboard session:', error)
        throw new Error(`Failed to save whiteboard session: ${error.message}`)
      }

      return session
    } catch (error: any) {
      console.error('WhiteboardService.saveWhiteboardSession error:', error)
      throw new Error(error.message || 'Failed to save whiteboard session')
    }
  }

  /**
   * Load whiteboard session data
   */
  async loadWhiteboardSession(roomId: string, userId?: string): Promise<WhiteboardSession | null> {
    try {
      const supabase = createClient()
      
      // Use the room ID directly - whiteboard is shared per session/room between tutor and student
      const { data: session, error } = await supabase
        .from('whiteboard_sessions')
        .select('*')
        .eq('room_id', roomId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No session found, return null
          return null
        }
        console.error('Error loading whiteboard session:', error)
        throw new Error(`Failed to load whiteboard session: ${error.message}`)
      }

      return session
    } catch (error: any) {
      console.error('WhiteboardService.loadWhiteboardSession error:', error)
      throw new Error(error.message || 'Failed to load whiteboard session')
    }
  }

  /**
   * Delete whiteboard session
   */
  async deleteWhiteboardSession(roomId: string): Promise<void> {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('whiteboard_sessions')
        .delete()
        .eq('room_id', roomId)

      if (error) {
        console.error('Error deleting whiteboard session:', error)
        throw new Error(`Failed to delete whiteboard session: ${error.message}`)
      }
    } catch (error: any) {
      console.error('WhiteboardService.deleteWhiteboardSession error:', error)
      throw new Error(error.message || 'Failed to delete whiteboard session')
    }
  }

  /**
   * Get all whiteboard sessions for a user (rooms where they are tutor or student)
   */
  async getUserWhiteboardSessions(userId: string): Promise<WhiteboardSession[]> {
    try {
      const supabase = createClient()
      
      // First get all classroom room IDs where the user is involved
      const { data: classrooms, error: classroomError } = await supabase
        .from('classrooms')
        .select('id')
        .or(`tutor_id.eq.${userId},student_id.eq.${userId}`)

      if (classroomError) {
        console.error('Error loading user classrooms:', classroomError)
        throw new Error(`Failed to load user classrooms: ${classroomError.message}`)
      }

      if (!classrooms || classrooms.length === 0) {
        return []
      }

      // Get whiteboard sessions for those rooms
      const roomIds = classrooms.map(c => c.id)
      const { data: sessions, error } = await supabase
        .from('whiteboard_sessions')
        .select('*')
        .in('room_id', roomIds)
        .order('updated_at', { ascending: false })

      if (error) {
        console.error('Error loading user whiteboard sessions:', error)
        throw new Error(`Failed to load whiteboard sessions: ${error.message}`)
      }

      return sessions || []
    } catch (error: any) {
      console.error('WhiteboardService.getUserWhiteboardSessions error:', error)
      throw new Error(error.message || 'Failed to load whiteboard sessions')
    }
  }

  /**
   * Generate unique room ID for whiteboard
   */
  generateRoomId(): string {
    return `classroomly-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Validate room access for whiteboard (check if user is tutor or student in this classroom)
   */
  async validateWhiteboardAccess(roomId: string, userId: string): Promise<boolean> {
    try {
      const supabase = createClient()
      const { data: classroom, error } = await supabase
        .from('classrooms')
        .select('tutor_id, student_id')
        .eq('id', roomId)
        .single()

      if (error || !classroom) {
        console.log('❌ Classroom not found for room:', roomId)
        return false
      }

      const hasAccess = classroom.tutor_id === userId || classroom.student_id === userId
      console.log('🔐 Whiteboard access check:', { roomId, userId, tutorId: classroom.tutor_id, studentId: classroom.student_id, hasAccess })
      return hasAccess
    } catch (error: any) {
      console.error('WhiteboardService.validateWhiteboardAccess error:', error)
      return false
    }
  }
}

export const whiteboardService = new WhiteboardService()
export default whiteboardService
