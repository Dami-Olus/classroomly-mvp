import { useState, useCallback, useRef, useEffect } from 'react'
import DailyIframe, { DailyCall } from '@daily-co/daily-js'
import toast from 'react-hot-toast'

export interface DailyCallState {
  callFrame: DailyCall | null
  isJoined: boolean
  isConnecting: boolean
  participants: any[]
  error: string | null
}

export interface DailyCallActions {
  joinCall: (config: JoinCallConfig) => Promise<void>
  leaveCall: () => Promise<void>
  toggleAudio: () => void
  toggleVideo: () => void
  startScreenShare: () => Promise<void>
  stopScreenShare: () => Promise<void>
  setConnecting: (connecting: boolean) => void
}

export interface JoinCallConfig {
  roomUrl: string
  userName: string
  token?: string
}

export const useDailyCall = () => {
  const [state, setState] = useState<DailyCallState>({
    callFrame: null,
    isJoined: false,
    isConnecting: false,
    participants: [],
    error: null,
  })

  const containerRef = useRef<HTMLDivElement>(null)
  const callFrameRef = useRef<DailyCall | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (callFrameRef.current) {
        callFrameRef.current.leave().catch(console.error)
        callFrameRef.current.destroy()
      }
    }
  }, [])

  const joinCall = useCallback(async (config: JoinCallConfig) => {
    if (!containerRef.current) {
      throw new Error('Container ref not available')
    }

      // Prevent multiple instances
      if (callFrameRef.current) {
        console.log('Call frame already exists, joining existing room...')
        try {
          const joinConfig: any = {
            url: config.roomUrl,
            userName: config.userName,
          }
          
          // Only add token if it's provided and is a string
          if (config.token && typeof config.token === 'string') {
            joinConfig.token = config.token
          }
          
          await callFrameRef.current.join(joinConfig)
          return
        } catch (error) {
          console.error('Error joining existing call:', error)
          throw error
        }
      }

    setState(prev => ({ ...prev, isConnecting: true, error: null }))

    try {
      // Create new call frame
      const callFrame = DailyIframe.createFrame(containerRef.current, {
        showLeaveButton: true,
        showFullscreenButton: true,
        showLocalVideo: true,
        showParticipantsBar: true,
        iframeStyle: {
          width: '100%',
          height: '100%',
          border: 'none',
          borderRadius: '8px',
        },
      })

      callFrameRef.current = callFrame
      setState(prev => ({ ...prev, callFrame }))

      // Hide connecting modal immediately after frame is created
      console.log('Call frame created - hiding connecting modal immediately')
      setState(prev => ({ 
        ...prev, 
        callFrame,
        isConnecting: false 
      }))

      // Set up event listeners
      const handleJoinedMeeting = () => {
        console.log('Successfully joined meeting')
        setState(prev => ({ 
          ...prev, 
          isJoined: true, 
          isConnecting: false,
          error: null 
        }))
        toast.success('Joined classroom successfully!')
      }

      const handleLeftMeeting = () => {
        console.log('Left meeting')
        setState(prev => ({ 
          ...prev, 
          isJoined: false, 
          participants: [] 
        }))
        toast.success('Left the classroom')
      }

      const handleParticipantUpdate = () => {
        if (callFrame) {
          const participantList = Object.values(callFrame.participants())
          setState(prev => ({ ...prev, participants: participantList }))
        }
      }

      const handleError = (event: any) => {
        console.error('Daily.co error:', event)
        setState(prev => ({ 
          ...prev, 
          error: event.errorMsg || 'Connection error occurred',
          isConnecting: false 
        }))
        toast.error(event.errorMsg || 'Connection error occurred')
      }

      // Attach event listeners
      callFrame.on('joined-meeting', handleJoinedMeeting)
      callFrame.on('left-meeting', handleLeftMeeting)
      callFrame.on('participant-joined', handleParticipantUpdate)
      callFrame.on('participant-left', handleParticipantUpdate)
      callFrame.on('participant-updated', handleParticipantUpdate)
      callFrame.on('error', handleError)

      // Join the call
      const joinConfig: any = {
        url: config.roomUrl,
        userName: config.userName,
      }
      
      // Only add token if it's provided and is a string
      if (config.token && typeof config.token === 'string') {
        joinConfig.token = config.token
      }
      
      console.log('About to call join with config:', joinConfig)
      const joinResult = await callFrame.join(joinConfig)
      console.log('Join result:', joinResult)
      console.log('Join call completed successfully')

    } catch (error: any) {
      console.error('Error joining call:', error)
      setState(prev => ({ 
        ...prev, 
        error: error.message || 'Failed to join call',
        isConnecting: false 
      }))
      toast.error(error.message || 'Failed to join call')
      throw error
    }
  }, [])

  const leaveCall = useCallback(async () => {
    if (callFrameRef.current) {
      try {
        await callFrameRef.current.leave()
        callFrameRef.current.destroy()
        callFrameRef.current = null
        setState(prev => ({ 
          ...prev, 
          callFrame: null,
          isJoined: false,
          participants: []
        }))
      } catch (error) {
        console.error('Error leaving call:', error)
      }
    }
  }, [])

  const toggleAudio = useCallback(() => {
    if (callFrameRef.current) {
      const isAudioOn = callFrameRef.current.localAudio()
      callFrameRef.current.setLocalAudio(!isAudioOn)
    }
  }, [])

  const toggleVideo = useCallback(() => {
    if (callFrameRef.current) {
      const isVideoOn = callFrameRef.current.localVideo()
      callFrameRef.current.setLocalVideo(!isVideoOn)
    }
  }, [])

  const startScreenShare = useCallback(async () => {
    if (callFrameRef.current) {
      try {
        await callFrameRef.current.startScreenShare()
      } catch (error) {
        console.error('Error starting screen share:', error)
        toast.error('Failed to start screen sharing')
      }
    }
  }, [])

  const stopScreenShare = useCallback(async () => {
    if (callFrameRef.current) {
      try {
        await callFrameRef.current.stopScreenShare()
      } catch (error) {
        console.error('Error stopping screen share:', error)
        toast.error('Failed to stop screen sharing')
      }
    }
  }, [])

  const setConnecting = useCallback((connecting: boolean) => {
    setState(prev => ({ ...prev, isConnecting: connecting }))
  }, [])

  return {
    ...state,
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
  }
}
