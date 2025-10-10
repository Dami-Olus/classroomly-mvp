'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import DailyIframe, { DailyCall, DailyEvent } from '@daily-co/daily-js'
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  MonitorOff,
  PhoneOff,
  Users,
  MessageSquare,
  FileText,
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function ClassroomPage() {
  const params = useParams()
  const router = useRouter()
  const roomUrl = params.roomUrl as string
  const { user, profile } = useAuth()
  const supabase = createClient()

  const [classroom, setClassroom] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [callFrame, setCallFrame] = useState<DailyCall | null>(null)
  const [isJoined, setIsJoined] = useState(false)
  const [participants, setParticipants] = useState<any[]>([])

  // Call controls state
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [showMaterials, setShowMaterials] = useState(false)

  const callContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadClassroom()
    return () => {
      // Cleanup on unmount
      if (callFrame) {
        callFrame.leave()
        callFrame.destroy()
      }
    }
  }, [roomUrl])

  const loadClassroom = async () => {
    try {
      const { data, error } = await supabase
        .from('classrooms')
        .select(`
          *,
          booking:bookings(
            *,
            class:classes(
              title,
              subject,
              duration,
              tutor:tutors(
                user:profiles(
                  first_name,
                  last_name,
                  email
                )
              )
            )
          )
        `)
        .eq('room_url', roomUrl)
        .single()

      if (error) throw error

      setClassroom(data)

      // Update classroom status if needed
      if (data.status === 'scheduled') {
        await supabase
          .from('classrooms')
          .update({ status: 'live', joined_at: new Date().toISOString() })
          .eq('id', data.id)
      }
    } catch (error) {
      console.error('Error loading classroom:', error)
      toast.error('Classroom not found')
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  const joinCall = async () => {
    try {
      if (!callContainerRef.current) return

      // Create Daily call frame
      const frame = DailyIframe.createFrame(callContainerRef.current, {
        showLeaveButton: false,
        showFullscreenButton: true,
        iframeStyle: {
          width: '100%',
          height: '100%',
          border: 'none',
          borderRadius: '12px',
        },
      })

      setCallFrame(frame)

      // Set up event listeners
      frame.on('joined-meeting', handleJoinedMeeting)
      frame.on('left-meeting', handleLeftMeeting)
      frame.on('participant-joined', handleParticipantUpdate)
      frame.on('participant-left', handleParticipantUpdate)
      frame.on('participant-updated', handleParticipantUpdate)

      // Get Daily room URL (you'll need to create this)
      // For MVP, we'll use a simple room name based on roomUrl
      const dailyRoomUrl = `https://${process.env.NEXT_PUBLIC_DAILY_DOMAIN}.daily.co/${roomUrl}`

      // Join the call
      await frame.join({
        url: dailyRoomUrl,
        userName: profile
          ? `${profile.first_name} ${profile.last_name}`
          : 'Guest',
      })
    } catch (error) {
      console.error('Error joining call:', error)
      toast.error('Failed to join classroom')
    }
  }

  const handleJoinedMeeting = () => {
    setIsJoined(true)
    toast.success('Joined classroom successfully!')
  }

  const handleLeftMeeting = () => {
    setIsJoined(false)
    toast.info('Left the classroom')
    router.push('/student/dashboard')
  }

  const handleParticipantUpdate = () => {
    if (callFrame) {
      const participantList = Object.values(callFrame.participants())
      setParticipants(participantList)
    }
  }

  const toggleMute = () => {
    if (callFrame) {
      callFrame.setLocalAudio(!isMuted)
      setIsMuted(!isMuted)
    }
  }

  const toggleVideo = () => {
    if (callFrame) {
      callFrame.setLocalVideo(!isVideoOff)
      setIsVideoOff(!isVideoOff)
    }
  }

  const toggleScreenShare = async () => {
    if (!callFrame) return

    try {
      if (isScreenSharing) {
        await callFrame.stopScreenShare()
        setIsScreenSharing(false)
      } else {
        await callFrame.startScreenShare()
        setIsScreenSharing(true)
      }
    } catch (error) {
      console.error('Error toggling screen share:', error)
      toast.error('Failed to share screen')
    }
  }

  const leaveCall = async () => {
    if (callFrame) {
      await callFrame.leave()
      callFrame.destroy()
      setCallFrame(null)
      setIsJoined(false)

      // Update classroom status
      if (classroom) {
        await supabase
          .from('classrooms')
          .update({
            status: 'completed',
            ended_at: new Date().toISOString(),
          })
          .eq('id', classroom.id)
      }

      router.push('/student/dashboard')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary-900">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading classroom...</p>
        </div>
      </div>
    )
  }

  if (!classroom) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary-900">
        <div className="card max-w-md text-center">
          <Video className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-secondary-900 mb-2">
            Classroom Not Found
          </h1>
          <p className="text-secondary-600 mb-6">
            This classroom doesn't exist or has been removed.
          </p>
          <button onClick={() => router.push('/')} className="btn-primary">
            Go to Homepage
          </button>
        </div>
      </div>
    )
  }

  const booking = classroom.booking
  const classInfo = booking?.class
  const tutor = classInfo?.tutor?.user

  return (
    <div className="h-screen bg-secondary-900 flex flex-col">
      {/* Top Bar */}
      <div className="bg-secondary-800 border-b border-secondary-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Video className="w-6 h-6 text-primary-400" />
            <div>
              <h1 className="text-white font-semibold">
                {classInfo?.title || 'Tutoring Session'}
              </h1>
              <p className="text-secondary-400 text-sm">
                {classInfo?.subject} • {classInfo?.duration} minutes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-secondary-400">
              <Users className="w-4 h-4" />
              <span className="text-sm">{participants.length} participant(s)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Area */}
        <div className="flex-1 flex flex-col">
          {/* Video Container */}
          <div className="flex-1 bg-black relative">
            {!isJoined ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white">
                  <Video className="w-16 h-16 mx-auto mb-4 text-primary-400" />
                  <h2 className="text-2xl font-bold mb-4">
                    Ready to Join the Session?
                  </h2>
                  <p className="text-secondary-300 mb-6">
                    Click below to join the virtual classroom
                  </p>
                  <button onClick={joinCall} className="btn-primary text-lg px-8">
                    Join Classroom
                  </button>
                </div>
              </div>
            ) : (
              <div ref={callContainerRef} className="w-full h-full" />
            )}
          </div>

          {/* Controls Bar */}
          {isJoined && (
            <div className="bg-secondary-800 px-6 py-4">
              <div className="flex items-center justify-center gap-3">
                {/* Mute Button */}
                <button
                  onClick={toggleMute}
                  className={`p-4 rounded-full transition-all ${
                    isMuted
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-secondary-700 hover:bg-secondary-600'
                  }`}
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? (
                    <MicOff className="w-6 h-6 text-white" />
                  ) : (
                    <Mic className="w-6 h-6 text-white" />
                  )}
                </button>

                {/* Video Button */}
                <button
                  onClick={toggleVideo}
                  className={`p-4 rounded-full transition-all ${
                    isVideoOff
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-secondary-700 hover:bg-secondary-600'
                  }`}
                  title={isVideoOff ? 'Turn on video' : 'Turn off video'}
                >
                  {isVideoOff ? (
                    <VideoOff className="w-6 h-6 text-white" />
                  ) : (
                    <Video className="w-6 h-6 text-white" />
                  )}
                </button>

                {/* Screen Share Button */}
                <button
                  onClick={toggleScreenShare}
                  className={`p-4 rounded-full transition-all ${
                    isScreenSharing
                      ? 'bg-primary-600 hover:bg-primary-700'
                      : 'bg-secondary-700 hover:bg-secondary-600'
                  }`}
                  title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
                >
                  {isScreenSharing ? (
                    <MonitorOff className="w-6 h-6 text-white" />
                  ) : (
                    <Monitor className="w-6 h-6 text-white" />
                  )}
                </button>

                {/* Chat Button */}
                <button
                  onClick={() => setShowChat(!showChat)}
                  className={`p-4 rounded-full transition-all ${
                    showChat
                      ? 'bg-primary-600 hover:bg-primary-700'
                      : 'bg-secondary-700 hover:bg-secondary-600'
                  }`}
                  title="Toggle chat"
                >
                  <MessageSquare className="w-6 h-6 text-white" />
                </button>

                {/* Materials Button */}
                <button
                  onClick={() => setShowMaterials(!showMaterials)}
                  className={`p-4 rounded-full transition-all ${
                    showMaterials
                      ? 'bg-primary-600 hover:bg-primary-700'
                      : 'bg-secondary-700 hover:bg-secondary-600'
                  }`}
                  title="Toggle materials"
                >
                  <FileText className="w-6 h-6 text-white" />
                </button>

                {/* Leave Button */}
                <button
                  onClick={leaveCall}
                  className="p-4 rounded-full bg-red-600 hover:bg-red-700 transition-all ml-4"
                  title="Leave classroom"
                >
                  <PhoneOff className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar (Chat/Materials) */}
        {(showChat || showMaterials) && isJoined && (
          <div className="w-80 bg-secondary-800 border-l border-secondary-700 flex flex-col">
            {/* Sidebar Tabs */}
            <div className="flex border-b border-secondary-700">
              <button
                onClick={() => {
                  setShowChat(true)
                  setShowMaterials(false)
                }}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${
                  showChat
                    ? 'text-white bg-secondary-700'
                    : 'text-secondary-400 hover:text-white'
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
                    ? 'text-white bg-secondary-700'
                    : 'text-secondary-400 hover:text-white'
                }`}
              >
                <FileText className="w-4 h-4 inline-block mr-2" />
                Materials
              </button>
            </div>

            {/* Sidebar Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {showChat && (
                <div className="text-center text-secondary-400 py-12">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 text-secondary-600" />
                  <p>Chat feature coming in Sprint 5!</p>
                </div>
              )}

              {showMaterials && (
                <div className="text-center text-secondary-400 py-12">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-secondary-600" />
                  <p>Materials feature coming in Sprint 5!</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

