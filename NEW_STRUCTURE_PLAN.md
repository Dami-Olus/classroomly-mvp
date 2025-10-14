# New Application Structure - Clarified Requirements

## 🎯 Core Workflow

### 1. Class Creation (Tutor)
- Tutor creates a **Class** (e.g., "Math Tutoring for John")
- Class has: title, subject, duration, weekly schedule (days + times)
- Generates a unique booking link for this class
- One class = one student = one booking link

### 2. Booking (Student)
- Student receives link
- Books the class (selects start date, frequency)
- Creates ONE booking with multiple recurring sessions

### 3. Bookings Tab (Both)
- Shows the booking with all upcoming sessions
- Each session is a row with date/time
- Can reschedule individual sessions
- Can add notes per session

### 4. Session Management
- Each session has its own:
  - Date/time
  - Status (scheduled, completed, cancelled)
  - Materials (files for this specific session)
  - Session notes (what happened in this session)
  - Can be rescheduled individually

### 5. Class-Level Features
- Overall class notes (applies to entire class, not per session)
- Class report (aggregates all sessions + overall summary)
- Class materials (shared across all sessions)

---

## 📊 Data Structure Changes Needed

### Current Structure (Problematic):
```
Class → Booking → Classroom (one-to-one)
```

### New Structure (Correct):
```
Class → Booking → Sessions[] (one-to-many)
                 ↓
            Classroom (per session)
```

---

## 🗄️ Database Schema Changes

### New Table: `sessions`
```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  session_number INTEGER, -- 1, 2, 3, etc.
  scheduled_date DATE,
  scheduled_time TIME,
  scheduled_day TEXT, -- 'Monday', 'Tuesday', etc.
  status TEXT DEFAULT 'scheduled', -- 'scheduled', 'completed', 'cancelled', 'rescheduled'
  duration INTEGER, -- minutes
  classroom_id UUID REFERENCES classrooms(id), -- Created when session starts
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Update: `session_notes`
```sql
-- Add session_id instead of just booking_id
ALTER TABLE session_notes
ADD COLUMN session_id UUID REFERENCES sessions(id);
```

### New Table: `class_notes`
```sql
CREATE TABLE class_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  tutor_id UUID REFERENCES tutors(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### New Table: `class_reports`
```sql
CREATE TABLE class_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID REFERENCES classes(id),
  booking_id UUID REFERENCES bookings(id),
  tutor_id UUID REFERENCES tutors(id),
  student_id UUID,
  report_period TEXT, -- 'Month 1', 'Quarter 1', 'January 2024'
  overall_summary TEXT,
  strengths TEXT,
  areas_for_improvement TEXT,
  recommendations TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Update: `session_materials`
```sql
-- Add session_id for per-session materials
ALTER TABLE session_materials
ADD COLUMN session_id UUID REFERENCES sessions(id),
ADD COLUMN class_id UUID REFERENCES classes(id); -- For class-level materials

-- Make booking_id nullable since materials can be class-level or session-level
ALTER TABLE session_materials
ALTER COLUMN booking_id DROP NOT NULL;
```

---

## 🎨 UI Changes Needed

### 1. Bookings Tab (Tutor & Student)

**Current View:**
```
[Booking Card]
- Student Name
- Class Title
- Next Session: Monday, 2:00 PM
- [View Details]
```

**New View:**
```
[Booking Card - Expanded]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📚 Math Tutoring for John
👤 Student: John Doe
📅 Weekly: Monday, Wednesday @ 2:00 PM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Upcoming Sessions:
┌─────────────────────────────────────────┐
│ Session 1 • Mon, Jan 15 @ 2:00 PM      │
│ [Start Session] [Reschedule] [Notes]   │
├─────────────────────────────────────────┤
│ Session 2 • Wed, Jan 17 @ 2:00 PM      │
│ [Start Session] [Reschedule] [Notes]   │
├─────────────────────────────────────────┤
│ Session 3 • Mon, Jan 22 @ 2:00 PM      │
│ [Reschedule]                            │
└─────────────────────────────────────────┘

[View Class Notes] [View Class Report] [Manage Materials]
```

### 2. Session Detail Modal/Page

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Session 3 - Monday, January 22, 2024
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📅 Scheduled: 2:00 PM - 3:00 PM
📊 Status: Scheduled
👤 Student: John Doe
📚 Class: Math Tutoring

Actions:
[Start Session] [Reschedule] [Cancel]

Session Materials:
[Upload File] [View All Materials]
- worksheet-session3.pdf

Session Notes: (After completion)
Topics Covered: _______________
Performance: ⭐⭐⭐⭐⭐
Strengths: _______________
Areas for Improvement: _______________
Homework: _______________
Private Notes: _______________
[Save Notes]
```

### 3. Class Notes (New Feature)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Class Notes - Math Tutoring for John
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Overall Class Information:
(Notes that apply to all sessions)

Student Background: _______________
Learning Style: _______________
Goals: _______________
Parent Contact: _______________
Special Considerations: _______________

[Save Class Notes]
```

### 4. Class Report (New Feature)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Class Report - Math Tutoring for John
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Report Period: [January 2024 ▼]

Sessions Completed: 8 / 8
Total Hours: 8 hours

Session Summary:
┌────────────────────────────────────┐
│ Session 1 (Jan 15): Fractions     │
│ Performance: ⭐⭐⭐⭐             │
├────────────────────────────────────┤
│ Session 2 (Jan 17): Decimals      │
│ Performance: ⭐⭐⭐⭐⭐           │
└────────────────────────────────────┘

Overall Summary:
_______________

Strengths:
_______________

Areas for Improvement:
_______________

Recommendations for Next Period:
_______________

[Generate from Session Notes] [Save Report] [Download PDF] [Share with Parent]
```

---

## 🔄 Workflow Changes

### Creating a Class (No Change)
1. Tutor creates class
2. Sets weekly schedule (Mon/Wed @ 2:00 PM)
3. Gets booking link

### Booking a Class (CHANGED)
**Old:** Student books → creates booking + classroom  
**New:** Student books → creates booking + generates sessions[]

```javascript
// When student books
const booking = {
  class_id,
  student_id,
  start_date: '2024-01-15',
  frequency: 'weekly', // or 'twice_weekly', etc.
  total_sessions: 12, // or null for ongoing
}

// Automatically generate sessions
const sessions = generateSessions(booking, class.schedule)
// Creates: Session 1 (Jan 15), Session 2 (Jan 17), Session 3 (Jan 22), etc.
```

### Starting a Session (CHANGED)
**Old:** Click "Start Session" on booking → opens classroom  
**New:** Click "Start Session" on specific session → creates classroom → opens it

```javascript
// When tutor starts session
1. Check if classroom exists for this session
2. If not, create classroom (Daily.co room)
3. Link classroom to session
4. Open classroom
```

### Adding Notes (CHANGED)
**Old:** Notes tied to booking  
**New:** Notes tied to specific session

### Rescheduling (CHANGED)
**Old:** Reschedule entire booking  
**New:** Reschedule individual session

---

## 📁 File Structure Changes

### New Pages/Components:

```
app/(dashboard)/
├── tutor/
│   ├── bookings/
│   │   ├── page.tsx (List bookings with sessions)
│   │   └── [id]/
│   │       ├── page.tsx (Booking detail with all sessions)
│   │       ├── sessions/
│   │       │   └── [sessionId]/
│   │       │       ├── page.tsx (Individual session detail)
│   │       │       └── notes.tsx (Session notes form)
│   │       ├── class-notes/
│   │       │   └── page.tsx (Overall class notes)
│   │       └── reports/
│   │           ├── page.tsx (List reports)
│   │           └── [reportId]/
│   │               └── page.tsx (View/edit report)
│   └── classes/
│       └── [id]/
│           ├── page.tsx (Class detail)
│           └── notes/
│               └── page.tsx (Class notes)
│
└── student/
    └── bookings/
        ├── page.tsx (List bookings with sessions)
        └── [id]/
            ├── page.tsx (View booking with sessions)
            └── sessions/
                └── [sessionId]/
                    └── page.tsx (View session detail)

components/
├── SessionsList.tsx (NEW)
├── SessionCard.tsx (NEW)
├── ClassNotesForm.tsx (NEW)
├── ClassReportForm.tsx (NEW)
└── SessionNotesForm.tsx (UPDATE)
```

---

## 🚀 Implementation Plan

### Phase 1: Database Restructuring (Day 1-2)
1. Create migration for `sessions` table
2. Create migration for `class_notes` table
3. Create migration for `class_reports` table
4. Update `session_materials` to support session-level and class-level
5. Update `session_notes` to link to sessions

### Phase 2: Session Generation Logic (Day 2-3)
1. Build session generator function
2. Update booking creation to generate sessions
3. Add logic to handle ongoing vs. fixed-length bookings

### Phase 3: UI Updates - Bookings Tab (Day 3-4)
1. Update booking list to show sessions
2. Create expandable session list component
3. Add "Start Session" per session
4. Add "Reschedule" per session

### Phase 4: Session Detail Pages (Day 4-5)
1. Create session detail page
2. Add session-specific notes
3. Add session-specific materials
4. Link to classroom creation

### Phase 5: Class Notes & Reports (Day 5-7)
1. Create class notes page
2. Create class report generator
3. Add report viewing for students/parents
4. Add PDF export

---

## 🎯 Key Improvements

### Before:
- ❌ Booking = One session (confusing)
- ❌ Can't see all upcoming sessions
- ❌ Can't reschedule individual sessions
- ❌ Notes tied to booking, not session
- ❌ No overall class notes or reports

### After:
- ✅ Booking = Multiple sessions (clear)
- ✅ See all upcoming sessions in one view
- ✅ Reschedule individual sessions
- ✅ Notes per session + class-level notes
- ✅ Generate reports from all sessions

---

## 💡 Example User Journey

### Tutor Creates Class:
1. "Math Tutoring for John"
2. Weekly: Monday, Wednesday @ 2:00 PM
3. Duration: 1 hour
4. Shares link with John's parent

### Student Books:
1. Parent clicks link
2. Selects start date: Jan 15, 2024
3. Selects duration: 3 months (24 sessions)
4. Books class

### System Generates Sessions:
```
Session 1: Mon, Jan 15 @ 2:00 PM
Session 2: Wed, Jan 17 @ 2:00 PM
Session 3: Mon, Jan 22 @ 2:00 PM
...
Session 24: Wed, Apr 10 @ 2:00 PM
```

### Tutor Uses Platform:
1. Goes to Bookings tab
2. Sees "Math Tutoring for John"
3. Expands to see all 24 sessions
4. Clicks "Start Session" on Session 1
5. After session, adds session notes
6. Uploads worksheet for Session 2
7. At end of month, generates report

### Student/Parent:
1. Goes to Bookings
2. Sees all upcoming sessions
3. Requests to reschedule Session 5
4. Views session notes after each session
5. Views monthly report

---

**This structure is much clearer and aligns with real tutoring workflows!**

Should I proceed with implementing this new structure?

