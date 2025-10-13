// Email HTML Templates as plain strings

interface BookingConfirmationEmailProps {
  studentName: string
  tutorName: string
  className: string
  subject: string
  duration: number
  scheduledSlots: Array<{ day: string; time: string }>
  bookingId: string
}

export function BookingConfirmationEmail({
  studentName,
  tutorName,
  className,
  subject,
  duration,
  scheduledSlots,
  bookingId,
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
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #2563eb; color: white; padding: 32px; text-align: center;">
        <h1 style="margin: 0; font-size: 28px;">Booking Confirmed! 🎉</h1>
      </div>
      
      <div style={{ padding: '32px', backgroundColor: '#ffffff' }}>
        <p style={{ fontSize: '16px', color: '#334155', marginBottom: '24px' }}>
          Hi <strong>{studentName}</strong>,
        </p>
        
        <p style={{ fontSize: '16px', color: '#334155', marginBottom: '24px' }}>
          Great news! Your tutoring sessions have been successfully booked.
        </p>
        
        <div style={{ backgroundColor: '#f1f5f9', borderRadius: '8px', padding: '20px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', color: '#1e293b', marginTop: 0 }}>
            Class Details
          </h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ padding: '8px 0', color: '#64748b' }}>Class:</td>
                <td style={{ padding: '8px 0', color: '#1e293b', fontWeight: 'bold' }}>{className}</td>
              </tr>
              <tr>
                <td style={{ padding: '8px 0', color: '#64748b' }}>Subject:</td>
                <td style={{ padding: '8px 0', color: '#1e293b' }}>{subject}</td>
              </tr>
              <tr>
                <td style={{ padding: '8px 0', color: '#64748b' }}>Tutor:</td>
                <td style={{ padding: '8px 0', color: '#1e293b' }}>{tutorName}</td>
              </tr>
              <tr>
                <td style={{ padding: '8px 0', color: '#64748b' }}>Duration:</td>
                <td style={{ padding: '8px 0', color: '#1e293b' }}>{duration} minutes</td>
              </tr>
              <tr>
                <td style={{ padding: '8px 0', color: '#64748b' }}>Total Sessions:</td>
                <td style={{ padding: '8px 0', color: '#1e293b' }}>{scheduledSlots.length}</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div style={{ backgroundColor: '#eff6ff', borderRadius: '8px', padding: '20px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', color: '#1e40af', marginTop: 0 }}>
            📅 Your Weekly Schedule
          </h3>
          {scheduledSlots.map((slot, index) => (
            <div key={index} style={{ padding: '8px 0', color: '#1e293b' }}>
              <strong>{slot.day}</strong> at <strong style={{ color: '#2563eb' }}>{slot.time}</strong>
            </div>
          ))}
        </div>
        
        <div style={{ backgroundColor: '#fef3c7', borderRadius: '8px', padding: '16px', marginBottom: '24px' }}>
          <p style={{ margin: 0, fontSize: '14px', color: '#92400e' }}>
            <strong>📧 What's Next?</strong><br />
            You'll receive classroom links 30 minutes before each session. 
            Your tutor may also reach out to you directly.
          </p>
        </div>
        
        <p style={{ fontSize: '16px', color: '#334155', marginBottom: '24px' }}>
          If you need to reschedule or have any questions, please contact your tutor directly.
        </p>
        
        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <a 
            href={`${process.env.NEXT_PUBLIC_APP_URL}/student/bookings`}
            style={{
              backgroundColor: '#2563eb',
              color: 'white',
              padding: '12px 24px',
              textDecoration: 'none',
              borderRadius: '8px',
              display: 'inline-block',
              fontWeight: 'bold'
            }}
          >
            View Your Bookings
          </a>
        </div>
      </div>
      
      <div style={{ backgroundColor: '#f8fafc', padding: '24px', textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
          © {new Date().getFullYear()} Classroomly. All rights reserved.
        </p>
      </div>
    </div>
  )
}

interface TutorBookingNotificationEmailProps {
  tutorName: string
  studentName: string
  studentEmail: string
  className: string
  scheduledSlots: Array<{ day: string; time: string }>
  notes?: string
}

export function TutorBookingNotificationEmail({
  tutorName,
  studentName,
  studentEmail,
  className,
  scheduledSlots,
  notes,
}: TutorBookingNotificationEmailProps) {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ backgroundColor: '#2563eb', color: 'white', padding: '32px', textAlign: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '28px' }}>New Booking Received! 📚</h1>
      </div>
      
      <div style={{ padding: '32px', backgroundColor: '#ffffff' }}>
        <p style={{ fontSize: '16px', color: '#334155', marginBottom: '24px' }}>
          Hi <strong>{tutorName}</strong>,
        </p>
        
        <p style={{ fontSize: '16px', color: '#334155', marginBottom: '24px' }}>
          You have a new student booking for <strong>{className}</strong>!
        </p>
        
        <div style={{ backgroundColor: '#f1f5f9', borderRadius: '8px', padding: '20px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', color: '#1e293b', marginTop: 0 }}>
            Student Information
          </h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ padding: '8px 0', color: '#64748b' }}>Name:</td>
                <td style={{ padding: '8px 0', color: '#1e293b', fontWeight: 'bold' }}>{studentName}</td>
              </tr>
              <tr>
                <td style={{ padding: '8px 0', color: '#64748b' }}>Email:</td>
                <td style={{ padding: '8px 0', color: '#1e293b' }}>{studentEmail}</td>
              </tr>
              <tr>
                <td style={{ padding: '8px 0', color: '#64748b' }}>Sessions:</td>
                <td style={{ padding: '8px 0', color: '#1e293b' }}>{scheduledSlots.length} per week</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div style={{ backgroundColor: '#eff6ff', borderRadius: '8px', padding: '20px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', color: '#1e40af', marginTop: 0 }}>
            📅 Scheduled Sessions
          </h3>
          {scheduledSlots.map((slot, index) => (
            <div key={index} style={{ padding: '8px 0', color: '#1e293b' }}>
              <strong>{slot.day}</strong> at <strong style={{ color: '#2563eb' }}>{slot.time}</strong>
            </div>
          ))}
        </div>
        
        {notes && (
          <div style={{ backgroundColor: '#fef3c7', borderRadius: '8px', padding: '16px', marginBottom: '24px' }}>
            <p style={{ margin: 0, fontSize: '14px', color: '#92400e' }}>
              <strong>📝 Student Notes:</strong><br />
              {notes}
            </p>
          </div>
        )}
        
        <p style={{ fontSize: '16px', color: '#334155', marginBottom: '24px' }}>
          You can view full booking details and prepare for your sessions in your dashboard.
        </p>
        
        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <a 
            href={`${process.env.NEXT_PUBLIC_APP_URL}/tutor/bookings`}
            style={{
              backgroundColor: '#2563eb',
              color: 'white',
              padding: '12px 24px',
              textDecoration: 'none',
              borderRadius: '8px',
              display: 'inline-block',
              fontWeight: 'bold'
            }}
          >
            View Booking Details
          </a>
        </div>
      </div>
      
      <div style={{ backgroundColor: '#f8fafc', padding: '24px', textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
          © {new Date().getFullYear()} Classroomly. All rights reserved.
        </p>
      </div>
    </div>
  )
}

interface SessionReminderEmailProps {
  studentName: string
  tutorName: string
  className: string
  sessionDay: string
  sessionTime: string
  sessionDate: string
  roomUrl: string
  duration: number
}

export function SessionReminderEmail({
  studentName,
  tutorName,
  className,
  sessionDay,
  sessionTime,
  sessionDate,
  roomUrl,
  duration,
}: SessionReminderEmailProps) {
  const classroomUrl = `${process.env.NEXT_PUBLIC_APP_URL}/classroom/${roomUrl}`
  
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ backgroundColor: '#10b981', color: 'white', padding: '32px', textAlign: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '28px' }}>Session Reminder ⏰</h1>
      </div>
      
      <div style={{ padding: '32px', backgroundColor: '#ffffff' }}>
        <p style={{ fontSize: '16px', color: '#334155', marginBottom: '24px' }}>
          Hi <strong>{studentName}</strong>,
        </p>
        
        <p style={{ fontSize: '16px', color: '#334155', marginBottom: '24px' }}>
          Your tutoring session is coming up soon!
        </p>
        
        <div style={{ backgroundColor: '#f0fdf4', borderRadius: '8px', padding: '24px', marginBottom: '24px', border: '2px solid #10b981' }}>
          <h2 style={{ fontSize: '20px', color: '#065f46', marginTop: 0, marginBottom: '16px' }}>
            Session Details
          </h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ padding: '8px 0', color: '#64748b' }}>Class:</td>
                <td style={{ padding: '8px 0', color: '#1e293b', fontWeight: 'bold' }}>{className}</td>
              </tr>
              <tr>
                <td style={{ padding: '8px 0', color: '#64748b' }}>Tutor:</td>
                <td style={{ padding: '8px 0', color: '#1e293b' }}>{tutorName}</td>
              </tr>
              <tr>
                <td style={{ padding: '8px 0', color: '#64748b' }}>Date:</td>
                <td style={{ padding: '8px 0', color: '#1e293b' }}>{sessionDate}</td>
              </tr>
              <tr>
                <td style={{ padding: '8px 0', color: '#64748b' }}>Time:</td>
                <td style={{ padding: '8px 0', color: '#1e293b', fontWeight: 'bold' }}>{sessionTime}</td>
              </tr>
              <tr>
                <td style={{ padding: '8px 0', color: '#64748b' }}>Duration:</td>
                <td style={{ padding: '8px 0', color: '#1e293b' }}>{duration} minutes</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <a 
            href={classroomUrl}
            style={{
              backgroundColor: '#10b981',
              color: 'white',
              padding: '16px 32px',
              textDecoration: 'none',
              borderRadius: '8px',
              display: 'inline-block',
              fontWeight: 'bold',
              fontSize: '18px'
            }}
          >
            Join Classroom
          </a>
        </div>
        
        <div style={{ backgroundColor: '#fef3c7', borderRadius: '8px', padding: '16px' }}>
          <p style={{ margin: 0, fontSize: '14px', color: '#92400e' }}>
            <strong>💡 Tip:</strong> Join a few minutes early to test your camera and microphone!
          </p>
        </div>
      </div>
      
      <div style={{ backgroundColor: '#f8fafc', padding: '24px', textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
          © {new Date().getFullYear()} Classroomly. All rights reserved.
        </p>
      </div>
    </div>
  )
}

