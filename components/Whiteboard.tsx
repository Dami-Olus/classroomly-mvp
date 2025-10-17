'use client'

import { useState, useEffect } from 'react'
import { Loader2, Maximize2, Minimize2, Save, Download } from 'lucide-react'
import { toast } from 'sonner'
import { whiteboardService } from '@/services/whiteboardService'

interface WhiteboardProps {
  roomId: string
  isTutor: boolean
  onSave?: (data: any) => void
  className?: string
}

export function Whiteboard({ roomId, isTutor, onSave, className = '' }: WhiteboardProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [whiteboardUrl, setWhiteboardUrl] = useState('')

  useEffect(() => {
    // Generate Excalidraw URL with room ID for collaboration
    const url = `https://excalidraw.com?room=${encodeURIComponent(roomId)}`
    setWhiteboardUrl(url)
  }, [roomId])

  const handleLoad = () => {
    setIsLoading(false)
    toast.success('Whiteboard loaded successfully!')
  }

  const handleError = () => {
    setIsLoading(false)
    toast.error('Failed to load whiteboard. Please try again.')
  }

  const handleSave = async () => {
    try {
      // Note: Excalidraw doesn't provide direct API access from iframe
      // We save a reference to the session for now
      const sessionData = {
        roomId,
        timestamp: new Date().toISOString(),
        excalidrawUrl: whiteboardUrl
      }
      
      await whiteboardService.saveWhiteboardSession(roomId, sessionData)
      toast.success('Whiteboard session saved!')
      
      if (onSave) {
        onSave(sessionData)
      }
    } catch (error: any) {
      console.error('Error saving whiteboard session:', error)
      toast.error('Failed to save whiteboard session')
    }
  }

  const handleDownload = () => {
    // Open Excalidraw in new tab for download
    window.open(whiteboardUrl, '_blank')
    toast.info('Open Excalidraw in new tab to download your work')
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  return (
    <div className={`whiteboard-container ${className} ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''}`}>
      {/* Header with controls */}
      <div className="flex items-center justify-between p-3 bg-gray-50 border-b">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900">Collaborative Whiteboard</h3>
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading...
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {isTutor && (
            <>
              <button
                onClick={handleSave}
                className="btn-secondary text-sm flex items-center gap-1"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
              
              <button
                onClick={handleDownload}
                className="btn-secondary text-sm flex items-center gap-1"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </>
          )}
          
          <button
            onClick={toggleFullscreen}
            className="btn-secondary text-sm flex items-center gap-1"
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-4 h-4" />
                Exit Fullscreen
              </>
            ) : (
              <>
                <Maximize2 className="w-4 h-4" />
                Fullscreen
              </>
            )}
          </button>
        </div>
      </div>

      {/* Whiteboard iframe */}
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary-600" />
              <p className="text-sm text-gray-600">Loading whiteboard...</p>
            </div>
          </div>
        )}
        
        <iframe
          src={whiteboardUrl}
          width="100%"
          height={isFullscreen ? 'calc(100vh - 60px)' : '600px'}
          frameBorder="0"
          allow="camera; microphone; clipboard-read; clipboard-write"
          onLoad={handleLoad}
          onError={handleError}
          className="whiteboard-iframe"
          title="Collaborative Whiteboard"
        />
      </div>

      {/* Instructions for users */}
      <div className="p-3 bg-blue-50 border-t">
        <div className="text-sm text-blue-800">
          <p className="font-medium mb-1">💡 How to use the whiteboard:</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>Draw with your mouse or touch screen</li>
            <li>Use the toolbar on the left for different tools</li>
            <li>All participants can draw and see changes in real-time</li>
            <li>Use Ctrl+Z to undo and Ctrl+Y to redo</li>
            {isTutor && <li>Click "Export" to save your work as an image</li>}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Whiteboard
