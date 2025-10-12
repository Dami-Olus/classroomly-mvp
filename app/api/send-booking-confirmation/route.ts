import { NextRequest, NextResponse } from 'next/server'
import { resend, FROM_EMAIL, FROM_NAME } from '@/lib/email/resend'
import {
  generateBookingConfirmationEmail,
  generateTutorBookingNotificationEmail,
} from '@/lib/email/templates-html'

export async function POST(request: NextRequest) {
  try {
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

    const studentEmailResult = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: studentEmail,
      subject: `Booking Confirmed: ${className}`,
      html: studentEmailHtml,
    })

    // Send notification email to tutor
    const tutorEmailHtml = generateTutorBookingNotificationEmail({
      tutorName,
      studentName,
      studentEmail,
      className,
      scheduledSlots,
      notes,
    })

    const tutorEmailResult = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: tutorEmail,
      subject: `New Booking: ${studentName} for ${className}`,
      html: tutorEmailHtml,
    })

    return NextResponse.json({
      success: true,
      studentEmail: studentEmailResult,
      tutorEmail: tutorEmailResult,
    })
  } catch (error: any) {
    console.error('Error sending emails:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send emails' },
      { status: 500 }
    )
  }
}

