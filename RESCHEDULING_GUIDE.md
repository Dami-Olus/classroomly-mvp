# Rescheduling System - Complete Guide

## 🔄 Feature Overview

The Rescheduling System allows tutors and students to propose time changes for booked sessions with a full approval workflow.

---

## ✨ Key Features

1. **Either Party Can Request** - Tutor or student can propose reschedule
2. **Approval Workflow** - Other party must accept/decline
3. **Automatic Updates** - Booking slots update when accepted
4. **Reason Tracking** - Both parties provide context
5. **Status Management** - Pending, accepted, declined, cancelled
6. **Limit Protection** - Max 3 reschedule requests per booking

---

## 🚀 Setup Steps

### Step 1: Run Database Migration

1. Open Supabase SQL Editor
2. Copy and paste: `supabase/migrations/009_rescheduling_system.sql`
3. Execute the migration

**What this creates:**
- `reschedule_requests` table
- `reschedule_count` column in bookings
- RLS policies for access control
- Trigger for auto-updating booking on acceptance
- Limit check (max 3 requests per booking)

---

### Step 2: Restart Development Server

```bash
# Stop current server (Ctrl+C)
npm run dev
```

---

### Step 3: Test the Workflow

Follow the testing guide below.

---

## 📋 User Workflows

### **Workflow 1: Student Requests Reschedule**

1. **Student goes to booking detail:**
   - `/student/bookings/[id]`
   - Sees scheduled time (e.g., Monday 10:00)

2. **Student clicks "Request Reschedule":**
   - Modal opens
   - Shows current time
   - Shows available alternative slots
   - Student selects new time (e.g., Wednesday 14:00)
   - Student adds reason: "I have a conflict at this time"
   - Clicks "Send Request"

3. **Tutor receives notification:**
   - Tutor sees badge: "Reschedule (1)"
   - Goes to same booking detail page
   - Clicks "Reschedule" tab
   - Sees pending request with:
     - Original time: Monday 10:00
     - Proposed time: Wednesday 14:00
     - Reason from student
   - Can add response note (optional)
   - Clicks "Accept" or "Decline"

4. **If Accepted:**
   - Booking's `scheduled_slots` updates to Wednesday 14:00
   - Booking status changes to 'rescheduled'
   - Both parties see updated time
   - Email notifications sent (future enhancement)

5. **If Declined:**
   - Original time remains
   - Student sees declined status with tutor's response note
   - Student can request again (different time)

---

### **Workflow 2: Tutor Requests Reschedule**

Same process but initiated by tutor. Student approves/declines.

---

## 🎯 How to Use

### **For Tutors:**

1. Go to **Bookings** → Click booking → **Details** tab
2. In Schedule section, click **"Request Reschedule"**
3. Select new time from available slots
4. Add reason for rescheduling
5. Click "Send Request"
6. Wait for student to accept/decline
7. Check **"Reschedule"** tab to see status

### **For Students:**

1. Go to **My Bookings** → Click booking → **Details** tab
2. In Schedule section, click **"Request Reschedule"**
3. Select new time from available slots
4. Add reason for rescheduling
5. Click "Send Request"
6. Wait for tutor to accept/decline
7. Check **"Reschedule"** tab to see status

---

## 🧪 Testing Guide

### **Test 1: Basic Request Flow**

1. **As Student:**
   - Open booking detail
   - Click "Request Reschedule"
   - Select new time: Wednesday 14:00
   - Reason: "I have an exam on Monday"
   - Send request
   - Should see success toast ✅

2. **As Tutor:**
   - Open same booking detail
   - Click "Reschedule" tab
   - Should see pending request
   - Verify it shows:
     - ✅ Original time
     - ✅ Proposed time
     - ✅ Student's reason
     - ✅ Accept/Decline buttons

3. **Accept Request:**
   - Tutor adds response note (optional): "No problem!"
   - Clicks "Accept"
   - Should see success toast ✅
   - Go to "Details" tab
   - Schedule should now show Wednesday 14:00 (updated!) ✅

---

### **Test 2: Decline Request**

1. **Student requests** reschedule
2. **Tutor declines** with note: "I'm not available then"
3. **Expected:**
   - Original time remains unchanged
   - Student sees "Declined" status
   - Student can see tutor's response note
   - Student can request again (different time)

---

### **Test 3: Multiple Requests**

1. **Create 3 reschedule requests**
2. **Try to create 4th request**
3. **Expected:**
   - Error: "Maximum reschedule limit reached"
   - Prevents spam/abuse ✅

---

### **Test 4: Completed/Cancelled Bookings**

1. **Set booking status to 'completed'**
2. **Open booking detail**
3. **Expected:**
   - "Request Reschedule" button hidden
   - Cannot reschedule completed sessions ✅

---

## 📊 Console Debugging

When loading booking detail page:
```javascript
Generated slots from TUTOR availability: 12 slots
Loaded reschedule requests for booking
```

When creating reschedule request:
```javascript
Creating reschedule request...
{
  booking_id: 'abc-123',
  requested_by: 'user-id',
  original_slot: {day: 'Monday', time: '10:00'},
  proposed_slot: {day: 'Wednesday', time: '14:00'},
  reason: 'I have a conflict',
  status: 'pending'
}
```

When accepting/declining:
```javascript
Responding to reschedule request: accepted
Updating booking slots...
Booking updated successfully
```

---

## 🎨 UI Components

### **Reschedule Modal**
- Current time display
- Available slots picker (grouped by day)
- Selected slot preview
- Reason text area (required)
- Send/Cancel buttons

### **Reschedule Requests List**
- Card for each request
- Status badge (pending/accepted/declined)
- Original vs proposed time comparison
- Reason display
- Response note display
- Accept/Decline buttons (if pending)
- Timestamp

### **Badge Notifications**
- Tab shows count of pending requests: "Reschedule (2)"
- Updates in real-time when requests are created

---

## 🔒 Security & Business Rules

### **Access Control (RLS)**
- ✅ Only booking participants can view requests
- ✅ Only booking participants can create requests
- ✅ Only other party can accept/decline

### **Business Rules**
- ✅ Max 3 reschedule requests per booking
- ✅ Cannot reschedule completed/cancelled bookings
- ✅ New time must be from tutor's available slots
- ✅ Reason is required
- ✅ Only one pending request at a time (optional enhancement)

### **Data Integrity**
- ✅ Booking slots update automatically on acceptance
- ✅ Booking status changes to 'rescheduled'
- ✅ Reschedule count tracked
- ✅ Timestamps recorded

---

## 📱 Mobile Responsiveness

- ✅ Modal scrollable on small screens
- ✅ Time slot buttons wrap properly
- ✅ Tabs scroll horizontally if needed
- ✅ Touch-friendly button sizes

---

## 🚨 Error Handling

### **Common Errors:**

**"Maximum reschedule limit reached"**
- Occurs after 3 requests
- Prevents abuse
- Contact tutor/student directly if needed

**"Failed to check for scheduling conflicts"**
- New time might already be booked
- Try different time slot
- Refresh page and try again

**"You must be logged in"**
- Session expired
- Re-login and try again

**"Booking not found"**
- Invalid booking ID
- Permission issue
- Check you're the right user

---

## 🎯 Success Criteria

Rescheduling system is working when:

- ✅ Either party can request reschedule
- ✅ Modal shows available slots
- ✅ Other party can accept/decline
- ✅ Booking updates automatically on acceptance
- ✅ Status tracking works correctly
- ✅ Limit prevents >3 requests
- ✅ Cannot reschedule completed bookings
- ✅ RLS prevents unauthorized access

---

## 🔮 Future Enhancements (Post-MVP)

1. **Email Notifications**
   - Send email when request created
   - Send email when request responded to
   - Include calendar invite for new time

2. **Real-time Notifications**
   - Push notification for pending requests
   - Badge on dashboard
   - Unread count

3. **Time Validation**
   - Prevent rescheduling <24 hours before session
   - Validate proposed time is in future
   - Check tutor's global availability

4. **Bulk Reschedule**
   - Reschedule all sessions at once
   - Recurring reschedule (every Monday → every Wednesday)

5. **Reschedule History**
   - View all past requests
   - Analytics on reschedule patterns

---

## 📦 Database Schema

```sql
CREATE TABLE reschedule_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES profiles(id),
  original_slot JSONB NOT NULL,
  proposed_slot JSONB NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  responded_by UUID REFERENCES profiles(id),
  response_note TEXT,
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## ✅ Testing Checklist

- [ ] Database migration executed
- [ ] Can access booking detail page
- [ ] "Request Reschedule" button visible
- [ ] Modal opens with available slots
- [ ] Can select new time slot
- [ ] Reason field validation works
- [ ] Request creates successfully
- [ ] "Reschedule" tab shows pending count
- [ ] Other party can see request
- [ ] Accept updates booking
- [ ] Decline keeps original time
- [ ] Status badges display correctly
- [ ] Response notes work
- [ ] Max 3 requests limit enforced
- [ ] Cannot reschedule completed bookings

---

**Ready to test!** Follow the testing guide above. 🎉

