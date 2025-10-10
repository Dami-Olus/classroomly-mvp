import DailyIframe from '@daily-co/daily-js'

export interface DailyConfig {
  roomUrl?: string
  token?: string
}

export const createDailyRoom = async (roomName?: string): Promise<any> => {
  try {
    const response = await fetch('/api/daily/create-room', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ roomName }),
    })

    if (!response.ok) {
      throw new Error('Failed to create room')
    }

    return await response.json()
  } catch (error) {
    console.error('Error creating Daily room:', error)
    throw error
  }
}

export const getDailyRoomUrl = (roomName: string): string => {
  const domain = process.env.NEXT_PUBLIC_DAILY_DOMAIN
  return `https://${domain}.daily.co/${roomName}`
}

export const createDailyClient = (config?: DailyConfig) => {
  return DailyIframe.createFrame(config)
}

export const getDailyToken = async (roomName: string): Promise<string> => {
  try {
    const response = await fetch('/api/daily/get-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ roomName }),
    })

    if (!response.ok) {
      throw new Error('Failed to get token')
    }

    const data = await response.json()
    return data.token
  } catch (error) {
    console.error('Error getting Daily token:', error)
    throw error
  }
}

