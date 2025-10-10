import { NextRequest, NextResponse } from 'next/server'

const DAILY_API_KEY = process.env.DAILY_API_KEY
const DAILY_API_URL = 'https://api.daily.co/v1'

export async function POST(request: NextRequest) {
  try {
    if (!DAILY_API_KEY) {
      throw new Error('DAILY_API_KEY is not configured')
    }

    const { roomName, userName, isOwner } = await request.json()

    // Create a meeting token for this user
    const response = await fetch(`${DAILY_API_URL}/meeting-tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DAILY_API_KEY}`,
      },
      body: JSON.stringify({
        properties: {
          room_name: roomName,
          user_name: userName,
          is_owner: isOwner || false,
          enable_screenshare: true,
          enable_recording: isOwner ? true : false,
        },
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create token')
    }

    const tokenData = await response.json()

    return NextResponse.json({
      token: tokenData.token,
    })
  } catch (error: any) {
    console.error('Error creating Daily token:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create token' },
      { status: 500 }
    )
  }
}

