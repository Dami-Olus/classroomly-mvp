'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useDailyCall } from '@/hooks/useDailyCall'
import { classroomService, ClassroomData } from '@/services/classroomService'
import {
  Video,
  Users,
  MessageSquare,
  FileText,
  AlertCircle,
  Loader2,
  Palette,
  X,
} from 'lucide-react'
import { WhiteboardToggle } from '@/components/WhiteboardToggle'
import { Whiteboard } from '@/components/Whiteboard'
import toast from 'react-hot-toast'

export default function ClassroomPage() {
  const params = useParams()
  const router = useRouter()
  const roomUrl = params.roomUrl as string
  const { user, profile } = useAuth()

  const [classroomData, setClassroomData] = useState<ClassroomData | null>(null)
  const [loading, setLoading] = useState(true)
  const [accessDenied, setAccessDenied] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [showMaterials, setShowMaterials] = useState(false)
  const [showWhiteboard, setShowWhiteboard] = useState(false)

  const {
    callFrame,
    isJoined,
    isConnecting,
    participants,
    error,
    containerRef,
    actions: {
      joinCall,
      leaveCall,
      toggleAudio,
      toggleVideo,
      startScreenShare,
      stopScreenShare,
      setConnecting,
    },
  } = useDailyCall()

  useEffect(() => {
    loadClassroomData()
  }, [roomUrl])

  const loadClassroomData = async () => {
    try {
      setLoading(true)
      
      // Load classroom data
      const classroom = await classroomService.loadClassroom(roomUrl)
      
      if (!classroom) {
        setAccessDenied(true)
        return
      }

      // Validate access
      const hasAccess = await classroomService.validateRoomAccess(
        roomUrl, 
        user?.email
      )

      if (!hasAccess) {
        setAccessDenied(true)
        return
      }

      setClassroomData(classroom)
    } catch (error) {
      console.error('Error loading classroom:', error)
      setAccessDenied(true)
    } finally {
      setLoading(false)
    }
  }

  const handleJoinClassroom = async () => {
    if (!classroomData) return

    try {
      // Create Daily room if needed
      const roomResponse = await classroomService.createDailyRoom(classroomData.room_url)
      
      // Join the call
      await joinCall({
        roomUrl: roomResponse.roomUrl,
        userName: profile 
          ? `${profile.first_name} ${profile.last_name}`
          : classroomData.booking_info?.student_name || 'Guest',
      })

      // Update classroom status to active (don't fail if this doesn't work)
      try {
        await classroomService.updateClassroomStatus(roomUrl, 'live')
      } catch (error) {
        console.warn('Failed to update classroom status, continuing anyway:', error)
      }
      
    } catch (error: any) {
      console.error('Error joining classroom:', error)
      toast.error(error.message || 'Failed to join classroom')
    }
  }

  const handleLeaveClassroom = async () => {
    try {
      await leaveCall()
      await classroomService.updateClassroomStatus(roomUrl, 'completed')
      router.push('/student/dashboard')
    } catch (error: any) {
      console.error('Error leaving classroom:', error)
      toast.error('Failed to leave classroom')
    }
  }

  const handleHideWhiteboard = () => {
    setShowWhiteboard(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading classroom...</p>
        </div>
      </div>
    )
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white max-w-md mx-auto">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-300 mb-6">
            You don't have permission to access this classroom.
          </p>
          <button
            onClick={() => router.push('/student/dashboard')}
            className="btn-primary"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  if (!classroomData) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Classroom Not Found</h1>
          <button
            onClick={() => router.push('/student/dashboard')}
            className="btn-primary"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Video className="w-6 h-6 text-blue-400" />
            <div>
              <h1 className="text-white font-semibold">
                {classroomData.class_info?.title || 'Tutoring Session'}
              </h1>
              <p className="text-gray-400 text-sm">
                {classroomData.class_info?.subject} • {classroomData.class_info?.duration} minutes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-gray-400">
              <Users className="w-4 h-4" />
              <span className="text-sm">{participants.length} participant(s)</span>
            </div>
            
            {isJoined && (
              <>
                <button
                  onClick={() => setShowWhiteboard(!showWhiteboard)}
                  className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                    showWhiteboard
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <Palette className="w-4 h-4" />
                  {showWhiteboard ? 'Hide Whiteboard' : 'Show Whiteboard'}
                </button>
                
                <button
                  onClick={handleLeaveClassroom}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Leave Classroom
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Container - Always present */}
        <div className="flex-1 flex flex-col">
          {/* Video Container */}
          <div className="flex-1 bg-black relative">
            {/* Daily.co iframe container */}
            <div ref={containerRef} className="w-full h-full" />
            
            {/* Join overlay - only show if we haven't started connecting yet */}
            {!isJoined && !isConnecting && !callFrame && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-90">
                <div className="text-center text-white">
                  <Video className="w-16 h-16 mx-auto mb-4 text-blue-400" />
                  <h2 className="text-2xl font-bold mb-4">
                    Ready to Join the Session?
                  </h2>
                  <p className="text-gray-300 mb-6">
                    Click below to join the virtual classroom
                  </p>
                  <button 
                    onClick={handleJoinClassroom}
                    className="btn-primary text-lg px-8"
                  >
                    Join Classroom
                  </button>
                </div>
              </div>
            )}

            {/* Connecting overlay */}
            {isConnecting && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-90 z-10">
                <div className="text-center text-white">
                  <Loader2 className="w-16 h-16 animate-spin mx-auto mb-4 text-blue-400" />
                  <h2 className="text-2xl font-bold mb-4">
                    Connecting...
                  </h2>
                  <p className="text-gray-300">
                    Please wait while we connect you to the classroom
                  </p>
                </div>
              </div>
            )}

            {/* Error overlay */}
            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-90">
                <div className="text-center text-white max-w-md mx-auto">
                  <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold mb-4">Connection Error</h2>
                  <p className="text-gray-300 mb-6">{error}</p>
                  <button 
                    onClick={handleJoinClassroom}
                    className="btn-primary"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Whiteboard Overlay */}
          {showWhiteboard && (
            <div className="absolute inset-0 z-10 bg-white flex flex-col">
              <div className="flex items-center justify-between p-3 bg-gray-50 border-b">
                <h3 className="font-semibold text-gray-900">Collaborative Whiteboard</h3>
                <button
                  onClick={handleHideWhiteboard}
                  className="btn-secondary text-sm flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  Hide Whiteboard
                </button>
              </div>
              <div className="flex-1">
                <Whiteboard
                  roomId={roomUrl}
                  isTutor={profile?.role === 'tutor'}
                  onSave={(data) => {
                    console.log('Whiteboard saved:', data)
                    toast.success('Whiteboard session saved!')
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        {(showChat || showMaterials) && isJoined && !showWhiteboard && (
          <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
            {/* Sidebar Tabs */}
            <div className="flex border-b border-gray-700">
              <button
                onClick={() => {
                  setShowChat(true)
                  setShowMaterials(false)
                }}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${
                  showChat
                    ? 'text-white bg-gray-700'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <MessageSquare className="w-4 h-4 inline-block mr-2" />
                Chat
              </button>
              <button
                onClick={() => {
                  setShowChat(false)
                  setShowMaterials(true)
                }}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${
                  showMaterials
                    ? 'text-white bg-gray-700'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <FileText className="w-4 h-4 inline-block mr-2" />
                Materials
              </button>
            </div>

            {/* Sidebar Content */}
            <div className="flex-1 p-4">
              {showChat && (
                <div className="text-white">
                  <p className="text-gray-400 text-center">
                    Chat feature coming soon
                  </p>
                </div>
              )}
              
              {showMaterials && (
                <div className="text-white">
                  <p className="text-gray-400 text-center">
                    Materials feature coming soon
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}