'use client'

import { useState } from 'react'
import { Whiteboard } from './Whiteboard'
import { Palette, Video, X, Loader2, AlertCircle } from 'lucide-react'

interface WhiteboardToggleProps {
  roomId: string
  isTutor: boolean
  onSave?: (data: any) => void
  videoContainer?: React.RefObject<HTMLDivElement>
  isJoined?: boolean
  isConnecting?: boolean
  callFrame?: any
  onJoinClassroom?: () => void
  error?: string
}

export function WhiteboardToggle({ roomId, isTutor, onSave, videoContainer, isJoined, isConnecting, callFrame, onJoinClassroom, error }: WhiteboardToggleProps) {
  const [showWhiteboard, setShowWhiteboard] = useState(false)
  const [viewMode, setViewMode] = useState<'video' | 'whiteboard' | 'split'>('video')

  const toggleWhiteboard = () => {
    setShowWhiteboard(!showWhiteboard)
    if (!showWhiteboard) {
      setViewMode('split')
    }
  }

  const switchToVideo = () => {
    setViewMode('video')
    setShowWhiteboard(false)
  }

  const switchToWhiteboard = () => {
    setViewMode('whiteboard')
    setShowWhiteboard(true)
  }

  const switchToSplit = () => {
    setViewMode('split')
    setShowWhiteboard(true)
  }

  return (
    <div className="whiteboard-toggle-container">
      {/* Control buttons */}
      <div className="flex items-center gap-2 p-3 bg-gray-50 border-b">
        <button
          onClick={switchToVideo}
          className={`text-sm flex items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
            viewMode === 'video' 
              ? 'bg-primary-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <Video className="w-4 h-4" />
          Video Only
        </button>
        
        <button
          onClick={switchToWhiteboard}
          className={`text-sm flex items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
            viewMode === 'whiteboard' 
              ? 'bg-primary-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <Palette className="w-4 h-4" />
          Whiteboard Only
        </button>
        
        <button
          onClick={switchToSplit}
          className={`text-sm flex items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
            viewMode === 'split' 
              ? 'bg-primary-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <Palette className="w-4 h-4" />
          <Video className="w-4 h-4" />
          Split View
        </button>
      </div>

      {/* Content area */}
      <div className="flex-1 flex flex-col">
        {viewMode === 'split' && (
          <div className="flex-1 flex">
            {/* Video panel */}
            <div className="flex-1 border-r bg-black relative">
              {/* Daily.co iframe container */}
              {videoContainer && (
                <div ref={videoContainer} className="w-full h-full" />
              )}
              
              {/* Join overlay - only show if we haven't started connecting yet */}
              {!isJoined && !isConnecting && !callFrame && onJoinClassroom && (
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
                      onClick={onJoinClassroom}
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
                    {onJoinClassroom && (
                      <button 
                        onClick={onJoinClassroom}
                        className="btn-primary"
                      >
                        Try Again
                      </button>
                    )}
                  </div>
                </div>
              )}
              
              {/* Fallback if no video container */}
              {!videoContainer && !isJoined && !isConnecting && !callFrame && !error && (
                <div className="h-full bg-gray-100 flex items-center justify-center">
                  <div className="text-center text-gray-600">
                    <Video className="w-12 h-12 mx-auto mb-2" />
                    <p>Video will be displayed here</p>
                    <p className="text-sm">(Daily.co integration)</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Whiteboard panel */}
            <div className="flex-1">
              <Whiteboard
                roomId={roomId}
                isTutor={isTutor}
                onSave={onSave}
                className="h-full"
              />
            </div>
          </div>
        )}

        {viewMode === 'whiteboard' && (
          <div className="flex-1">
            <Whiteboard
              roomId={roomId}
              isTutor={isTutor}
              onSave={onSave}
              className="h-full"
            />
          </div>
        )}

        {viewMode === 'video' && (
          <div className="flex-1 bg-black relative">
            {/* Daily.co iframe container */}
            {videoContainer && (
              <div ref={videoContainer} className="w-full h-full" />
            )}
            
            {/* Join overlay - only show if we haven't started connecting yet */}
            {!isJoined && !isConnecting && !callFrame && onJoinClassroom && (
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
                    onClick={onJoinClassroom}
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
                  {onJoinClassroom && (
                    <button 
                      onClick={onJoinClassroom}
                      className="btn-primary"
                    >
                      Try Again
                    </button>
                  )}
                </div>
              </div>
            )}
            
            {/* Fallback if no video container */}
            {!videoContainer && !isJoined && !isConnecting && !callFrame && !error && (
              <div className="h-full bg-gray-100 flex items-center justify-center">
                <div className="text-center text-gray-600">
                  <Video className="w-12 h-12 mx-auto mb-2" />
                  <p>Video will be displayed here</p>
                  <p className="text-sm">(Daily.co integration)</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default WhiteboardToggle
