# Testing Schedule Conflict Detection

## What Was Implemented

### 1. **Backend Conflict Checking API**
- **Endpoint**: `/api/check-conflicts`
- **Purpose**: Checks if selected time slots are already booked
- **Logic**: Queries all confirmed/rescheduled bookings for a class and compares selected slots

### 2. **Frontend Conflict Prevention**
- **Pre-booking Check**: Before creating a booking, the system calls the conflict API
- **Visual Indicators**: Booked slots are shown in red with strikethrough
- **Click Prevention**: Booked slots are disabled and cannot be selected
- **Error Messages**: Users get clear feedback if they try to book conflicting slots

### 3. **Real-time Slot Status**
- **On Page Load**: Fetches all existing bookings for the class
- **UI Update**: Displays booked slots as disabled/unavailable
- **Tooltip**: Hover over booked slots shows "This slot is already booked"

---

## How to Test Schedule Conflict Detection

### Test Scenario 1: Visual Detection (Recommended)

1. **Navigate to a class booking page**:
   - Go to your tutor dashboard
   - Create a test class (or use an existing one)
   - Copy the booking link

2. **Make the first booking**:
   - Open the booking link in your browser
   - Select 2-3 time slots (e.g., Monday 10:00, Wednesday 14:00)
   - Fill in student details
   - Confirm booking

3. **Try to book the same slots again**:
   - Open the same booking link in a new tab/incognito window
   - **Expected Result**: The slots you just booked should appear:
     - ❌ In RED color
     - ❌ With strikethrough text
     - ❌ Disabled (cannot click)
     - ℹ️ Tooltip showing "This slot is already booked"

4. **Attempt to select a booked slot**:
   - Try clicking on a red (booked) slot
   - **Expected Result**: 
     - Toast notification: "This time slot is already booked"
     - Slot does not get selected

5. **Select different slots**:
   - Choose slots that are NOT booked (shown in gray/normal)
   - **Expected Result**: 
     - These slots should be selectable normally
     - Booking should complete successfully

---

### Test Scenario 2: API-Level Detection (Advanced)

1. **Bypass UI and test API directly**:
   - Open browser DevTools Console
   - Run this fetch request (replace `CLASS_ID` with your actual class ID):

```javascript
fetch('/api/check-conflicts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    classId: 'YOUR_CLASS_ID_HERE',
    selectedSlots: [
      { day: 'Monday', time: '10:00' },
      { day: 'Wednesday', time: '14:00' }
    ]
  })
})
.then(res => res.json())
.then(data => console.log('Conflict Check Result:', data))
```

2. **Expected Responses**:
   - If slots are available:
     ```json
     {
       "hasConflicts": false,
       "conflicts": []
     }
     ```
   - If slots are booked:
     ```json
     {
       "hasConflicts": true,
       "conflicts": ["Monday at 10:00", "Wednesday at 14:00"]
     }
     ```

---

### Test Scenario 3: Concurrent Bookings (Race Condition Test)

1. **Open the same booking link in 2 browser tabs**
2. **In both tabs**:
   - Fill in student details
   - Select the SAME time slots
3. **Submit both forms quickly** (within seconds of each other)
4. **Expected Result**:
   - First submission: ✅ Success
   - Second submission: ❌ Error message: "The following time slots are already booked: [slot list]"

---

## Quick Visual Test Checklist

- [ ] Booked slots appear in **RED**
- [ ] Booked slots have **strikethrough** text
- [ ] Booked slots are **disabled** (cursor: not-allowed)
- [ ] Clicking booked slot shows toast: **"This time slot is already booked"**
- [ ] Unbooked slots are **selectable** normally
- [ ] Submitting conflicting slots shows error with **specific times**
- [ ] Console logs show: **"Loaded booked slots: [...]"**
- [ ] Console logs show: **"Conflict check result: {...}"** when submitting

---

## Console Debugging

When you load a booking page, you should see in the console:

```
Loaded booked slots: [
  { day: 'Monday', time: '10:00' },
  { day: 'Wednesday', time: '14:00' }
]
```

When you submit a booking, you should see:

```
Checking for scheduling conflicts...
Conflict check result: { hasConflicts: false, conflicts: [] }
```

Or if there are conflicts:

```
Conflict check result: {
  hasConflicts: true,
  conflicts: ['Monday at 10:00', 'Wednesday at 14:00']
}
```

---

## Troubleshooting

### Issue: Booked slots not showing as red
- **Check**: Browser console for "Loaded booked slots" message
- **Solution**: Refresh the page, check if bookings exist in database

### Issue: Can still select booked slots
- **Check**: `bookedSlots` state in React DevTools
- **Solution**: Verify `loadBookedSlots` function is being called

### Issue: Conflict API returns empty
- **Check**: Class ID is correct
- **Solution**: Verify bookings have status 'confirmed' or 'rescheduled'

### Issue: Error submitting booking
- **Check**: Browser console and network tab
- **Solution**: Check API route `/api/check-conflicts` response

---

## Success Criteria

✅ **Conflict detection is working correctly if**:
1. Booked slots are visually distinct (red, disabled)
2. Cannot select booked slots in UI
3. API prevents booking conflicting slots
4. Clear error messages for conflicts
5. No duplicate bookings in database

---

## Next Steps After Testing

Once conflict detection is confirmed working:
- ✅ Move on to Sprint 5 (Rescheduling & Material Sharing)
- ✅ Consider adding real-time updates (when someone books while you're on the page)
- ✅ Add email notifications for booking conflicts
- ✅ Implement tutor-side conflict warnings

---

**Note**: The conflict detection is now fully integrated into both the UI and API levels. It prevents double-bookings at multiple stages:
1. Visual UI prevention (cannot click booked slots)
2. Client-side validation (toast error if somehow clicked)
3. Server-side validation (API check before inserting booking)

This multi-layered approach ensures reliable conflict prevention! 🎯

