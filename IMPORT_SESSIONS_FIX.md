# 🔧 Import Sessions Fix - Missing Database Columns

## 🐛 Issue Found

**Error:** `Could not find the 'sessions_per_week' column of 'bookings' in the schema cache`

**Cause:** The import sessions functionality is trying to insert data into columns that don't exist in the `bookings` table.

## ✅ Solution

I've created a migration to add the missing columns:

**File:** `supabase/migrations/014_add_sessions_per_week.sql`

**Adds these columns to `bookings` table:**
- `sessions_per_week` (INTEGER) - Number of sessions per week
- `start_date` (DATE) - Start date for the booking sessions

---

## 🚀 How to Apply the Fix

### **Option 1: Using Supabase CLI (Recommended)**

```bash
# Run the migration
supabase db push

# Or if you want to run just this migration
supabase migration up
```

### **Option 2: Using Supabase Dashboard**

1. Go to: https://supabase.com/dashboard/project/[your-project]/sql
2. Copy the contents of `supabase/migrations/014_add_sessions_per_week.sql`
3. Paste and run the SQL

### **Option 3: Manual SQL (Quick Fix)**

Run this SQL in your Supabase SQL Editor:

```sql
-- Add missing columns
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS sessions_per_week INTEGER;

ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS start_date DATE;

-- Set default values for existing bookings
UPDATE bookings 
SET sessions_per_week = 1 
WHERE sessions_per_week IS NULL;

UPDATE bookings 
SET start_date = CURRENT_DATE 
WHERE start_date IS NULL;
```

---

## ✅ After Running the Migration

The import sessions feature should work correctly:

1. **Import Sessions** button will work
2. **CSV template download** will work  
3. **Bulk import** will work
4. **Session generation** will work

---

## 🧪 Test the Fix

1. Go to: **Tutor Dashboard → Classes**
2. Click **"Import Sessions"** button
3. Download the CSV template
4. Fill it with test data
5. Upload and import
6. Should work without errors! ✅

---

## 📊 What the Import Does

The import sessions feature:

1. **Reads CSV** with student data
2. **Creates bookings** with:
   - `sessions_per_week` - How many days per week
   - `start_date` - When sessions begin
   - `scheduled_slots` - Which days/times
3. **Generates sessions** for each booking
4. **Creates individual session records**

---

## 🔍 Columns Added

| Column | Type | Purpose |
|--------|------|---------|
| `sessions_per_week` | INTEGER | Number of sessions per week (1, 2, 3, etc.) |
| `start_date` | DATE | When the booking sessions start |

---

## ⚡ Quick Fix Commands

If you have Supabase CLI:

```bash
# Apply the migration
supabase db push

# Check status
supabase db status
```

If using Supabase Dashboard:

1. Go to SQL Editor
2. Run the migration SQL
3. Done! ✅

---

## 🎯 Next Steps

1. **Run the migration** (choose one method above)
2. **Test import sessions** feature
3. **Import your existing student data**
4. **Start using the bulk import feature!**

---

**The import sessions feature will work perfectly after this migration!** 🚀
