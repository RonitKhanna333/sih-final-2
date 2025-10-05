# 🚀 Quick Fix Guide - Get Your Dashboard Working!

## Current Status
✅ Code fixes applied (API endpoints, Groq model)
✅ Dev server is running
⏳ **Need to seed database with sample data**

---

## 📋 Step-by-Step Instructions

### **STEP 1: Open a NEW Terminal** (Keep dev server running!)

In VS Code:
1. Click **Terminal** → **New Terminal** (or press `` Ctrl+Shift+` ``)
2. This creates a new terminal while keeping `npm run dev` running

---

### **STEP 2: Run the Seed Script**

In the **NEW terminal**, paste this command:

```powershell
cd "c:/Users/Ronit Khanna/OneDrive/Desktop/sih-final/frontend"
node scripts/seed-via-api.js
```

**Expected Output:**
```
🔍 Checking if dev server is running...

✅ Server is running

🌱 Starting to seed feedback data...

📝 Attempting to login...
✅ Login successful

[1/10] Adding: "This policy will greatly benefit small businesses..."
   ✅ Added successfully (ID: xxx)
[2/10] Adding: "I appreciate the government's effort in digital..."
   ✅ Added successfully (ID: xxx)
...

============================================================
✅ Successfully added: 10 feedback entries
❌ Failed: 0 feedback entries
============================================================

🎉 Seeding complete! Refresh your dashboard to see the data.
```

---

### **STEP 3: Refresh Your Dashboard**

1. Go to your browser: `http://localhost:3000/admin/dashboard-new`
2. Press **Ctrl+Shift+R** (hard refresh)
3. You should now see:
   - ✅ Total Comments: **10**
   - ✅ KPIs populated (Positive, Negative, Neutral counts)
   - ✅ Individual comments listed
   - ✅ Word cloud with data
   - ✅ Sentiment distribution chart

---

## 🐛 Troubleshooting

### **If seed script says "Server is not running":**
```powershell
# Make sure dev server is running in another terminal:
npm run dev
```

### **If you get "Login failed" but data still seeds:**
- That's OK! The script will work without authentication
- Data will still be added successfully

### **If you get "Failed to add feedback":**
1. Check if `.env.local` has correct Supabase credentials
2. Make sure you **restarted the dev server** after the code fixes
3. Try manually in the browser:
   - Go to `http://localhost:3000/admin/dashboard-new`
   - Type in the comment box: "Test comment"
   - Click "+ Add Comment"
   - It should work now!

### **If comments still don't show after seeding:**
1. Clear Next.js cache and restart:
   ```powershell
   # Stop dev server (Ctrl+C)
   Remove-Item -Recurse -Force .next
   npm run dev
   ```
2. Hard refresh browser: **Ctrl+Shift+R**

---

## 📊 What You Should See After Seeding

### Dashboard KPIs:
- **Total Comments**: 10
- **Positive**: ~6 (60%)
- **Negative**: ~3 (30%)
- **Neutral**: ~1 (10%)
- **Languages**: 1 (English)

### Individual Comments:
You'll see 10 diverse comments from:
- Business Owners
- Citizens
- Environmental Activists
- Rural Representatives
- Startup Founders
- Privacy Advocates
- Policy Analysts
- NGO Representatives

### Word Cloud:
Should show frequent words like:
- policy
- business
- government
- digital
- community
- etc.

---

## 🎯 Next Steps

Once data appears:

1. **Test Adding Comments**: Try the "+ Add Comment" button
2. **Check Analytics**: Click "Advanced Analytics" tab
3. **Test AI Features**: Go to "Theme Clusters" and "AI Assistant" tabs
4. **Verify Client Dashboard**: Visit `http://localhost:3000/client/dashboard`

---

## ⚡ Quick Commands Reference

```powershell
# Seed database (run in NEW terminal)
node scripts/seed-via-api.js

# Restart dev server (if needed)
# Press Ctrl+C first, then:
npm run dev

# Clear cache and restart
Remove-Item -Recurse -Force .next
npm run dev

# Check for errors
npm run lint
```

---

## 📞 Still Having Issues?

If nothing works after these steps:

1. **Verify Supabase connection**:
   - Go to your Supabase dashboard
   - Check if `Feedback` table exists
   - Check table permissions (RLS policies)

2. **Check browser console**:
   - Press F12
   - Look for errors in Console tab
   - Check Network tab for failed API calls

3. **Verify environment variables**:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://...supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   GROQ_API_KEY=gsk_...
   ```

---

**Remember**: Keep the dev server running while you run the seed script in a separate terminal!

Good luck! 🚀
