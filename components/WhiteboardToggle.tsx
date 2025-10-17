'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Whiteboard } from './Whiteboard'
import { Palette, Video, X } from 'lucide-react'

interface WhiteboardToggleProps {
  roomId: string
  isTutor: boolean
  onSave?: (data: any) => void
}

export function WhiteboardToggle({ roomId, isTutor, onSave }: WhiteboardToggleProps) {
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
        <Button
          variant={viewMode === 'video' ? 'default' : 'outline'}
          size="sm"
          onClick={switchToVideo}
          className="flex items-center gap-1"
        >
          <Video className="w-4 h-4" />
          Video Only
        </Button>
        
        <Button
          variant={viewMode === 'whiteboard' ? 'default' : 'outline'}
          size="sm"
          onClick={switchToWhiteboard}
          className="flex items-center gap-1"
        >
          <Palette className="w-4 h-4" />
          Whiteboard Only
        </Button>
        
        <Button
          variant={viewMode === 'split' ? 'default' : 'outline'}
          size="sm"
          onClick={switchToSplit}
          className="flex items-center gap-1"
        >
          <Palette className="w-4 h-4" />
          <Video className="w-4 h-4" />
          Split View
        </Button>
      </div>

      {/* Content area */}
      <div className="flex-1 flex flex-col">
        {viewMode === 'split' && (
          <div className="flex-1 flex">
            {/* Video panel */}
            <div className="flex-1 border-r">
              <div className="h-full bg-gray-100 flex items-center justify-center">
                <div className="text-center text-gray-600">
                  <Video className="w-12 h-12 mx-auto mb-2" />
                  <p>Video will be displayed here</p>
                  <p className="text-sm">(Daily.co integration)</p>
                </div>
              </div>
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
          <div className="flex-1 bg-gray-100 flex items-center justify-center">
            <div className="text-center text-gray-600">
              <Video className="w-12 h-12 mx-auto mb-2" />
              <p>Video will be displayed here</p>
              <p className="text-sm">(Daily.co integration)</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default WhiteboardToggle
