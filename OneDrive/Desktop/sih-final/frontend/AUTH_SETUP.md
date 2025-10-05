# Authentication Setup Guide

## Current Issue: Login 401 Unauthorized

Your login is failing because of one of these reasons:

### 1. Email Not Confirmed (Most Likely)
When you registered, Supabase sent a confirmation email. You must click the link before logging in.

**Solution A: Disable Email Confirmation (Development)**
1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/ibezvnwzacivmvqyqwcp
2. Click **Authentication** → **Providers**
3. Find **Email** provider settings
4. **Uncheck** "Confirm email"
5. Click **Save**
6. Now users can login immediately after registration

**Solution B: Confirm Email**
1. Check your email inbox for confirmation link
2. Click the confirmation link
3. Try logging in again

### 2. Missing Service Role Key
Without the service role key, users need email confirmation.

**Get Service Role Key:**
1. Go to: https://supabase.com/dashboard/project/ibezvnwzacivmvqyqwcp/settings/api
2. Scroll to **Project API keys**
3. Find **service_role** key (starts with `eyJhbGciOi...`)
4. Copy it and add to `.env.local`:
   ```bash
   SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOi...your_service_role_key"
   ```
5. Restart dev server: `npm run dev`

With service role key:
- ✅ Users are auto-confirmed (no email needed)
- ✅ Admin operations work
- ✅ Instant login after registration

### 3. Wrong Password
The password you're entering doesn't match what you registered with.

**Solution:**
- Make sure you're using the exact same password
- Try registering a new account
- Or reset password via Supabase dashboard

## Testing Auth Flow

### Register a New User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "name": "Test User",
    "role": "client"
  }'
```

**Expected Response:**
```json
{
  "message": "Registration successful. You can now login.",
  "user": {
    "id": "uuid-here",
    "email": "test@example.com",
    "name": "Test User",
    "role": "client"
  }
}
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!"
  }'
```

**Expected Response (Success):**
```json
{
  "message": "Login successful",
  "token": "jwt-token-here",
  "user": {
    "id": "uuid-here",
    "email": "test@example.com",
    "name": "Test User",
    "role": "client"
  },
  "session": { ... }
}
```

**Expected Response (Email Not Confirmed):**
```json
{
  "error": "Please confirm your email before logging in..."
}
```

## Quick Fix: Disable Email Confirmation

For development, the easiest solution is to disable email confirmation:

1. **Supabase Dashboard** → https://supabase.com/dashboard/project/ibezvnwzacivmvqyqwcp
2. **Authentication** → **Providers** → **Email**
3. **Uncheck**: "Confirm email"
4. **Save**

Now registration will work instantly without email confirmation!

## Environment Variables Checklist

Your `.env.local` should have:

```bash
# Supabase URLs (Required)
NEXT_PUBLIC_SUPABASE_URL="https://ibezvnwzacivmvqyqwcp.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbG..."

# Service Role Key (Optional but recommended for dev)
SUPABASE_SERVICE_ROLE_KEY="eyJhbG..."  # ← Add this!

# Other keys
GROQ_API_KEY="gsk_..."
JWT_SECRET="your-secret"
```

## Admin Operations

With `SUPABASE_SERVICE_ROLE_KEY` set, you can:
- Create users without email confirmation
- Delete users
- Update user roles
- Read all user data

**Security Warning:** Never expose service role key in client-side code or commit it to git!

## Troubleshooting Steps

1. **Check registration worked:**
   - Go to Supabase Dashboard → Authentication → Users
   - Verify user exists with correct email

2. **Check if email is confirmed:**
   - Look for green checkmark next to user in Supabase dashboard
   - Or check `confirmed_at` field in user data

3. **Try different email:**
   - Register with a different email address
   - See if it works better

4. **Check server logs:**
   - Look at terminal where `npm run dev` is running
   - Check for error messages after login attempt

## Current Auth Flow

```
Registration:
1. POST /api/auth/register
2. If SUPABASE_SERVICE_ROLE_KEY set:
   → Create user with email_confirm: true (instant)
3. Else:
   → Create user normally (requires email confirmation)
4. Return success message

Login:
1. POST /api/auth/login
2. Call supabase.auth.signInWithPassword()
3. If error:
   → Check if "Email not confirmed"
   → Check if "Invalid login credentials"
4. If success:
   → Return token + user data + session
```

## Next Steps

1. **Add Service Role Key** (recommended for development)
2. **OR Disable Email Confirmation** in Supabase settings
3. **Register a new test user**
4. **Try logging in again**

The login should work after one of these fixes! 🎉
