# 📥 Import Sessions Feature Guide

## Overview

The **Import Sessions** feature allows tutors to bulk import their existing student schedules from Excel/CSV files, eliminating the need to manually create each booking one by one.

**Time Saved:** Instead of 5-10 minutes per student, import all students in under 2 minutes!

---

## 🎯 How to Use

### Step 1: Navigate to Classes

1. Login as a tutor
2. Go to **"My Classes"** page
3. Find the class you want to import students into

### Step 2: Click "Import Sessions"

Each class card has an **"Import Sessions"** button
- Located in the actions row
- Primary blue button with upload icon

### Step 3: Download Template

1. Modal opens: "Import Student Sessions"
2. Click **"Download CSV Template"**
3. Template downloads as `session_import_template.csv`
4. Contains example data showing the format

### Step 4: Fill Template

Open the template in Excel/Google Sheets and fill in:

**Required Columns:**
- **Student Name** - Full name (e.g., "John Doe")
- **Student Email** - Email address (e.g., "john@example.com")
- **Days** - Comma-separated days (e.g., "Monday,Wednesday")
- **Time** - 24-hour format (e.g., "14:00" for 2 PM)

**Example:**
```csv
Student Name,Student Email,Days (comma-separated),Time (HH:MM)
John Doe,john@example.com,"Monday,Wednesday",14:00
Jane Smith,jane@example.com,"Tuesday,Thursday",16:00
Bob Johnson,bob@example.com,Friday,10:00
```

### Step 5: Upload File

1. Click **"Upload File"** or drag and drop
2. System automatically:
   - Parses the CSV
   - Validates all data
   - Checks for scheduling conflicts
   - Generates import summary

### Step 6: Review Summary

**Import Summary Shows:**
- Total students to import
- Total sessions that will be created
- New vs. existing students
- Any scheduling conflicts (if any)
- Validation warnings

**Set Import Options:**
- **Sessions Per Student** - How many sessions to generate (4, 8, 12, etc.)
- **Start Date** - When sessions should begin

### Step 7: Confirm Import

1. Review the preview table
2. Check for conflicts or errors
3. Click **"Confirm Import"**
4. System creates:
   - Bookings for each student
   - All sessions based on schedule
   - Links everything to the class

### Step 8: Success!

- Success message: "✅ Import successful! Created X bookings and Y sessions"
- All bookings appear in "My Bookings"
- Students can now book/access their sessions

---

## 📋 CSV Template Format

### Column Definitions:

**1. Student Name (Required)**
- Format: Text
- Example: "John Doe"
- Min length: 2 characters
- Used for: Display name in system

**2. Student Email (Optional but Recommended)**
- Format: Valid email address
- Example: "john@example.com"
- Used for: Account matching, notifications
- If email exists: Links to existing student account
- If email missing: Student won't receive email notifications

**3. Days (Required)**
- Format: Comma-separated day names
- Valid days: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday
- Example: "Monday,Wednesday" or "Tuesday"
- Case-sensitive: Use proper capitalization
- Multiple days: Separate with commas (no spaces unless quoted)

**4. Time (Required)**
- Format: HH:MM (24-hour format)
- Example: "14:00" (2 PM), "09:30" (9:30 AM)
- Valid range: 00:00 to 23:59
- Must match your tutor availability

---

## ✅ Validation Rules

### What Gets Validated:

**Student Names:**
- ✅ Must not be empty
- ✅ Must be at least 2 characters
- ❌ Error if missing or too short

**Student Emails:**
- ✅ Must be valid email format (if provided)
- ⚠️ Warning if missing (student won't get notifications)
- ❌ Error if invalid format

**Days:**
- ✅ Must be valid day names
- ✅ At least one day required
- ❌ Error for typos (e.g., "Munday" instead of "Monday")
- ✅ Can have multiple days per student

**Times:**
- ✅ Must be HH:MM format
- ✅ Must be valid time (00:00 to 23:59)
- ❌ Error for invalid format (e.g., "2pm", "14:0")

**Scheduling Conflicts:**
- ✅ Checks against ALL existing bookings
- ✅ Checks across ALL your classes
- ❌ Error if time slot already booked
- Shows which student has the conflict

---

## 🔍 Conflict Detection

### How It Works:

The system checks for conflicts across **all your classes**:

1. Loads all your existing bookings
2. Extracts all scheduled time slots
3. Compares import data against existing slots
4. Reports any overlaps

### Example Conflict:

```
❌ John Doe (Monday 14:00) conflicts with existing booking for Jane Smith
```

**What to do:**
- Change John's time to an available slot
- Or reschedule Jane first
- Then re-import

### Why This Matters:

Prevents double-booking across all your classes!
- You can't teach two students at the same time
- Even if they're in different classes
- The system protects your schedule globally

---

## 🎓 Smart Student Matching

### Existing Students:

If email matches an existing student account:
- ✅ Links booking to their account
- ✅ They see it in their dashboard automatically
- ✅ They get email notifications
- ✅ No duplicate accounts created

### New Students:

If email is new or not provided:
- ✅ Creates booking record
- ✅ Student can claim it later with their email
- ⚠️ Won't receive notifications until they create account
- ✅ You can still manage the booking

---

## 📊 Session Generation

### How Sessions Are Created:

Based on your import data:
- **Days & Time** define weekly schedule
- **Sessions Per Student** setting determines total sessions
- **Start Date** determines first session date
- System generates all future sessions automatically

**Example:**
```
Student: John Doe
Days: Monday, Wednesday  
Time: 14:00
Sessions: 12
Start Date: Jan 15, 2024

Result: 12 sessions generated
- Session 1: Monday, Jan 15, 14:00
- Session 2: Wednesday, Jan 17, 14:00
- Session 3: Monday, Jan 22, 14:00
- ... (continues for 12 sessions)
```

---

## 💡 Pro Tips

### Template Preparation:

1. **Keep it simple** - Start with 2-3 students to test
2. **Check spelling** - Day names are case-sensitive
3. **Use 24-hour time** - 14:00 not 2:00 PM
4. **Quote multi-day fields** - "Monday,Wednesday" if Excel splits it

### Best Practices:

1. **Download template first** - Don't create from scratch
2. **Fill in all emails** - For better student experience
3. **Check conflicts** - Review your existing bookings first
4. **Start small** - Test with a few students first
5. **Keep backup** - Save your CSV for future reference

### Common Mistakes to Avoid:

❌ Using 12-hour time (2:00 PM) instead of 24-hour (14:00)
❌ Typos in day names (Munday, Wendesday)
❌ Missing commas between multiple days
❌ Importing during peak hours (conflicts likely)
❌ Not reviewing the summary before confirming

---

## 🧪 Testing the Feature

### Test Import Scenario:

1. Create a test class
2. Download template
3. Add 2-3 test students:
   ```csv
   Student Name,Student Email,Days,Time
   Test Student 1,test1@example.com,Monday,10:00
   Test Student 2,test2@example.com,"Tuesday,Thursday",14:00
   ```
4. Upload file
5. Review summary
6. Set sessions to 4 (for testing)
7. Confirm import
8. Check "My Bookings" - should see 2 bookings
9. Click into a booking - should see 4 sessions
10. Success! ✅

---

## 🐛 Troubleshooting

### "Validation Errors Found"

**Common causes:**
- Typo in day names
- Invalid time format
- Missing required fields
- Invalid email format

**Solution:**
- Read error messages carefully
- Fix issues in CSV
- Re-upload

### "Scheduling Conflicts Detected"

**Cause:**
- Time slot already booked by another student

**Solution:**
- Change the time in your CSV
- Or reschedule the existing booking first
- Then re-import

### "Failed to Import Sessions"

**Possible causes:**
- Database connection issue
- Missing permissions
- Malformed CSV

**Solution:**
- Check browser console for errors
- Verify you're logged in as tutor
- Try re-uploading
- Contact support if persists

### "No Data to Import"

**Cause:**
- CSV is empty
- Only has headers
- File didn't upload correctly

**Solution:**
- Verify CSV has data rows
- Re-upload file
- Try downloading template again

---

## 📈 Limits & Capacity

### Current Limits:

**File Size:**
- Recommended: < 1 MB
- Max students per import: No hard limit, but 50-100 recommended

**Time:**
- Import processing: ~1-2 seconds per student
- For 50 students: ~1-2 minutes total

**Sessions:**
- Can generate 4 to 48 sessions per student
- Total sessions: Students × Sessions Per Student × Days Per Week

**Example:**
- 20 students
- 12 sessions each
- 2 days per week average
- = 480 total sessions created

---

## 🔐 Security & Permissions

### Who Can Import:

- ✅ Tutors only
- ✅ Only for their own classes
- ❌ Students cannot import
- ❌ Cannot import to other tutor's classes

### Data Privacy:

- ✅ Only you can see your imports
- ✅ Student emails kept private
- ✅ RLS policies enforce access control
- ✅ Import data not stored (only results)

---

## 🚀 After Import

### What Happens Next:

**Automatically Created:**
1. ✅ Booking records for each student
2. ✅ All sessions based on schedule
3. ✅ Links to your class
4. ✅ Status set to "confirmed"

**Students Can:**
- View their sessions (if they have accounts)
- Join video classrooms
- Upload materials
- See session notes

**You Can:**
- View all bookings in "My Bookings"
- Manage each session individually
- Add notes per session
- Upload materials
- Reschedule if needed

---

## 📝 Example Use Cases

### Use Case 1: New Tutor Onboarding

**Scenario:** You're migrating from Zoom + WhatsApp

**Steps:**
1. Create your class in ClassroomLY
2. Export your current schedule to CSV
3. Format it to match template
4. Import all students at once
5. Send them their booking links
6. Start teaching!

**Result:** 50 students onboarded in 10 minutes instead of 8+ hours!

### Use Case 2: Semester Start

**Scenario:** New semester, same students, new schedule

**Steps:**
1. Update your CSV with new times
2. Keep same student emails
3. Import for new class
4. System matches existing students
5. They see new sessions automatically

**Result:** Smooth semester transition!

### Use Case 3: Mid-Year Additions

**Scenario:** Adding new students to existing class

**Steps:**
1. Create CSV with just new students
2. Import to existing class
3. New bookings created
4. Existing students unaffected

**Result:** Easy to scale up!

---

## 🎊 Benefits

### Time Savings:
- ⏱️ Manual entry: 5-10 min per student
- ⏱️ Bulk import: ~2 min for all students
- 💰 For 20 students: Save 1.5 - 3 hours!

### Accuracy:
- ✅ No manual typing errors
- ✅ Validation catches mistakes
- ✅ Conflict detection prevents double-booking
- ✅ Consistent format across all bookings

### Convenience:
- ✅ Import from existing Excel sheets
- ✅ No need to learn new system first
- ✅ Migrate from old tools easily
- ✅ Onboard students in bulk

---

## 🆘 Need Help?

### For Template Issues:
1. Re-download template
2. Don't modify column headers
3. Follow example data format
4. Keep it simple initially

### For Import Errors:
1. Check browser console
2. Read error messages carefully
3. Verify CSV format
4. Try with fewer students first

### For Technical Support:
- Check documentation files
- Review example CSV format
- Test with template data first
- Contact support with:
  - Screenshot of error
  - Your CSV file (redacted)
  - Steps you took

---

## 🎉 Success!

Once imported, you'll have:
- ✅ All student bookings created
- ✅ All sessions scheduled
- ✅ Students can access their dashboard
- ✅ You can manage everything normally
- ✅ Ready to start teaching!

**Import once, teach forever! 🚀**

---

*Feature available in ClassroomLY MVP - Version 1.0+*

