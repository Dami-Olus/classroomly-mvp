// Plain HTML email templates

interface BookingConfirmationEmailProps {
  studentName: string
  tutorName: string
  className: string
  subject: string
  duration: number
  scheduledSlots: Array<{ day: string; time: string }>
  bookingId: string
}

export function generateBookingConfirmationEmail({
  studentName,
  tutorName,
  className,
  subject,
  duration,
  scheduledSlots,
}: BookingConfirmationEmailProps): string {
  const slotsHTML = scheduledSlots
    .map(
      (slot) =>
        `<div style="padding: 8px 0; color: #1e293b;">
          <strong>${slot.day}</strong> at <strong style="color: #2563eb;">${slot.time}</strong>
        </div>`
    )
    .join('')

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f8fafc;">
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background-color: #2563eb; color: white; padding: 32px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">Booking Confirmed! 🎉</h1>
        </div>
        
        <div style="padding: 32px;">
          <p style="font-size: 16px; color: #334155; margin-bottom: 24px;">
            Hi <strong>${studentName}</strong>,
          </p>
          
          <p style="font-size: 16px; color: #334155; margin-bottom: 24px;">
            Great news! Your tutoring sessions have been successfully booked.
          </p>
          
          <div style="background-color: #f1f5f9; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
            <h2 style="font-size: 18px; color: #1e293b; margin-top: 0;">Class Details</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Class:</td>
                <td style="padding: 8px 0; color: #1e293b; font-weight: bold;">${className}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Subject:</td>
                <td style="padding: 8px 0; color: #1e293b;">${subject}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Tutor:</td>
                <td style="padding: 8px 0; color: #1e293b;">${tutorName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Duration:</td>
                <td style="padding: 8px 0; color: #1e293b;">${duration} minutes</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Total Sessions:</td>
                <td style="padding: 8px 0; color: #1e293b;">${scheduledSlots.length}</td>
              </tr>
            </table>
          </div>
          
          <div style="background-color: #eff6ff; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
            <h3 style="font-size: 16px; color: #1e40af; margin-top: 0;">📅 Your Weekly Schedule</h3>
            ${slotsHTML}
          </div>
          
          <div style="background-color: #fef3c7; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <p style="margin: 0; font-size: 14px; color: #92400e;">
              <strong>📧 What's Next?</strong><br />
              You'll receive classroom links before each session. Your tutor may also reach out to you directly.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 32px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/student/bookings" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
              View Your Bookings
            </a>
          </div>
        </div>
        
        <div style="background-color: #f8fafc; padding: 24px; text-align: center;">
          <p style="margin: 0; font-size: 14px; color: #64748b;">
            © ${new Date().getFullYear()} Classroomly. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

interface TutorBookingNotificationEmailProps {
  tutorName: string
  studentName: string
  studentEmail: string
  className: string
  scheduledSlots: Array<{ day: string; time: string }>
  notes?: string
}

export function generateTutorBookingNotificationEmail({
  tutorName,
  studentName,
  studentEmail,
  className,
  scheduledSlots,
  notes,
}: TutorBookingNotificationEmailProps): string {
  const slotsHTML = scheduledSlots
    .map(
      (slot) =>
        `<div style="padding: 8px 0; color: #1e293b;">
          <strong>${slot.day}</strong> at <strong style="color: #2563eb;">${slot.time}</strong>
        </div>`
    )
    .join('')

  const notesHTML = notes
    ? `<div style="background-color: #fef3c7; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <p style="margin: 0; font-size: 14px; color: #92400e;">
          <strong>📝 Student Notes:</strong><br />${notes}
        </p>
      </div>`
    : ''

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f8fafc;">
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background-color: #2563eb; color: white; padding: 32px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">New Booking Received! 📚</h1>
        </div>
        
        <div style="padding: 32px;">
          <p style="font-size: 16px; color: #334155; margin-bottom: 24px;">
            Hi <strong>${tutorName}</strong>,
          </p>
          
          <p style="font-size: 16px; color: #334155; margin-bottom: 24px;">
            You have a new student booking for <strong>${className}</strong>!
          </p>
          
          <div style="background-color: #f1f5f9; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
            <h2 style="font-size: 18px; color: #1e293b; margin-top: 0;">Student Information</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Name:</td>
                <td style="padding: 8px 0; color: #1e293b; font-weight: bold;">${studentName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Email:</td>
                <td style="padding: 8px 0; color: #1e293b;">${studentEmail}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Sessions:</td>
                <td style="padding: 8px 0; color: #1e293b;">${scheduledSlots.length} per week</td>
              </tr>
            </table>
          </div>
          
          <div style="background-color: #eff6ff; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
            <h3 style="font-size: 16px; color: #1e40af; margin-top: 0;">📅 Scheduled Sessions</h3>
            ${slotsHTML}
          </div>
          
          ${notesHTML}
          
          <div style="text-align: center; margin-top: 32px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/tutor/bookings" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
              View Booking Details
            </a>
          </div>
        </div>
        
        <div style="background-color: #f8fafc; padding: 24px; text-align: center;">
          <p style="margin: 0; font-size: 14px; color: #64748b;">
            © ${new Date().getFullYear()} Classroomly. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

