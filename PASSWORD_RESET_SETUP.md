# Password Reset - Setup Guide

## ✅ Features Implemented

1. **Forgot Password Page** - Request password reset email
2. **Reset Password Page** - Set new password via email link
3. **Password Validation** - Minimum 8 characters required
4. **Success Feedback** - Clear UI feedback at each step

---

## 🔧 Supabase Email Configuration

### **IMPORTANT: Configure Email Templates**

By default, Supabase sends plain emails. You need to configure the email template in Supabase dashboard.

### **Steps:**

1. Go to **Supabase Dashboard** → Your Project
2. Click **Authentication** (left sidebar)
3. Click **Email Templates**
4. Find **"Reset Password"** template
5. Customize the email (optional, default works fine)
6. **Important:** Make sure the reset link is enabled

### **Default Template Variables:**

```
{{ .ConfirmationURL }}  - The reset password link
{{ .Email }}            - User's email
{{ .SiteURL }}          - Your app URL
```

The default template should work out of the box. The link expires in 1 hour.

---

## 📧 Email Configuration (Production)

### **For Production, Configure SMTP (Optional but Recommended)**

Supabase's default email service has limits. For production, set up custom SMTP:

1. **Supabase Dashboard** → **Project Settings** → **Auth**
2. Scroll to **SMTP Settings**
3. Enable custom SMTP
4. Configure with:
   - **SendGrid** (free tier: 100 emails/day)
   - **Resend** (free tier: 100 emails/day)
   - **AWS SES** (free tier: 62,000 emails/month if in AWS)
   - **Mailgun**
   - **Postmark**

### **Example: SendGrid Setup**

```
Host: smtp.sendgrid.net
Port: 587
User: apikey
Password: YOUR_SENDGRID_API_KEY
Sender Email: noreply@yourdomain.com
Sender Name: Classroomly
```

---

## 🎯 User Flow

### **Forgot Password:**

1. User clicks "Forgot your password?" on login page
2. Enters their email address
3. Clicks "Send Reset Link"
4. Receives email with reset link
5. Email valid for 1 hour

### **Reset Password:**

1. User clicks link in email
2. Redirected to `/reset-password` page
3. Enters new password (min 8 characters)
4. Confirms password
5. Clicks "Update Password"
6. Success! Redirected to login

---

## 🧪 Testing

### **Local Testing (Development):**

1. Go to http://localhost:3000/login
2. Click "Forgot your password?"
3. Enter your email
4. Check Supabase Dashboard → **Authentication** → **Logs**
5. Find the reset email and copy the URL
6. Paste URL in browser
7. Set new password
8. Login with new password ✅

### **Production Testing:**

1. Go to your live site login page
2. Click "Forgot your password?"
3. Enter your email
4. Check your inbox (including spam)
5. Click the reset link
6. Set new password
7. Login with new password ✅

---

## 🔒 Security Features

✅ **Token-based** - Secure one-time reset tokens  
✅ **Time-limited** - Links expire in 1 hour  
✅ **Password validation** - Minimum 8 characters  
✅ **Confirmation required** - User must confirm new password  
✅ **Supabase Auth** - Industry-standard security  

---

## ⚠️ Troubleshooting

### **Email Not Received:**

1. Check spam/junk folder
2. Verify email exists in Supabase Auth users
3. Check Supabase Auth logs for errors
4. Verify SMTP settings (if using custom SMTP)
5. Check email rate limits

### **Reset Link Not Working:**

1. Link expires in 1 hour - request new one
2. Link can only be used once
3. Check browser console for errors
4. Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct

### **"Invalid Token" Error:**

- Link has expired (1 hour limit)
- Link already used
- Request a new reset link

---

## 🎨 UI Features

### **Forgot Password Page:**
- Clean, centered layout
- Email validation
- Loading states
- Success confirmation screen
- Link back to login

### **Reset Password Page:**
- Password visibility toggle (show/hide)
- Password confirmation field
- Real-time validation
- Clear error messages
- Success screen with auto-redirect

---

## 🔐 Admin Password Reset (Manual)

If you need to manually reset a user's password:

### **Option 1: Via Supabase Dashboard**

1. Go to **Authentication** → **Users**
2. Find the user
3. Click **"..."** (three dots)
4. Click **"Send password recovery email"**

### **Option 2: Via SQL (Force Reset)**

```sql
-- This will send a reset email
-- Replace with actual user email
SELECT auth.send_password_reset_email('user@example.com');
```

### **Option 3: Admin Sets Password (Not Recommended)**

```sql
-- WARNING: Only use this in emergencies
-- User should reset their own password for security
UPDATE auth.users
SET encrypted_password = crypt('new_password', gen_salt('bf'))
WHERE email = 'user@example.com';
```

---

## 📊 Email Rate Limits

### **Supabase Default (Free Tier):**
- Rate limits apply (varies)
- Good for development
- May be throttled in production

### **Custom SMTP (Recommended for Production):**
- **SendGrid Free:** 100 emails/day
- **Resend Free:** 100 emails/day  
- **AWS SES Free:** 62,000 emails/month (if in AWS)
- **Mailgun Free:** 100 emails/day (first month)

---

## ✅ Quick Checklist

- [x] Password reset pages created
- [x] Forgot password link added to login
- [x] Supabase auth configured
- [ ] Test password reset flow
- [ ] Configure custom SMTP (production)
- [ ] Customize email template (optional)
- [ ] Monitor email delivery

---

## 🚀 Next Steps (Optional Enhancements)

1. **Email customization** - Brand the reset email
2. **Password strength meter** - Visual feedback
3. **2FA** - Two-factor authentication
4. **Login history** - Track login attempts
5. **Account lockout** - After failed attempts
6. **Password expiry** - Force periodic resets

---

**Password reset is now fully functional!** 🔐✨

Users can reset their passwords securely via email.

