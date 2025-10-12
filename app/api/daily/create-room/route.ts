import { NextRequest, NextResponse } from 'next/server'

const DAILY_API_KEY = process.env.DAILY_API_KEY
const DAILY_API_URL = 'https://api.daily.co/v1'

interface CreateRoomRequest {
  roomName: string
}

interface CreateRoomResponse {
  roomName: string
  roomUrl: string
  config: any
}

interface DailyError {
  error: string
  info?: string
}

export async function POST(request: NextRequest): Promise<NextResponse<CreateRoomResponse | { error: string }>> {
  try {
    // Validate API key
    if (!DAILY_API_KEY) {
      console.error('DAILY_API_KEY is not configured')
      return NextResponse.json(
        { error: 'Daily.co API key is not configured' },
        { status: 500 }
      )
    }

    // Parse request body
    const { roomName }: CreateRoomRequest = await request.json()
    
    if (!roomName) {
      return NextResponse.json(
        { error: 'Room name is required' },
        { status: 400 }
      )
    }

    console.log('Creating Daily.co room:', roomName)

    // First, try to get existing room
    const existingRoomResponse = await fetch(`${DAILY_API_URL}/rooms/${roomName}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${DAILY_API_KEY}`,
      },
    })

    if (existingRoomResponse.ok) {
      const existingRoom = await existingRoomResponse.json()
      console.log('Using existing room:', existingRoom.name)
      
      return NextResponse.json({
        roomName: existingRoom.name,
        roomUrl: existingRoom.url,
        config: existingRoom.config,
      })
    }

    // Room doesn't exist, create new one
    const createResponse = await fetch(`${DAILY_API_URL}/rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DAILY_API_KEY}`,
      },
      body: JSON.stringify({
        name: roomName,
        privacy: 'public',
        properties: {
          enable_screenshare: true,
          enable_chat: true,
          enable_knocking: false,
          start_video_off: false,
          start_audio_off: false,
          max_participants: 10,
          exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
        },
      }),
    })

    if (!createResponse.ok) {
      const errorText = await createResponse.text()
      let errorData: DailyError
      
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { error: errorText }
      }
      
      console.error('Failed to create room:', errorData)
      
      return NextResponse.json(
        { error: errorData.error || 'Failed to create room' },
        { status: createResponse.status }
      )
    }

    const room = await createResponse.json()
    console.log('Room created successfully:', room.name)
    
    return NextResponse.json({
      roomName: room.name,
      roomUrl: room.url,
      config: room.config,
    })
    
  } catch (error: any) {
    console.error('Error in create-room API:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}