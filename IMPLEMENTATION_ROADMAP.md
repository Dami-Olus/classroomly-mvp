# Implementation Roadmap - Demo Feedback

## 🎯 Critical Features from Demo

Based on user feedback, here's what we need to build:

---

## PHASE 1: Quick Wins (This Week) ⚡

### 1. ✅ Daily.co Waiting Room & Notifications
**Status:** Can implement now  
**Effort:** 2-3 hours  
**Impact:** HIGH

**Features:**
- Enable Daily.co waiting room (knocking feature)
- Show notification when student joins
- Pre-join UI so students see preview before entering
- Browser notifications for tutor

**Files to Update:**
- `lib/daily.ts` - Add waiting room config
- `app/api/daily/create-room/route.ts` - Update room settings
- `hooks/useDailyCall.ts` - Add participant-joined event
- `app/classroom/[roomUrl]/page.tsx` - Show join notifications

---

### 2. 📊 Monthly Reports Feature
**Status:** Need to build  
**Effort:** 1-2 days  
**Impact:** HIGH (Core workflow requirement)

**Features:**
- Create monthly report from session notes
- View all notes for a booking in date range
- Add overall summary field
- Students/parents can view reports
- Export as PDF (optional)

**Database:**
```sql
CREATE TABLE monthly_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id),
  tutor_id UUID REFERENCES tutors(id),
  student_id UUID,
  month INTEGER,
  year INTEGER,
  overall_summary TEXT,
  strengths TEXT,
  areas_for_improvement TEXT,
  next_steps TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**New Pages:**
- `/tutor/bookings/[id]/reports` - Create/view reports
- `/student/bookings/[id]/reports` - View reports

---

### 3. 📥 CSV Bulk Import (Class Creation)
**Status:** Need to build  
**Effort:** 2-3 days  
**Impact:** MEDIUM (Helps onboarding)

**Features:**
- Upload CSV with existing schedule
- Parse and create classes automatically
- Template download
- Error handling and validation

**CSV Template:**
```csv
class_title,subject,student_name,student_email,days,start_time,duration,price
Math Tutoring,Mathematics,John Doe,john@example.com,"Monday,Wednesday,Friday",14:00,60,50
English Class,English,Jane Smith,jane@example.com,"Tuesday,Thursday",10:00,60,40
```

**New Page:**
- `/tutor/classes/import` - Upload CSV

---

## PHASE 2: Important Features (Next 2 Weeks)

### 4. 🔔 Real-time Join Notifications
**Effort:** 1 day  
**Features:**
- Browser notification when student joins
- Dashboard badge showing "Student waiting"
- Email/SMS notification (optional)
- Sound alert (optional)

### 5. 📄 Report PDF Export
**Effort:** 1 day  
**Features:**
- Download monthly report as PDF
- Branded template
- Include all session notes + summary

### 6. 📅 Recurring Session Automation
**Effort:** 2 days  
**Features:**
- Auto-create next session after completion
- Handle weekly recurring bookings
- Skip holidays (manual override)

---

## PHASE 3: Growth Features (Next Month)

### 7. 🎁 Referral Program
**Effort:** 3-4 days  
**Features:**
- Unique referral codes
- Track referrals
- Discount/credit system
- Referral dashboard

### 8. 📊 Analytics Dashboard
**Effort:** 1 week  
**Features:**
- Session completion rates
- Student engagement metrics
- Revenue tracking
- Tutor performance

### 9. 🤖 AI Report Generation
**Effort:** 1 week  
**Features:**
- Auto-generate monthly report from session notes
- Summary of progress
- Personalized recommendations

---

## 🚀 What to Build First?

### IMMEDIATE (Today/Tomorrow):
1. ✅ **Waiting Room Config** - Update Daily.co settings
2. 🔔 **Join Notifications** - Add participant events

### THIS WEEK:
3. 📊 **Monthly Reports** - Build full feature
4. 📥 **CSV Import Template** - Create and document

### NEXT WEEK:
5. 📄 **PDF Export** - For reports
6. 🧪 **User Testing** - With real tutors

---

## 📝 Technical Implementation Notes

### Waiting Room (Daily.co)
```javascript
// Update room creation config
{
  privacy: 'public',
  properties: {
    enable_knocking: true,
    enable_prejoin_ui: true,
    owner_only_broadcast: false,
    enable_screenshare: true,
    enable_chat: true,
    enable_emoji_reactions: true,
  }
}
```

### Browser Notifications
```javascript
// Request permission
if (Notification.permission === 'default') {
  await Notification.requestPermission()
}

// Show notification
if (Notification.permission === 'granted') {
  new Notification('Student Joined', {
    body: 'A student is waiting in the classroom',
    icon: '/logo.png',
    tag: 'student-join',
  })
}
```

### Monthly Reports Query
```javascript
// Get all session notes for a booking in date range
const { data: notes } = await supabase
  .from('session_notes')
  .select('*')
  .eq('booking_id', bookingId)
  .gte('session_date', startDate)
  .lte('session_date', endDate)
  .order('session_date', { ascending: true })

// Aggregate data for report
```

---

## 🎯 Success Metrics

After implementing Phase 1:
- [ ] Tutors receive notifications when students join
- [ ] Tutors can create monthly reports
- [ ] Tutors can import existing schedules via CSV
- [ ] Students/parents can view monthly reports
- [ ] Waiting room prevents students from entering before tutor

---

## 💡 User Feedback Loop

1. **Implement Phase 1 features**
2. **Deploy to production**
3. **Send updated demo link**
4. **Schedule follow-up call**
5. **Collect usage data**
6. **Iterate based on feedback**

---

## 📊 Current Feature Status

✅ **Working Well:**
- Timezone handling
- Privacy (RLS)
- Persistent booking links
- Session notes
- Unique classrooms per student
- Video calling (Daily.co)

🚧 **Needs Improvement:**
- Waiting room configuration
- Join notifications
- Monthly reports
- Bulk import

❌ **Missing:**
- Report PDF export
- Referral system
- Advanced analytics

---

**Next Action:** Start with waiting room and notifications (quick wins)!

