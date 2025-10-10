import { NextRequest, NextResponse } from 'next/server'

const DAILY_API_KEY = process.env.DAILY_API_KEY
const DAILY_API_URL = 'https://api.daily.co/v1'

export async function POST(request: NextRequest) {
  try {
    if (!DAILY_API_KEY) {
      throw new Error('DAILY_API_KEY is not configured')
    }

    const { roomName } = await request.json()

    // Create a Daily.co room
    const response = await fetch(`${DAILY_API_URL}/rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DAILY_API_KEY}`,
      },
      body: JSON.stringify({
        name: roomName || undefined,
        privacy: 'private',
        properties: {
          enable_screenshare: true,
          enable_chat: true,
          enable_knocking: false,
          start_video_off: false,
          start_audio_off: false,
          enable_recording: 'cloud',
          max_participants: 10,
        },
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create room')
    }

    const room = await response.json()

    return NextResponse.json({
      roomName: room.name,
      roomUrl: room.url,
      config: room.config,
    })
  } catch (error: any) {
    console.error('Error creating Daily room:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create room' },
      { status: 500 }
    )
  }
}

