# Admin Dashboard - Setup Guide

## 🎯 Admin Dashboard Features

The admin dashboard provides:
- **Platform Metrics** - Users, classes, bookings, sessions
- **Engagement Analytics** - Activation rates, conversion rates
- **Content Metrics** - Materials uploaded, notes added
- **Recent Activity Feed** - Real-time platform activity
- **Health Monitoring** - Platform performance indicators

---

## 🔧 Setup: Make a User an Admin

### **Method 1: SQL (Recommended)**

1. Go to Supabase SQL Editor
2. Find your user email
3. Run this SQL:

```sql
-- Make a user an admin
UPDATE profiles
SET role = 'admin'
WHERE email = 'your-email@example.com';
```

4. Logout and login again
5. You'll see "Admin Dashboard" in the sidebar

---

### **Method 2: Via Supabase Table Editor**

1. Go to Supabase → Table Editor → `profiles`
2. Find your user row (search by email)
3. Click on the `role` cell
4. Change from `tutor` or `student` to `admin`
5. Save
6. Logout and login

---

## 📊 What You'll See

### **Key Metrics (Top Row)**
- **Total Users** - All registered users (tutors + students)
- **Total Classes** - All classes created
- **Total Bookings** - All bookings made
- **Completed Sessions** - Sessions delivered

### **Secondary Metrics**
- **Active Classrooms** - Sessions ready to start
- **Materials Shared** - Files uploaded
- **Session Notes** - Notes added by tutors
- **Pending Reschedules** - Requests waiting approval

### **Engagement Metrics**
- **Tutor Activation** - % of tutors who created classes
- **Student Conversion** - % of students who booked
- **Avg Bookings/Class** - Platform efficiency

### **Content Metrics**
- **Materials per Session** - Content creation rate
- **Notes per Session** - Tutor engagement
- **Reschedule Rate** - Schedule flexibility usage

### **Quick Stats**
- **Avg Students/Tutor** - Platform balance
- **Avg Classes/Tutor** - Tutor productivity
- **Session Completion** - Success rate

### **Recent Activity Feed**
- Last 15 platform activities
- User signups
- Classes created
- Bookings made
- Real-time updates

---

## 🎯 How to Use

### **Daily Monitoring:**
1. Check total users growth
2. Review recent activity
3. Monitor completion rates
4. Check for pending reschedules

### **Weekly Review:**
1. Analyze engagement metrics
2. Identify inactive tutors
3. Review student conversion
4. Track content creation

### **Monthly Analysis:**
1. Growth trends
2. User retention
3. Platform health
4. Feature usage

---

## 📈 Key Performance Indicators (KPIs)

### **Growth KPIs:**
- Total users (target: +10% monthly)
- New tutors (target: 5-10/month)
- New students (target: 20-50/month)

### **Engagement KPIs:**
- Tutor activation (target: >60%)
- Student conversion (target: >25%)
- Session completion (target: >85%)

### **Quality KPIs:**
- Materials per session (target: >1.5)
- Notes coverage (target: >70%)
- Reschedule rate (target: <15%)

---

## 🔍 Troubleshooting

### **No Data Showing**
- Check you're logged in as admin
- Verify role is 'admin' in database
- Refresh the page
- Check browser console for errors

### **Metrics Seem Wrong**
- RLS policies might be blocking queries
- Admin needs SELECT permission on all tables
- Run this SQL to grant permissions:

```sql
-- Grant admin SELECT access to all tables
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
```

### **Can't Access Admin Dashboard**
- Verify your profile role is 'admin'
- Logout and login again
- Clear browser cache

---

## 🚀 Future Enhancements

### **Analytics to Add:**
- Revenue tracking (after payment integration)
- User retention rates
- Churn analysis
- Feature usage heatmap
- Geographic distribution
- Peak usage times
- Average session duration
- Tutor ratings (future feature)

### **Monitoring to Add:**
- Error logs
- Performance metrics
- API response times
- Database query performance
- Storage usage
- Bandwidth usage

### **Admin Actions to Add:**
- Suspend/activate users
- Moderate content
- Send platform notifications
- Export data (CSV)
- Backup/restore
- Feature flags

---

## ✅ Quick Start

1. Run SQL to make yourself admin
2. Logout and login
3. Click "Admin Dashboard" in sidebar
4. See all platform metrics
5. Monitor growth and engagement!

---

**Your admin dashboard is ready to use!** 📊

