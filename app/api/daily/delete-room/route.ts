import { NextRequest, NextResponse } from 'next/server'

const DAILY_API_KEY = process.env.DAILY_API_KEY
const DAILY_API_URL = 'https://api.daily.co/v1'

export async function POST(request: NextRequest) {
  try {
    if (!DAILY_API_KEY) {
      return NextResponse.json(
        { error: 'DAILY_API_KEY is not configured' },
        { status: 500 }
      )
    }

    const { roomName } = await request.json()
    console.log('Deleting room:', roomName)

    const response = await fetch(`${DAILY_API_URL}/rooms/${roomName}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${DAILY_API_KEY}`,
      },
    })

    if (!response.ok && response.status !== 404) {
      const error = await response.json()
      console.error('Failed to delete room:', error)
      return NextResponse.json(
        { error: error.error || 'Failed to delete room' },
        { status: response.status }
      )
    }

    console.log('Room deleted successfully')
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting room:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete room' },
      { status: 500 }
    )
  }
}

