# Vercel Deployment Guide

## Quick Deploy (Without GitHub)

Since git is not available, you can deploy directly using Vercel CLI:

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Deploy from the frontend directory
```bash
cd "c:\Users\Ronit Khanna\OneDrive\Desktop\sih-final\frontend"
vercel
```

### 3. Add Environment Variables
After deployment, add these environment variables in Vercel dashboard:

```
DATABASE_URL=your-database-url-here
GROQ_API_KEY=your-groq-api-key-here
GOOGLE_API_KEY=your-google-api-key-here
JWT_SECRET=your-super-secret-jwt-key-change-in-production-make-it-long-and-random
```

## Alternative: GitHub + Vercel (Recommended)

### 1. Create GitHub Repository
1. Go to https://github.com/new
2. Create a new repository (e.g., "sih-policy-platform")
3. Don't initialize with README (we have existing code)

### 2. Upload Code to GitHub
- Use GitHub web interface to upload files
- Or install git and push code

### 3. Connect to Vercel
1. Go to https://vercel.com
2. Click "New Project"
3. Import from GitHub
4. Select your repository
5. Set environment variables
6. Deploy

## Testing After Deployment

Once deployed, test these endpoints:
- `https://your-app.vercel.app/api/feedback` (POST/GET)
- `https://your-app.vercel.app/api/analytics` (GET)
- `https://your-app.vercel.app/api/auth/register` (POST)
- `https://your-app.vercel.app/api/auth/login` (POST)

The database connection should work properly in the cloud environment!