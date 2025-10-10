# Known Issues & Future Fixes

## 🔴 Active Issues

### Anonymous Booking RLS Issue
**Status**: Parked for later  
**Workaround**: Students must create an account first (authenticated booking works)  
**Issue**: RLS policy blocks anonymous users from creating bookings  
**To Fix**: Need to properly configure anon role permissions in Supabase  
**Priority**: Medium (can be fixed post-MVP)

**Technical Details:**
- Error: `new row violates row-level security policy for table "bookings"`
- Cause: RLS blocking `anon` role inserts despite GRANT statements
- Workaround tested: Authenticated student booking works perfectly
- Migration attempted: `006_force_public_booking.sql`

**Temporary Solution:**
Students can:
1. Create a free account (takes 30 seconds)
2. Then book any class
3. Benefit: They can track all bookings in their dashboard

---

## 🟡 Future Enhancements

### Sprint 3 (Current):
- Email notifications system
- Booking confirmation emails
- Session reminder emails
- Calendar integration (Google Calendar)

### Sprint 4:
- Virtual classroom with video.co
- Screen sharing
- Session recording

### Sprint 5:
- Real-time chat
- File sharing
- Material library

### Sprint 6:
- Rescheduling system
- Final polish
- Launch prep

---

## ✅ Completed Workarounds

None yet - first issue encountered!

---

*Last Updated: Sprint 2 → Sprint 3 transition*

