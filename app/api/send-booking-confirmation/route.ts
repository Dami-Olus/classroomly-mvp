import { NextRequest, NextResponse } from 'next/server'
import { resend, FROM_EMAIL, FROM_NAME } from '@/lib/email/resend'
import {
  generateBookingConfirmationEmail,
  generateTutorBookingNotificationEmail,
} from '@/lib/email/templates-html'

export async function POST(request: NextRequest) {
  try {
    // Check if Resend is configured
    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'placeholder') {
      console.error('📧 RESEND_API_KEY not configured')
      return NextResponse.json(
        { error: 'Email service not configured. RESEND_API_KEY is missing.' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const {
      studentName,
      studentEmail,
      tutorName,
      tutorEmail,
      className,
      subject,
      duration,
      scheduledSlots,
      bookingId,
      notes,
    } = body

    console.log('📧 Sending booking confirmation emails...')
    console.log('📧 Student:', { name: studentName, email: studentEmail })
    console.log('📧 Tutor:', { name: tutorName, email: tutorEmail })

    // Send confirmation email to student
    const studentEmailHtml = generateBookingConfirmationEmail({
      studentName,
      tutorName,
      className,
      subject,
      duration,
      scheduledSlots,
      bookingId,
    })

    console.log('📧 Sending student email...')
    const studentEmailResult = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: studentEmail,
      subject: `Booking Confirmed: ${className}`,
      html: studentEmailHtml,
    })

    console.log('📧 Student email result:', studentEmailResult)

    // Check if student email failed
    if (studentEmailResult.error) {
      console.error('📧 Student email failed:', studentEmailResult.error)
      if (studentEmailResult.error.message?.includes('testing emails')) {
        console.error('📧 Resend domain not verified. Please verify domain at resend.com/domains')
      }
    }

    // Send notification email to tutor
    const tutorEmailHtml = generateTutorBookingNotificationEmail({
      tutorName,
      studentName,
      studentEmail,
      className,
      scheduledSlots,
      notes,
    })

    console.log('📧 Sending tutor email...')
    const tutorEmailResult = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: tutorEmail,
      subject: `New Booking: ${studentName} for ${className}`,
      html: tutorEmailHtml,
    })

    console.log('📧 Tutor email result:', tutorEmailResult)

    // Check if tutor email failed
    if (tutorEmailResult.error) {
      console.error('📧 Tutor email failed:', tutorEmailResult.error)
      if (tutorEmailResult.error.message?.includes('testing emails')) {
        console.error('📧 Resend domain not verified. Please verify domain at resend.com/domains')
      }
    }

    return NextResponse.json({
      success: true,
      studentEmail: studentEmailResult,
      tutorEmail: tutorEmailResult,
    })
  } catch (error: any) {
    console.error('📧 Error sending emails:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send emails' },
      { status: 500 }
    )
  }
}

