# 🌍 Global Tutor Availability System - Migration Guide

## What Changed?

### **Before (Class-Based Availability)**
- Each class had its own pool of available slots
- Booking in "Math Class" didn't affect "Physics Class"
- Same time slot could be booked by different students in different classes
- `available_slots` stored in each class record

### **After (Global Tutor Availability)** ✅
- **One master availability calendar per tutor**
- Booking in ANY class blocks that slot across ALL classes
- Each tutor's time slot can only be booked once (globally)
- Classes reference tutor's `availability` directly
- `tutor_id` added to bookings for global tracking

---

## 🚀 Deployment Steps

### **Step 1: Run Database Migration** ⚠️ REQUIRED

1. Open Supabase SQL Editor
2. Go to: `https://supabase.com/dashboard/project/YOUR_PROJECT/editor`
3. Copy and paste the contents of: `supabase/migrations/007_global_tutor_availability.sql`
4. Execute the SQL

**What this does:**
- Adds `tutor_id` column to `bookings` table
- Updates existing bookings with `tutor_id` from their classes
- Creates indexes for faster queries
- Updates RLS policies

### **Step 2: Restart Development Server**

```bash
# Stop the current dev server (Ctrl+C)
# Then restart:
npm run dev
```

### **Step 3: Test the System**

Follow the testing guide below.

---

## 🧪 Testing Guide

### **Test 1: Single Class Booking**

1. **Set tutor availability**
   - Go to `/tutor/availability`
   - Set: Monday 9:00-12:00, Wednesday 14:00-17:00
   - Save

2. **Create a class**
   - Go to `/tutor/classes/create`
   - Create "Math Tutoring" (60 min duration)
   - Copy the booking link

3. **Make a booking**
   - Open booking link
   - Select Monday 10:00
   - Book as "Student A"
   - Should succeed ✅

4. **Verify slot is blocked**
   - Refresh the same booking link
   - Monday 10:00 should appear in **RED** ❌
   - Console should show:
     ```
     🌍 GLOBAL SYSTEM: These slots are unavailable across ALL classes for this tutor
     Total booked slots count: 1
     ```

---

### **Test 2: Cross-Class Availability (KEY TEST)** 🎯

This tests that bookings in one class affect all other classes.

1. **Create TWO classes** with the SAME tutor:
   - "Math Tutoring" (60 min)
   - "Physics Tutoring" (60 min)
   - Copy both booking links

2. **Book in Math class**:
   - Open Math booking link
   - Select Monday 10:00
   - Book as "Student A"

3. **Check Physics class**:
   - Open Physics booking link
   - **Expected:** Monday 10:00 is **RED** ❌ (unavailable)
   - **Reason:** Same tutor, slot already booked in Math class

4. **Book different slot in Physics**:
   - Select Monday 11:00 (different slot)
   - Book as "Student B"
   - Should succeed ✅

5. **Verify both classes blocked**:
   - Refresh Math booking link → Monday 10:00 **RED**, Monday 11:00 **RED**
   - Refresh Physics booking link → Monday 10:00 **RED**, Monday 11:00 **RED**
   - **Both classes show BOTH bookings** 🎉

---

### **Test 3: Real-time Conflict Detection**

1. **Open same booking link in 2 tabs**
   - Tab A: Math class booking
   - Tab B: Math class booking (same link)

2. **Tab A: Book Monday 10:00**
   - Should succeed ✅

3. **Tab B: Try to book Monday 10:00** (without refreshing)
   - Select Monday 10:00
   - Click submit
   - **Expected:** Error message: "The following time slots are already booked: Monday at 10:00"
   - API prevents duplicate booking 🛡️

4. **Tab B: Refresh and verify**
   - Refresh page
   - Monday 10:00 now appears **RED** ❌

---

## 🔍 Console Debugging

### **Expected Console Output (Booking Page Load)**

```javascript
=== Class Data Loaded ===
Class ID: abc-123
Class Title: Math Tutoring
Tutor ID: tutor-xyz
Tutor availability: {slots: [{day: 'Monday', startTime: '09:00', endTime: '12:00'}]}

Generated slots from TUTOR availability: 3 slots

Loading booked slots for TUTOR (global): tutor-xyz

=== Loading Booked Slots (GLOBAL TUTOR AVAILABILITY) ===
Tutor ID: tutor-xyz
ALL bookings for this TUTOR (any status): [{...}]
🌍 GLOBAL SYSTEM: These slots are unavailable across ALL classes for this tutor
Total booked slots count: 2
```

### **Expected Console Output (Booking Submission)**

```javascript
Creating booking with data: {tutor_id: 'tutor-xyz', class_id: 'abc-123', ...}
🌍 GLOBAL AVAILABILITY: This booking will block slots across ALL tutor classes

Checking for scheduling conflicts (global tutor availability)...

API Console:
🌍 GLOBAL CONFLICT CHECK - Checking tutor availability across ALL classes
Tutor ID: tutor-xyz
Querying by tutor_id (global availability)
Found bookings: 2
Conflicts found: []
```

---

## ✅ Success Criteria

The system is working correctly if:

1. ✅ **Tutor availability shows for all classes**
   - All classes by same tutor show same initial slots

2. ✅ **Booking in Class A blocks slot in Class B**
   - Book Monday 10:00 in Math
   - Physics shows Monday 10:00 as unavailable (RED)

3. ✅ **Console logs show "GLOBAL" messages**
   - "🌍 GLOBAL SYSTEM: These slots are unavailable across ALL classes"
   - "Querying by tutor_id (global availability)"

4. ✅ **Conflict detection works across classes**
   - Can't book same slot in different classes
   - Error message shows specific conflicts

5. ✅ **Database has tutor_id in bookings**
   - Open Supabase Table Editor
   - Check `bookings` table
   - `tutor_id` column exists and is populated

---

## 🐛 Troubleshooting

### **Issue: Slots not showing as unavailable in other classes**

**Check:**
1. Did you run the migration? (`tutor_id` column exists?)
2. Are both classes using the SAME tutor?
3. Console shows "Querying by tutor_id"? (not class_id)
4. Refresh the booking page after creating booking

**Fix:**
- Run migration: `007_global_tutor_availability.sql`
- Restart dev server

---

### **Issue: "Tutor has not configured their availability"**

**Check:**
1. Go to `/tutor/availability`
2. Tutor has set time ranges?
3. Time ranges saved? (check `tutors.availability.slots`)

**Fix:**
- Set tutor availability first
- Then create classes

---

### **Issue: Existing classes still have available_slots**

**This is OK!** Old classes will have `available_slots` but they're ignored.

**How it works now:**
- Old classes: `available_slots` exists but not used
- New classes: No `available_slots` field
- All classes read from tutor's global availability

**No action needed** - backward compatible

---

### **Issue: Total booked slots count: 0**

**Check:**
1. Did the booking actually save? (check `bookings` table)
2. Is `tutor_id` populated in the booking record?
3. Console shows correct Tutor ID?

**Fix:**
- Re-run migration to populate `tutor_id` in existing bookings
- Create new bookings (they will have `tutor_id` automatically)

---

## 📊 Database Schema Changes

### **New Column: `bookings.tutor_id`**

```sql
ALTER TABLE bookings
ADD COLUMN tutor_id UUID REFERENCES tutors(id) ON DELETE CASCADE;
```

**Purpose:** Direct reference to tutor for global availability tracking

**Populated:** Automatically via migration for existing bookings, automatically for new bookings

---

### **Deprecated (but kept for compatibility): `classes.available_slots`**

**Old behavior:** Stored class-specific slots
**New behavior:** Ignored, all classes use tutor's global availability
**Kept for:** Backward compatibility with existing classes

---

## 🎯 Architecture Diagram

```
BEFORE (Class-Based):
┌─────────────┐     ┌─────────────┐
│  Math Class │     │Physics Class│
│ Slots: [...]│     │ Slots: [...]│
└──────┬──────┘     └──────┬──────┘
       │                   │
   Independent         Independent
   (No sharing)        (No sharing)

AFTER (Global Tutor):
        ┌────────────────┐
        │ Tutor Profile  │
        │ Availability:  │
        │ Mon 9-12       │
        │ Wed 14-17      │
        └────────┬───────┘
                 │
        ┌────────┴────────┐
        │   SHARED POOL   │
        └────────┬────────┘
                 │
     ┌───────────┴───────────┐
     │                       │
┌────▼──────┐         ┌──────▼────┐
│Math Class │         │Physics Cls│
│ (refs)    │         │ (refs)    │
└───────────┘         └───────────┘

One booking blocks slot for ALL classes
```

---

## 🚦 Deployment Checklist

- [ ] Run migration `007_global_tutor_availability.sql`
- [ ] Restart development server
- [ ] Test single class booking
- [ ] Test cross-class availability (key test!)
- [ ] Verify console logs show "GLOBAL" messages
- [ ] Check database: `tutor_id` populated in bookings
- [ ] Test with 2 different tutors (should be independent)
- [ ] Test conflict detection across classes
- [ ] Verify RED slots appear in all classes

---

## 📝 Notes

- **Backward Compatible:** Old classes with `available_slots` will still work
- **Database Migration Required:** Must run before using the system
- **Tutor Availability Required:** Tutors must set availability before creating classes
- **Real-time Updates:** Students see latest availability when they load/refresh the page
- **Multiple Tutors:** Each tutor has independent availability (tutors don't share slots)

---

## 🎉 Benefits of Global System

1. ✅ **No Double-Booking**: Same slot can't be booked twice
2. ✅ **Real-time Sync**: All classes show same availability
3. ✅ **Simpler for Tutors**: Manage availability once, applies to all classes
4. ✅ **Accurate Scheduling**: Students always see tutor's actual availability
5. ✅ **Better UX**: No confusion about which slots are truly available

---

**Ready to test? Follow the Testing Guide above!** 🚀

