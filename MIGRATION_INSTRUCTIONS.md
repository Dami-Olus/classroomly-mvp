# 🗄️ Database Migration Instructions

## ⚠️ IMPORTANT: Run This Migration Before Testing New Features!

The new session-based structure requires database changes. Without running this migration, you'll see:
- ❌ No sessions appearing after booking
- ❌ Errors when trying to view session details
- ❌ Missing session notes and materials features

---

## 📋 **Step-by-Step Migration Guide**

### **Step 1: Open Supabase SQL Editor**

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: **classroomly_mvp**
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**

---

### **Step 2: Copy the Migration SQL**

Open this file in your project:
```
supabase/migrations/011_sessions_restructure.sql
```

Copy the **entire contents** of this file.

---

### **Step 3: Run the Migration**

1. Paste the SQL into the Supabase SQL Editor
2. Click **Run** (or press Ctrl/Cmd + Enter)
3. Wait for it to complete (should take 2-5 seconds)

---

### **Step 4: Verify Migration Success**

You should see:
```
Success. No rows returned
```

Or a message indicating the tables were created successfully.

---

### **Step 5: Verify New Tables Exist**

1. Go to **Table Editor** in Supabase
2. You should now see these **new tables**:
   - ✅ `sessions` - Individual session instances
   - ✅ `class_notes` - Overall class notes
   - ✅ `class_reports` - Monthly/periodic reports

3. These **existing tables** should have **new columns**:
   - ✅ `session_notes` - now has `session_id` column
   - ✅ `materials` - now has `session_id` column
   - ✅ `bookings` - now has `total_sessions`, `start_date`, etc.

---

## 🧪 **Testing After Migration**

### **Test 1: Book a New Class**

1. Go to a booking link (as a student)
2. Select time slots
3. **Set start date** (e.g., today's date)
4. **Set number of sessions** (e.g., 12)
5. Complete booking
6. ✅ You should now see **12 upcoming sessions** in the dropdown!

### **Test 2: View Session Details**

1. Go to **Student Bookings** page
2. Click on a booking
3. Click **"View Sessions"** to expand
4. ✅ You should see all generated sessions listed
5. Click on a session
6. ✅ You should see session detail page with:
   - Session info
   - Materials section
   - Notes section (for students to view)

### **Test 3: Add Session Notes (as Tutor)**

1. Login as tutor
2. Go to **Tutor Bookings**
3. Click on a booking
4. Click on a session
5. ✅ Add notes, topics covered, homework
6. ✅ Notes should save successfully

### **Test 4: Generate Class Report (as Tutor)**

1. From booking detail page
2. Click **"Reports"** tab
3. ✅ Generate a report based on all session notes
4. ✅ Report should show aggregate data

---

## 🔄 **If Migration Fails**

### **Common Issues:**

#### **Issue 1: "relation already exists"**
**Cause:** Tables already exist (migration was run before)  
**Solution:** This is OK! The migration is idempotent (safe to run multiple times)

#### **Issue 2: "column already exists"**
**Cause:** Some columns were added in a previous migration  
**Solution:** This is OK! The migration checks for existing columns

#### **Issue 3: "permission denied"**
**Cause:** Not enough permissions  
**Solution:** Make sure you're logged in as the project owner

---

## 📊 **What This Migration Does**

### **Creates New Tables:**

1. **`sessions`** - Individual session instances
   - Links to bookings
   - Tracks scheduled date/time
   - Has status (scheduled, completed, cancelled, etc.)
   - Enables per-session notes and materials

2. **`class_notes`** - Overall class-level notes
   - For general observations across all sessions
   - Separate from per-session notes

3. **`class_reports`** - Generated reports
   - Monthly or periodic summaries
   - Based on aggregated session notes
   - Can be shared with parents

### **Updates Existing Tables:**

1. **`bookings`** - Adds:
   - `total_sessions` - Number of sessions in this booking
   - `sessions_per_week` - Frequency
   - `start_date` - When sessions start
   - `end_date` - When sessions end (calculated)

2. **`session_notes`** - Adds:
   - `session_id` - Links notes to specific sessions

3. **`materials`** - Adds:
   - `session_id` - Links materials to specific sessions

---

## 🎯 **After Migration**

Once the migration is complete:

1. ✅ **Deployment is already live** (Vercel deployed successfully)
2. ✅ **Database is updated** (migration complete)
3. 🧪 **Test all features** (follow testing guide above)
4. 🎉 **MVP is complete!**

---

## 🆘 **Need Help?**

If you encounter any issues:

1. Check the Supabase SQL Editor for error messages
2. Check browser console for errors
3. Check Supabase logs (Logs & Analytics section)
4. Share the error message for troubleshooting

---

## 📝 **Migration File Location**

```
/Users/adedamolaolusakin/Documents/saas/classroomly_mvp/supabase/migrations/011_sessions_restructure.sql
```

**Total lines:** 265  
**Estimated run time:** 2-5 seconds  
**Safe to run multiple times:** Yes (idempotent)

---

## ✅ **Checklist**

- [ ] Open Supabase SQL Editor
- [ ] Copy migration SQL from `011_sessions_restructure.sql`
- [ ] Paste and run in SQL Editor
- [ ] Verify "Success" message
- [ ] Check new tables exist in Table Editor
- [ ] Test booking a new class
- [ ] Verify sessions appear in dropdown
- [ ] Test session detail pages
- [ ] Test adding session notes
- [ ] Test generating reports
- [ ] 🎉 Celebrate MVP completion!

---

**Ready to run the migration? Open Supabase and let's do this! 🚀**

