# 🗓️ General Availability Feature

## Overview

Availability is now a **general feature** that applies to all classes, not per-class.

## ✅ How It Works

### 1. Set Availability Once
- Tutors go to **"Availability"** page
- Set their weekly schedule (days and times)
- Save once

### 2. Applies to All Classes
- All classes automatically use the tutor's general availability
- Students see the same time slots across all classes
- No need to set availability for each class

### 3. Update Anytime
- Change your availability in one place
- Updates for all existing and new classes
- Consistent schedule across your tutoring business

## 🎯 User Flow

### Tutor Setup Flow:
```
1. Sign up as tutor ✅
2. Complete profile ✅
3. Set general availability ⭐ NEW!
4. Create classes (uses your availability)
5. Share booking links
```

### When Creating a Class:
- ❌ **Before**: Had to select time slots for each class
- ✅ **Now**: Uses your general availability automatically
- Shows preview of your availability
- Option to update if needed

## 📍 Where to Find It

### In Tutor Dashboard:
- **Sidebar**: "Availability" (2nd item)
- **URL**: `/tutor/availability`

### Getting Started Guide:
```
Step 1: Complete your profile
Step 2: Set your general availability ⭐ NEW!
Step 3: Create your first class
Step 4: Share booking link
```

## 🎨 What the Page Looks Like

### Availability Page (`/tutor/availability`):
- Visual time slot selector
- Add/remove slots by day
- Preview grouped by day of week
- Timezone info display
- Save button
- Helpful tips

### Create Class Page (Updated):
- Shows your current availability (read-only)
- Preview of time slots students will see
- Link to update availability if needed
- Prevents creation if no availability set

## 💡 Benefits

### For Tutors:
- ✅ Set schedule once, not for each class
- ✅ Consistent availability across all classes
- ✅ Easy to update all classes at once
- ✅ Less repetitive work

### For Students:
- ✅ Consistent experience across a tutor's classes
- ✅ Easy to find available times
- ✅ Book any class at any available time

## 🔧 Technical Details

### Data Structure:
```json
// Stored in tutors.availability (JSONB)
{
  "slots": [
    { "day": "Monday", "time": "14:00" },
    { "day": "Monday", "time": "15:00" },
    { "day": "Wednesday", "time": "14:00" },
    { "day": "Friday", "time": "10:00" }
  ]
}
```

### When Class is Created:
```typescript
// Classes.available_slots gets a COPY of tutor's availability
available_slots: tutorAvailability

// This allows:
// - Fast queries (no joins needed for booking page)
// - Future: Per-class overrides if needed
// - Snapshot of availability at time of creation
```

## 🚀 Testing the Feature

### Test 1: Set Availability
```
1. Login as tutor
2. Click "Availability" in sidebar
3. Add multiple time slots:
   - Monday: 14:00, 15:00, 16:00
   - Wednesday: 14:00, 15:00
   - Friday: 10:00, 11:00
4. Click "Save Availability"
5. See success message
```

### Test 2: Create Class with Availability
```
1. Click "Create New Class"
2. Fill in class details
3. See your availability displayed (read-only)
4. See green checkmark: "Using your general availability"
5. Create class
6. Booking link will show all your available slots!
```

### Test 3: Update Availability
```
1. Go back to "Availability"
2. Add more slots
3. Save
4. Create another class
5. New class uses updated availability
```

### Test 4: No Availability Set
```
1. Create a fresh tutor account
2. Try to create a class without setting availability
3. See warning: "No availability set"
4. Click "Set Your Availability"
5. Redirects to availability page
```

## 🎯 Current Sprint 2 Flow

### Recommended Setup Order:
1. ✅ Sign up as tutor
2. ✅ Complete profile (bio, expertise, etc.)
3. ⭐ **Set general availability** (NEW!)
4. ✅ Create classes (quick, no availability selection)
5. ✅ Share booking links

## 📊 Impact on Existing Features

### Updated Pages:
- ✅ `/tutor/availability` - New page for managing availability
- ✅ `/tutor/classes/create` - Now uses general availability
- ✅ `/tutor/dashboard` - Updated getting started guide
- ✅ Sidebar navigation - Added "Availability" link

### Unchanged:
- ✅ Booking page - Still shows all slots
- ✅ Bookings management - Still works the same
- ✅ Student experience - No changes

## ⚡ Quick Commands

```bash
# View availability in database
SELECT 
  u.first_name, 
  u.last_name, 
  t.availability 
FROM tutors t 
JOIN profiles u ON u.id = t.user_id;

# Check which classes use this availability
SELECT 
  c.title, 
  c.available_slots 
FROM classes c 
JOIN tutors t ON t.id = c.tutor_id 
WHERE t.user_id = 'your-user-id';
```

---

## 🎉 Feature Complete!

Availability is now a **general feature** that makes Classroomly more efficient and user-friendly!

**Key Improvement**: Set availability once → Use for all classes → Update in one place!

---

*Sprint 2 Enhanced: General Availability System* 🚀

