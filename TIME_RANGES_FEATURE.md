# ⏰ Time Ranges Feature

## Overview

Availability is now set as **time ranges** instead of individual time slots.

## ✅ What Changed

### Before:
```
Monday: 8:00, 8:30, 9:00, 9:30, 10:00, 10:30, 11:00... (tedious!)
```

### Now:
```
Monday: 8:00 - 17:00 (simple!)
```

## 🎯 How It Works

### 1. Tutor Sets Time Ranges
Tutors go to **Availability** and add time ranges:
- **Day**: Monday
- **Start Time**: 08:00
- **End Time**: 17:00
- Click "Add Range"

**Quick Add Buttons:**
- Morning (9:00 - 12:00)
- Afternoon (13:00 - 17:00)
- Evening (18:00 - 21:00)
- Full Day (9:00 - 17:00)

### 2. System Generates Specific Slots
When creating a class, the system automatically generates bookable slots:

**Example:**
```
Availability: Monday 08:00 - 17:00
Class Duration: 60 minutes

Generated Slots:
- Monday 08:00
- Monday 09:00
- Monday 10:00
- Monday 11:00
- Monday 12:00
- Monday 13:00
- Monday 14:00
- Monday 15:00
- Monday 16:00
```

**Why?** Can't book at 17:00 because the class would end at 18:00 (outside the range)

### 3. Students See Specific Times
On the booking page, students see clickable time slots generated from your ranges based on the class duration.

## 📊 Data Structure

### Stored in Database (tutors.availability):
```json
{
  "slots": [
    {
      "day": "Monday",
      "startTime": "08:00",
      "endTime": "17:00"
    },
    {
      "day": "Wednesday",
      "startTime": "14:00",
      "endTime": "20:00"
    },
    {
      "day": "Friday",
      "startTime": "09:00",
      "endTime": "12:00"
    }
  ]
}
```

### Generated for Classes (classes.available_slots):
```json
[
  { "day": "Monday", "time": "08:00" },
  { "day": "Monday", "time": "09:00" },
  { "day": "Monday", "time": "10:00" },
  // ... all slots within the range at duration intervals
]
```

## 🔧 Smart Slot Generation

The system automatically:
- Calculates available booking times based on class duration
- Prevents bookings that would extend beyond your availability
- Adjusts slots when you change class duration

**Examples:**

### 30-minute class:
```
Range: 09:00 - 12:00
Slots: 09:00, 09:30, 10:00, 10:30, 11:00, 11:30
```

### 60-minute class:
```
Range: 09:00 - 12:00
Slots: 09:00, 10:00, 11:00
```

### 120-minute class:
```
Range: 09:00 - 12:00
Slots: 09:00, 10:00
```

## 🎨 UI Features

### Availability Selector:
- ✅ Day dropdown
- ✅ Start time dropdown (00:00 - 23:00)
- ✅ End time dropdown
- ✅ Quick add buttons (Morning, Afternoon, Evening, Full Day)
- ✅ Visual range display with duration
- ✅ Delete ranges easily
- ✅ Overlap prevention

### Display:
- Ranges grouped by day
- Shows duration (e.g., "8h", "4h 30min")
- Color-coded cards
- Easy to scan

## 💡 Benefits

### For Tutors:
- ✅ **Faster setup** - Add ranges instead of individual times
- ✅ **More flexible** - Set broad availability, system handles details
- ✅ **Easy updates** - Change ranges, not dozens of slots
- ✅ **Professional** - "Available Mon-Fri 9-5" vs listing 40 time slots

### For Students:
- ✅ **Clearer availability** - See when tutor is generally free
- ✅ **More options** - Automatic slots at appropriate intervals
- ✅ **Better UX** - Choose from organized time options

## 🧪 Testing Examples

### Example 1: Full-time Tutor
```
Set:
- Monday - Friday: 09:00 - 17:00

Creates 60-min class:
Students can book at:
- Mon-Fri: 09:00, 10:00, 11:00, 12:00, 13:00, 14:00, 15:00, 16:00
```

### Example 2: Part-time Tutor
```
Set:
- Tuesday: 18:00 - 21:00
- Thursday: 18:00 - 21:00
- Saturday: 10:00 - 16:00

Creates 90-min class:
Students can book at:
- Tuesday: 18:00, 19:30
- Thursday: 18:00, 19:30
- Saturday: 10:00, 11:30, 13:00, 14:30
```

### Example 3: Morning & Evening
```
Set:
- Monday: 07:00 - 09:00 (morning)
- Monday: 19:00 - 21:00 (evening)
- Wednesday: 07:00 - 09:00
- Wednesday: 19:00 - 21:00

Creates 60-min class:
Students can book at:
- Mon/Wed: 07:00, 08:00, 19:00, 20:00
```

## 🔄 Update Flow

### Change Availability:
1. Go to `/tutor/availability`
2. Add/remove/modify ranges
3. Click "Save"
4. Future classes use new availability
5. Can regenerate slots for existing classes (future feature)

## 📱 Mobile Responsive

- Stacked layout on mobile
- Touch-friendly controls
- Quick add buttons work great
- Easy to manage on phone

## 🎯 Code Implementation

### Helper Function:
```typescript
generateTimeSlotsFromRanges(ranges, durationMinutes)
  ↓
Takes: [{ day: "Monday", startTime: "08:00", endTime: "17:00" }]
Returns: [
  { day: "Monday", time: "08:00" },
  { day: "Monday", time: "09:00" },
  { day: "Monday", time: "10:00" },
  // ... all slots at duration intervals
]
```

### Usage in Create Class:
```typescript
// Load tutor's availability ranges
const ranges = tutor.availability.slots

// Generate specific slots based on class duration
const slots = generateTimeSlotsFromRanges(ranges, classDuration)

// Save to class
class.available_slots = slots
```

## ⚠️ Edge Cases Handled

1. **End time before start time**: Validation prevents this
2. **Overlapping ranges**: Prevented by overlap detection
3. **Duration longer than range**: No slots generated (shows warning)
4. **No availability**: Can't create class until set
5. **Empty ranges**: Validation requires at least one range

## 🚀 Try It Now!

### Step-by-Step Test:

1. **Go to Availability**
   ```
   /tutor/availability
   ```

2. **Add a range**
   ```
   Day: Monday
   Start: 08:00
   End: 17:00
   Click "Add Range"
   ```

3. **Use quick add**
   ```
   Click "Afternoon (13-17)" for Wednesday
   Click "Morning (9-12)" for Friday
   ```

4. **Save**
   ```
   Click "Save Availability"
   See success toast!
   ```

5. **Create a class**
   ```
   Go to "Create New Class"
   Set duration to 60 minutes
   See your ranges displayed
   Create class
   ```

6. **View booking page**
   ```
   Copy the booking link
   Open in incognito
   See specific time slots generated from your ranges!
   ```

---

## 🎉 Feature Summary

✅ **Set availability as time ranges** (8:00 - 17:00)  
✅ **Quick add buttons** for common schedules  
✅ **Automatic slot generation** based on class duration  
✅ **Visual display** with duration calculation  
✅ **Overlap prevention** for same day  
✅ **Mobile responsive** design  

**Result**: Faster setup, better UX, more professional! 🚀

---

*Sprint 2 Enhanced: Time Ranges Feature Complete*

