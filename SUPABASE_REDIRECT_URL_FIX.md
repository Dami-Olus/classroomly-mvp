# 🔧 Supabase Redirect URL Configuration Fix

## Problem
After updating the callback URL in Supabase, you're getting a 400 Bad Request error during authentication.

## Root Cause
The Supabase redirect URL configuration is incorrect, causing authentication requests to fail.

## ✅ Solution

### Step 1: Go to Supabase Dashboard
1. Visit [supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Authentication** → **URL Configuration**

### Step 2: Configure Site URL
**Set the Site URL to:**
```
http://localhost:3000
```
*(For production, use your actual domain like `https://your-domain.com`)*

### Step 3: Configure Redirect URLs
**Add these URLs to the "Redirect URLs" list:**

#### For Development:
```
http://localhost:3000/auth/callback
http://localhost:3000/auth/callback?*
```

#### For Production:
```
https://your-domain.com/auth/callback
https://your-domain.com/auth/callback?*
```

### Step 4: Additional URLs (Optional but Recommended)
**Add these additional redirect URLs for better compatibility:**

#### For Development:
```
http://localhost:3000
http://localhost:3000/**
```

#### For Production:
```
https://your-domain.com
https://your-domain.com/**
```

### Step 5: Save Configuration
1. Click **Save** at the bottom of the URL Configuration page
2. Wait for the changes to take effect (usually immediate)

---

## 🚨 Common Mistakes to Avoid

### ❌ Wrong URL Format
```
❌ http://localhost:3000/auth/callback/  (trailing slash)
❌ https://localhost:3000/auth/callback   (https instead of http)
❌ http://localhost:3000/callback         (missing /auth/)
```

### ✅ Correct URL Format
```
✅ http://localhost:3000/auth/callback
✅ http://localhost:3000/auth/callback?*
```

### ❌ Missing Wildcard URLs
```
❌ Only adding: http://localhost:3000/auth/callback
✅ Also add: http://localhost:3000/auth/callback?*
```

---

## 🧪 Testing the Fix

### Step 1: Clear Browser Data
1. **Clear cookies** for localhost:3000
2. **Clear localStorage** and sessionStorage
3. **Hard refresh** the page (Ctrl+F5 or Cmd+Shift+R)

### Step 2: Test Authentication
1. **Go to** http://localhost:3000/signup
2. **Create a new account** with a test email
3. **Check email** for confirmation link
4. **Click the confirmation link** - should redirect to `/auth/callback`
5. **Should see** "Email Confirmed!" message
6. **Should redirect** to appropriate dashboard

### Step 3: Test Sign In
1. **Go to** http://localhost:3000/login
2. **Sign in** with confirmed account
3. **Should work** without 400 error
4. **Should redirect** to dashboard

---

## 🔍 Debugging Steps

### If Still Getting 400 Error:

#### 1. Check Console Logs
Look for these messages in browser console:
```
✅ Supabase client initialized with URL: https://your-project.supabase.co
🔐 Attempting sign in for: user@example.com
🔐 Sign in response: { data: true, error: null }
```

#### 2. Check Supabase Auth Logs
1. Go to **Supabase Dashboard** → **Logs** → **Auth Logs**
2. Look for failed authentication attempts
3. Check the error messages

#### 3. Verify Environment Variables
Make sure your `.env.local` has:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### 4. Test with Different Email
Try creating a completely new account with a different email address.

---

## 📋 Complete Supabase Configuration

### URL Configuration Settings:
```
Site URL: http://localhost:3000
Redirect URLs:
  - http://localhost:3000/auth/callback
  - http://localhost:3000/auth/callback?*
  - http://localhost:3000
  - http://localhost:3000/**
```

### Email Templates (Optional):
1. Go to **Authentication** → **Email Templates**
2. **Confirm signup** template should redirect to `/auth/callback`
3. **Reset password** template should redirect to `/auth/callback`

---

## 🎯 Expected Results

### ✅ After Fix:
- ✅ **No more 400 Bad Request errors**
- ✅ **Email confirmation works** - Users can confirm email
- ✅ **Sign in works** - Users can authenticate successfully
- ✅ **Proper redirects** - Users go to correct dashboard
- ✅ **Console logs show success** - Detailed authentication logging

### ❌ Before Fix:
- ❌ `POST https://your-project.supabase.co/auth/v1/token?grant_type=password 400 (Bad Request)`
- ❌ Email confirmation doesn't work
- ❌ Users can't sign in after confirming email

---

## 🚀 Production Deployment

### For Production:
1. **Update Site URL** to your production domain
2. **Update Redirect URLs** to production URLs
3. **Test thoroughly** before going live
4. **Monitor Supabase logs** for any issues

### Production URLs:
```
Site URL: https://your-domain.com
Redirect URLs:
  - https://your-domain.com/auth/callback
  - https://your-domain.com/auth/callback?*
  - https://your-domain.com
  - https://your-domain.com/**
```

---

## 📞 Still Having Issues?

If you're still getting the 400 error after following these steps:

1. **Double-check the URLs** - Make sure they match exactly
2. **Clear all browser data** - Cookies, localStorage, etc.
3. **Try incognito/private mode** - To rule out browser cache issues
4. **Check Supabase status** - Visit status.supabase.com
5. **Contact support** - With the specific error message and console logs

The redirect URL configuration is the most common cause of authentication issues with Supabase!
