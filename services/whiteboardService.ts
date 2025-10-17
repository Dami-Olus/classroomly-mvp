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
      
      // Create a user-specific room ID to prevent cross-user data sharing
      const userSpecificRoomId = userId ? `${roomId}-${userId}` : roomId
      
      const { data: session, error } = await supabase
        .from('whiteboard_sessions')
        .upsert({
          room_id: userSpecificRoomId,
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
      
      // Create a user-specific room ID to prevent cross-user data sharing
      const userSpecificRoomId = userId ? `${roomId}-${userId}` : roomId
      
      const { data: session, error } = await supabase
        .from('whiteboard_sessions')
        .select('*')
        .eq('room_id', userSpecificRoomId)
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
   * Get all whiteboard sessions for a user
   */
  async getUserWhiteboardSessions(userId: string): Promise<WhiteboardSession[]> {
    try {
      const supabase = createClient()
      const { data: sessions, error } = await supabase
        .from('whiteboard_sessions')
        .select(`
          *,
          classrooms!inner(
            tutor_id,
            student_id
          )
        `)
        .or(`classrooms.tutor_id.eq.${userId},classrooms.student_id.eq.${userId}`)
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
   * Validate room access for whiteboard
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
        return false
      }

      return classroom.tutor_id === userId || classroom.student_id === userId
    } catch (error: any) {
      console.error('WhiteboardService.validateWhiteboardAccess error:', error)
      return false
    }
  }
}

export const whiteboardService = new WhiteboardService()
export default whiteboardService
