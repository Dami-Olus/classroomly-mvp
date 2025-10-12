# Sprint 5: Rescheduling & Material Sharing

## Overview
Implement advanced features to enhance the tutoring experience: rescheduling system, material sharing, enhanced chat, and session notes.

---

## 🎯 Sprint Goals

### Core Features
1. **Rescheduling System** - Allow tutors and students to reschedule sessions
2. **Material Sharing** - Upload and share files in classrooms
3. **Session Notes** - Tutors can add notes after each session
4. **Enhanced Chat** - Real-time messaging in classroom (basic implementation)

---

## 📋 Feature Breakdown

### 1. Rescheduling System

**User Stories:**
- As a **tutor**, I want to propose a new time if I can't make a session
- As a **student**, I want to request a reschedule if I have a conflict
- As either, I want to see rescheduling requests and accept/decline them
- As either, I want to see the history of reschedules

**Database Changes:**
```sql
-- New table: reschedule_requests
CREATE TABLE reschedule_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  requested_by UUID REFERENCES profiles(id),
  original_slot JSONB NOT NULL, -- {day, time}
  proposed_slot JSONB NOT NULL, -- {day, time}
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, accepted, declined
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**UI Components:**
- Reschedule button on booking cards
- Reschedule modal with date/time picker
- Notifications for pending requests
- Reschedule history view

**Workflow:**
1. User clicks "Reschedule" on a booking
2. Selects new date/time from available slots
3. Adds reason (optional)
4. Other party receives notification
5. They can accept or decline
6. If accepted, booking updates and classroom adjusts

**Considerations:**
- Only allow rescheduling up to 24 hours before session
- Check new time against tutor's global availability
- Update classroom `session_date` if accepted
- Send email notifications for requests
- Limit number of reschedules per booking (e.g., max 2)

---

### 2. Material Sharing

**User Stories:**
- As a **tutor**, I want to upload materials before/during/after a session
- As a **student**, I want to access all materials shared in my sessions
- As either, I want to download materials for offline use
- As a **tutor**, I want to organize materials by session or topic

**Database Changes:**
```sql
-- New table: session_materials
CREATE TABLE session_materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  classroom_id UUID REFERENCES classrooms(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES profiles(id),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER, -- in bytes
  file_type TEXT, -- pdf, doc, image, etc.
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX idx_materials_classroom ON session_materials(classroom_id);
CREATE INDEX idx_materials_uploader ON session_materials(uploaded_by);
```

**Storage Structure (Supabase Storage):**
```
materials/
  {classroom_id}/
    {material_id}_{filename}
```

**UI Components:**
- Materials tab in classroom
- Drag-and-drop upload zone
- File list with preview/download
- Delete button for uploader
- File size limits and validation

**Features:**
- Upload multiple files
- Preview for images/PDFs
- Download individual or all files (zip)
- Show upload progress
- File type restrictions (pdf, doc, ppt, images, max 10MB per file)

**Security:**
- Only participants can view materials
- Only uploader can delete
- Scan for malware (Supabase has built-in scanning)
- RLS policies to protect files

---

### 3. Session Notes

**User Stories:**
- As a **tutor**, I want to add notes after each session
- As a **tutor**, I want to track student progress over time
- As a **student**, I want to see my tutor's notes
- As a **tutor**, I want to use AI to help summarize sessions (future)

**Database Changes:**
```sql
-- New table: session_notes
CREATE TABLE session_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  classroom_id UUID REFERENCES classrooms(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  tutor_id UUID REFERENCES tutors(id),
  content TEXT NOT NULL,
  topics_covered TEXT[], -- array of topics
  homework_assigned TEXT,
  student_performance TEXT, -- excellent, good, needs_improvement
  private_notes TEXT, -- only visible to tutor
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX idx_notes_classroom ON session_notes(classroom_id);
CREATE INDEX idx_notes_booking ON session_notes(booking_id);
CREATE INDEX idx_notes_tutor ON session_notes(tutor_id);
```

**UI Components:**
- Notes tab in classroom
- Rich text editor for note taking
- Tags for topics covered
- Performance rating
- Private notes section (tutor only)
- Notes history view

**Features:**
- Add notes during or after session
- Edit notes within 24 hours
- View all notes for a student
- Export notes as PDF
- Search notes by topic or date
- Mark homework as assigned

---

### 4. Enhanced Chat (Basic)

**User Stories:**
- As either user, I want to chat in real-time during sessions
- As either user, I want to see chat history
- As either user, I want to see when the other person is typing

**Database Changes:**
```sql
-- New table: chat_messages
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  classroom_id UUID REFERENCES classrooms(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id),
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX idx_messages_classroom ON chat_messages(classroom_id);
CREATE INDEX idx_messages_created ON chat_messages(created_at);
```

**Implementation:**
- Use Supabase Realtime for instant messaging
- Subscribe to chat_messages table
- Show typing indicator (presence)
- Auto-scroll to latest message
- Message timestamps
- Simple text messages (no attachments for MVP)

**UI Components:**
- Chat sidebar in classroom
- Message input
- Message list with timestamps
- Typing indicator
- Unread message count

---

## 🗄️ Database Migration

**File:** `supabase/migrations/008_sprint5_features.sql`

```sql
-- Sprint 5: Rescheduling & Material Sharing

-- 1. Reschedule Requests
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

-- 2. Session Materials
CREATE TABLE IF NOT EXISTS session_materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  classroom_id UUID NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES profiles(id),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Session Notes
CREATE TABLE IF NOT EXISTS session_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  classroom_id UUID NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
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

-- 4. Chat Messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  classroom_id UUID NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id),
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reschedule_booking ON reschedule_requests(booking_id);
CREATE INDEX IF NOT EXISTS idx_reschedule_status ON reschedule_requests(status);
CREATE INDEX IF NOT EXISTS idx_materials_classroom ON session_materials(classroom_id);
CREATE INDEX IF NOT EXISTS idx_materials_uploader ON session_materials(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_notes_classroom ON session_notes(classroom_id);
CREATE INDEX IF NOT EXISTS idx_notes_booking ON session_notes(booking_id);
CREATE INDEX IF NOT EXISTS idx_notes_tutor ON session_notes(tutor_id);
CREATE INDEX IF NOT EXISTS idx_messages_classroom ON chat_messages(classroom_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON chat_messages(created_at DESC);

-- RLS Policies

-- Reschedule Requests
ALTER TABLE reschedule_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reschedule requests" ON reschedule_requests
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

CREATE POLICY "Users can create reschedule requests" ON reschedule_requests
  FOR INSERT WITH CHECK (requested_by = auth.uid());

CREATE POLICY "Users can update their reschedule requests" ON reschedule_requests
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

-- Session Materials
ALTER TABLE session_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Classroom participants can view materials" ON session_materials
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM classrooms cl
      JOIN bookings b ON cl.booking_id = b.id
      JOIN classes c ON b.class_id = c.id
      JOIN tutors t ON c.tutor_id = t.id
      WHERE cl.id = session_materials.classroom_id
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

-- Chat Messages
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Classroom participants can view messages" ON chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM classrooms cl
      JOIN bookings b ON cl.booking_id = b.id
      JOIN classes c ON b.class_id = c.id
      JOIN tutors t ON c.tutor_id = t.id
      WHERE cl.id = chat_messages.classroom_id
      AND (b.student_id = auth.uid() OR t.user_id = auth.uid())
    )
  );

CREATE POLICY "Participants can send messages" ON chat_messages
  FOR INSERT WITH CHECK (sender_id = auth.uid());

-- Enable Realtime for chat
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

-- Comments
COMMENT ON TABLE reschedule_requests IS 'Requests to reschedule bookings, can be initiated by tutor or student';
COMMENT ON TABLE session_materials IS 'Files and materials shared during tutoring sessions';
COMMENT ON TABLE session_notes IS 'Notes taken by tutors after each session';
COMMENT ON TABLE chat_messages IS 'Real-time chat messages within classroom sessions';
```

---

## 🎨 UI/UX Design

### Classroom Layout (Updated)

```
┌─────────────────────────────────────────────────────────┐
│ [Class Title] [Duration] [Participants] [Leave Button]  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌───────────────────────────┐  ┌──────────────────┐   │
│  │                           │  │  Chat / Materials│   │
│  │   Daily.co Video          │  │                  │   │
│  │   Frame                   │  │  [Tabs]          │   │
│  │                           │  │  - Chat          │   │
│  │                           │  │  - Materials     │   │
│  │                           │  │  - Notes         │   │
│  └───────────────────────────┘  │                  │   │
│                                  │  [Content Area]  │   │
│                                  │                  │   │
│                                  └──────────────────┘   │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Booking Card (With Reschedule)

```
┌────────────────────────────────────────┐
│ Math Tutoring                          │
│ with John Doe                          │
│                                        │
│ 📅 Monday, Jan 15, 2025                │
│ 🕐 10:00 AM - 11:00 AM                 │
│                                        │
│ Status: Confirmed                      │
│                                        │
│ [Join Classroom] [Reschedule] [Cancel]│
└────────────────────────────────────────┘
```

---

## 📦 Component Structure

```
components/
├── classroom/
│   ├── ChatPanel.tsx
│   ├── MaterialsPanel.tsx
│   ├── NotesPanel.tsx
│   ├── FileUpload.tsx
│   └── MessageList.tsx
├── booking/
│   ├── RescheduleModal.tsx
│   ├── RescheduleRequest.tsx
│   └── RescheduleHistory.tsx
└── materials/
    ├── MaterialCard.tsx
    └── MaterialUpload.tsx
```

---

## 🚀 Implementation Order

### Phase 1: Session Materials (Week 1)
1. Create database migration
2. Set up Supabase Storage bucket
3. Build file upload component
4. Create materials panel in classroom
5. Add download functionality
6. Test file permissions

### Phase 2: Chat System (Week 1)
1. Add chat_messages table
2. Enable Supabase Realtime
3. Build chat UI component
4. Implement real-time subscription
5. Add typing indicator
6. Test real-time sync

### Phase 3: Session Notes (Week 2)
1. Add session_notes table
2. Build notes editor component
3. Create notes panel in classroom
4. Add topics/homework fields
5. Build notes history view
6. Test privacy (tutor vs student view)

### Phase 4: Rescheduling (Week 2)
1. Add reschedule_requests table
2. Build reschedule modal
3. Create notification system
4. Implement accept/decline flow
5. Update booking on acceptance
6. Test with email notifications

---

## ✅ Testing Checklist

### Materials
- [ ] Upload file successfully
- [ ] Download file
- [ ] Delete own file
- [ ] Can't delete other's file
- [ ] File size validation
- [ ] File type validation

### Chat
- [ ] Send message
- [ ] Receive message in real-time
- [ ] See typing indicator
- [ ] Chat history loads
- [ ] Old messages visible

### Notes
- [ ] Tutor can add notes
- [ ] Student can view notes
- [ ] Student can't see private notes
- [ ] Edit notes works
- [ ] Notes history shows all sessions

### Rescheduling
- [ ] Request reschedule
- [ ] See pending requests
- [ ] Accept request
- [ ] Decline request
- [ ] Booking updates on acceptance
- [ ] Email notifications sent

---

## 📝 Success Criteria

✅ **Sprint 5 Complete When:**
1. Users can upload/download materials
2. Real-time chat works in classroom
3. Tutors can add session notes
4. Reschedule workflow is functional
5. All features have proper RLS
6. Mobile responsive
7. No major bugs

---

Ready to start implementation! Which feature should we tackle first?

1. **Session Materials** (file upload/sharing)
2. **Chat System** (real-time messaging)
3. **Session Notes** (tutor notes)
4. **Rescheduling** (booking changes)

Your choice! 🚀

