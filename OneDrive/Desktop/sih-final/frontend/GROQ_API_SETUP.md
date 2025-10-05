# Groq API Setup Guide

## Current Issue

The debate-map API is returning **401 Unauthorized** when calling Groq AI services. This means the API key is either:
- Expired
- Invalid
- Missing from environment
- Rate-limited

## Solution Steps

### Option 1: Get a New Groq API Key (Recommended)

1. **Visit Groq Console**: https://console.groq.com/
2. **Sign up / Log in** with your account
3. **Navigate to API Keys** section
4. **Create a new API key**
5. **Copy the key** (starts with `gsk_...`)
6. **Update `.env.local`**:
   ```bash
   GROQ_API_KEY="your_new_key_here"
   ```
7. **Restart your dev server**:
   ```bash
   npm run dev
   ```

### Option 2: Use Fallback Mode (Temporary)

The debate-map API now includes **automatic fallback** when Groq fails:
- ✅ Uses simple clustering instead of AI-powered clustering
- ✅ Generates random embeddings for visualization
- ✅ Creates basic narrative summaries
- ⚠️ Less intelligent, but functional

**No action needed** - the app will work with reduced AI features.

## Environment Variable Checklist

Your `.env.local` should have:

```bash
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOi..."

# Groq AI (Optional - fallback available)
GROQ_API_KEY="gsk_..." 

# JWT Secret (Required for auth)
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
```

## Testing Groq Connection

After updating the API key, test it:

```bash
# Visit this endpoint in your browser
http://localhost:3000/api/ai/analytics/debate-map?regenerate=false

# Should return JSON with debate map data
# If it returns 500, check server console for error details
```

## Affected Features

APIs that use Groq (with fallback support):
- ✅ `/api/ai/analytics/debate-map` - Debate visualization
- ✅ `/api/ai/assistant/chat` - AI chat assistant  
- ✅ `/api/clustering` - Feedback clustering
- ✅ `/api/summary` - Feedback summaries
- ✅ `/api/feedback` (POST) - Sentiment analysis

All these will **work with reduced intelligence** if Groq API key is missing.

## Rate Limits

Groq free tier limits:
- **30 requests per minute**
- **14,400 requests per day**

If you hit rate limits:
1. Wait 60 seconds and retry
2. Reduce concurrent requests
3. Upgrade to paid plan (if needed)

## Current Key Status

Your current key in `.env.local`:
```
GROQ_API_KEY="gsk_YOUR_KEY_HERE"
```

**Status**: ❌ Returning 401 (likely expired or invalid)

**Action**: Get a new key from https://console.groq.com/

## Alternative: Use OpenAI Instead

If Groq continues to have issues, you can switch to OpenAI:

1. Get OpenAI API key from https://platform.openai.com/
2. Update `lib/groq/ai-functions.ts` to use OpenAI endpoint
3. Change URL from `https://api.groq.com/...` to `https://api.openai.com/v1/...`

## Support

- **Groq Docs**: https://console.groq.com/docs
- **Groq Discord**: https://discord.gg/groq
- **Status Page**: https://status.groq.com/
