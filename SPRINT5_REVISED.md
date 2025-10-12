# Sprint 5: Rescheduling & Material Sharing (REVISED)

## ✅ Key Change
**Chat removed from classroom** - Daily.co already has built-in chat for live sessions.

Instead, we'll build **persistent messaging** for tutor-student communication outside of live sessions (like booking confirmations, questions, follow-ups).

---

## 🎯 Sprint 5 Features (Updated)

### 1. **Session Materials** 📁
Upload and share files during and after tutoring sessions.

### 2. **Session Notes** 📝
Tutors add notes after each session to track progress.

### 3. **Rescheduling System** 🔄
Request and manage session time changes.

### 4. **Persistent Messaging** 💬
Tutor-student messaging **outside** of live video sessions.

---

## 📋 Detailed Feature Breakdown

### 1. Session Materials (Priority 1)

**What it is:**
- File upload/download system
- Shared library of materials per booking/class
- Accessible before, during, and after sessions

**Where it lives:**
- Tutor dashboard: Upload materials for a class
- Student dashboard: View/download materials
- Booking detail page: Materials specific to that booking
- (NOT in the video classroom - separate section)

**Use Cases:**
- Tutor uploads homework before session
- Student downloads practice problems
- Tutor shares session slides after class
- Student accesses previous materials for review

**Database:**
```sql
CREATE TABLE session_materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES profiles(id),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL, -- Supabase Storage URL
  file_size INTEGER,
  file_type TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Storage Structure:**
```
materials/
  {booking_id}/
    {timestamp}_{filename}
```

---

### 2. Session Notes (Priority 2)

**What it is:**
- Tutor-only feature to document each session
- Track student progress, topics covered, homework assigned
- Visible to student (except private notes)

**Where it lives:**
- Tutor adds notes after session on booking detail page
- Student views notes on their booking detail page
- Session history shows all notes chronologically

**Use Cases:**
- Tutor documents what was covered
- Track student performance over time
- Assign homework
- Note areas needing improvement
- Private tutor notes (reminders for next session)

**Database:**
```sql
CREATE TABLE session_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  tutor_id UUID REFERENCES tutors(id),
  content TEXT NOT NULL,
  topics_covered TEXT[],
  homework_assigned TEXT,
  student_performance TEXT,
  private_notes TEXT, -- Only visible to tutor
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

### 3. Rescheduling System (Priority 3)

**What it is:**
- Allow either party to request a reschedule
- Approval workflow (pending → accepted/declined)
- Automatically updates booking and classroom when accepted

**Where it lives:**
- Booking detail page has "Request Reschedule" button
- Notifications section shows pending requests
- Email notifications sent to both parties

**Workflow:**
```
Student/Tutor → Request Reschedule → Select New Time → Add Reason
              ↓
Other Party Receives Notification
              ↓
Accept → Booking Updated → Both Notified
  OR
Decline → Booking Unchanged → Requester Notified
```

**Rules:**
- Can only reschedule up to 24 hours before session
- New time must be within tutor's availability
- Check for conflicts with tutor's global schedule
- Limit: Max 2 reschedules per booking
- Status tracking: pending, accepted, declined, cancelled

**Database:**
```sql
CREATE TABLE reschedule_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  requested_by UUID REFERENCES profiles(id),
  original_slot JSONB NOT NULL, -- {day, time, date}
  proposed_slot JSONB NOT NULL, -- {day, time, date}
  reason TEXT,
  status TEXT DEFAULT 'pending',
  responded_by UUID REFERENCES profiles(id),
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

### 4. Persistent Messaging (Priority 4)

**What it is:**
- Ongoing conversation thread between tutor and student
- Per booking or per student-tutor relationship
- Like WhatsApp/SMS - persistent across sessions
- NOT tied to live video session

**Where it lives:**
- Messages tab in tutor/student dashboard
- Booking detail page has "Message" button
- Notification badge for unread messages

**Use Cases:**
- "Can we reschedule tomorrow's session?"
- "I have a question about the homework"
- "Here's additional material for the topic we discussed"
- Follow-up after session
- Quick questions between sessions

**Key Differences from Daily.co Chat:**
- **Persistent**: Messages saved forever, not tied to session
- **Asynchronous**: Send anytime, not just during live session
- **Thread-based**: Organized by booking or student-tutor pair
- **Notifications**: Email/push when new message received
- **Outside video**: Accessible from dashboard, not classroom

**Database:**
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id),
  recipient_id UUID REFERENCES profiles(id),
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_messages_booking ON messages(booking_id);
CREATE INDEX idx_messages_recipient_unread ON messages(recipient_id, read);
```

**Features:**
- Real-time delivery (Supabase Realtime)
- Read receipts
- Unread count badge
- Message timestamps
- Link to booking context

---

## 🗄️ Updated Database Migration

**File:** `supabase/migrations/008_sprint5_revised.sql`

```sql
-- Sprint 5: Rescheduling & Material Sharing (Revised - No In-Session Chat)

-- 1. Session Materials
CREATE TABLE IF NOT EXISTS session_materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES profiles(id),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_materials_booking ON session_materials(booking_id);
CREATE INDEX IF NOT EXISTS idx_materials_uploader ON session_materials(uploaded_by);

-- 2. Session Notes
CREATE TABLE IF NOT EXISTS session_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  tutor_id UUID NOT NULL REFERENCES tutors(id),
  content TEXT NOT NULL,
  topics_covered TEXT[],
  homework_assigned TEXT,
  student_performance TEXT,
  private_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_performance CHECK (student_performance IN ('excellent', 'good', 'satisfactory', 'needs_improvement'))
);

CREATE INDEX IF NOT EXISTS idx_notes_booking ON session_notes(booking_id);
CREATE INDEX IF NOT EXISTS idx_notes_tutor ON session_notes(tutor_id);

-- 3. Reschedule Requests
CREATE TABLE IF NOT EXISTS reschedule_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES profiles(id),
  original_slot JSONB NOT NULL,
  proposed_slot JSONB NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  responded_by UUID REFERENCES profiles(id),
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_status CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled'))
);

CREATE INDEX IF NOT EXISTS idx_reschedule_booking ON reschedule_requests(booking_id);
CREATE INDEX IF NOT EXISTS idx_reschedule_status ON reschedule_requests(status);

-- 4. Persistent Messages (NOT in-session chat, but async messaging)
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id),
  recipient_id UUID NOT NULL REFERENCES profiles(id),
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_booking ON messages(booking_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(recipient_id, read) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);

-- RLS Policies

-- Session Materials
ALTER TABLE session_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Booking participants can view materials" ON session_materials
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bookings b
      JOIN classes c ON b.class_id = c.id
      JOIN tutors t ON c.tutor_id = t.id
      WHERE b.id = session_materials.booking_id
      AND (b.student_id = auth.uid() OR t.user_id = auth.uid())
    )
  );

CREATE POLICY "Participants can upload materials" ON session_materials
  FOR INSERT WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Uploader can delete materials" ON session_materials
  FOR DELETE USING (uploaded_by = auth.uid());

-- Session Notes
ALTER TABLE session_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tutor and student can view notes" ON session_notes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bookings b
      JOIN classes c ON b.class_id = c.id
      JOIN tutors t ON c.tutor_id = t.id
      WHERE b.id = session_notes.booking_id
      AND (b.student_id = auth.uid() OR t.user_id = auth.uid())
    )
  );

CREATE POLICY "Tutors can create notes" ON session_notes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM tutors WHERE id = session_notes.tutor_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Tutors can update their notes" ON session_notes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM tutors WHERE id = session_notes.tutor_id AND user_id = auth.uid()
    )
  );

-- Reschedule Requests
ALTER TABLE reschedule_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Booking participants can view reschedule requests" ON reschedule_requests
  FOR SELECT USING (
    requested_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM bookings b
      JOIN classes c ON b.class_id = c.id
      JOIN tutors t ON c.tutor_id = t.id
      WHERE b.id = reschedule_requests.booking_id
      AND (b.student_id = auth.uid() OR t.user_id = auth.uid())
    )
  );

CREATE POLICY "Participants can create reschedule requests" ON reschedule_requests
  FOR INSERT WITH CHECK (requested_by = auth.uid());

CREATE POLICY "Participants can update reschedule requests" ON reschedule_requests
  FOR UPDATE USING (
    requested_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM bookings b
      JOIN classes c ON b.class_id = c.id
      JOIN tutors t ON c.tutor_id = t.id
      WHERE b.id = reschedule_requests.booking_id
      AND (b.student_id = auth.uid() OR t.user_id = auth.uid())
    )
  );

-- Messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their messages" ON messages
  FOR SELECT USING (
    sender_id = auth.uid() OR recipient_id = auth.uid()
  );

CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Recipients can mark messages as read" ON messages
  FOR UPDATE USING (recipient_id = auth.uid());

-- Enable Realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Comments
COMMENT ON TABLE session_materials IS 'Files and materials shared for tutoring sessions, accessible outside of live video';
COMMENT ON TABLE session_notes IS 'Notes taken by tutors after each session to track progress';
COMMENT ON TABLE reschedule_requests IS 'Requests to reschedule bookings, with approval workflow';
COMMENT ON TABLE messages IS 'Persistent messaging between tutor and student, separate from Daily.co in-session chat';
```

---

## 🎨 Updated Architecture

### What's in the Video Classroom?
- ✅ Daily.co video/audio
- ✅ Daily.co built-in chat (during session)
- ✅ Daily.co screen sharing
- ✅ Daily.co recording (if enabled)

### What's Outside the Video Classroom?
- ✅ Session materials (upload/download)
- ✅ Session notes (after session)
- ✅ Persistent messaging (async)
- ✅ Rescheduling requests
- ✅ Booking management

---

## 🚀 Revised Implementation Order

### Phase 1: Session Materials (PRIORITY 1)
**Time:** 2-3 hours

1. Create `session_materials` table
2. Set up Supabase Storage bucket
3. Build file upload component
4. Add materials section to booking detail page
5. Implement download functionality
6. Add delete for uploader

**Why first?** Most commonly used, simplest to implement, high value.

### Phase 2: Session Notes (PRIORITY 2)
**Time:** 2 hours

1. Create `session_notes` table
2. Build notes form (tutor-only)
3. Add notes section to booking detail
4. Implement edit functionality
5. Create notes history view
6. Handle private notes visibility

**Why second?** Tutors need this immediately after sessions, professional feature.

### Phase 3: Rescheduling (PRIORITY 3)
**Time:** 3-4 hours

1. Create `reschedule_requests` table
2. Build reschedule modal
3. Implement request creation
4. Add approval workflow
5. Update booking on acceptance
6. Email notifications

**Why third?** More complex, but essential for flexibility.

### Phase 4: Persistent Messaging (PRIORITY 4)
**Time:** 3 hours

1. Create `messages` table
2. Build messaging UI
3. Implement real-time with Supabase
4. Add unread count
5. Email notifications for new messages
6. Mobile-responsive design

**Why last?** Nice to have, but not critical. Users can use email/phone for now.

---

## ✅ Success Criteria

Sprint 5 is complete when:
- ✅ Users can upload/download materials per booking
- ✅ Tutors can add session notes after each session
- ✅ Either party can request reschedule with approval workflow
- ✅ Async messaging works between tutor-student pairs
- ✅ All features have proper RLS and security
- ✅ Mobile responsive
- ✅ Email notifications for key actions

---

## 🎯 Which Feature First?

Recommended order:
1. **Session Materials** ← Start here (most value, easiest)
2. Session Notes
3. Rescheduling
4. Persistent Messaging

**Ready to start with Session Materials?** 📁🚀

