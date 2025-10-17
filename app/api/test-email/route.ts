import { NextRequest, NextResponse } from 'next/server'
import { resend, FROM_EMAIL, FROM_NAME } from '@/lib/email/resend'

export async function POST(request: NextRequest) {
  try {
    // Check if Resend is configured
    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'placeholder') {
      return NextResponse.json(
        { 
          error: 'Email service not configured',
          details: 'RESEND_API_KEY is missing or not set properly',
          configured: false
        },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { testEmail } = body

    if (!testEmail) {
      return NextResponse.json(
        { error: 'testEmail is required' },
        { status: 400 }
      )
    }

    console.log('📧 Testing email configuration...')
    console.log('📧 From:', FROM_EMAIL)
    console.log('📧 To:', testEmail)

    // Send a simple test email
    const result = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: testEmail,
      subject: 'ClassroomLY Email Test',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">📧 Email Test Successful!</h1>
          <p>This is a test email from ClassroomLY to verify that email sending is working correctly.</p>
          <p><strong>Configuration:</strong></p>
          <ul>
            <li>From: ${FROM_NAME} &lt;${FROM_EMAIL}&gt;</li>
            <li>To: ${testEmail}</li>
            <li>Timestamp: ${new Date().toISOString()}</li>
          </ul>
          <p>If you received this email, the Resend integration is working properly! 🎉</p>
        </div>
      `,
    })

    console.log('📧 Test email result:', result)

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
      result,
      configuration: {
        from: FROM_EMAIL,
        fromName: FROM_NAME,
        hasApiKey: !!process.env.RESEND_API_KEY,
      }
    })
  } catch (error: any) {
    console.error('📧 Test email error:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Failed to send test email',
        details: error.toString(),
        configured: false
      },
      { status: 500 }
    )
  }
}
