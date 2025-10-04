# 🎯 Authentication & Dashboard Implementation Guide

## Current Status

✅ **Completed:**
1. Added User model to Prisma schema
2. Created authentication API endpoints (`backend/api/auth.py`)
3. Added auth models to `models.py` (RegisterRequest, LoginRequest, AuthResponse, UserResponse)
4. Fixed and recreated `database.py` with user functions
5. Backend structure ready for auth

⚠️ **Needs Installation:**
```powershell
cd backend
.\venv\Scripts\Activate.ps1
pip install pyjwt bcrypt
```

⚠️ **Needs Database Update:**
```powershell
cd backend
prisma generate --schema=./db/schema.prisma
prisma db push --schema=./db/schema.prisma
```

⚠️ **Needs Backend Update:**
Add to `main.py`:
```python
from api import feedback, legal, auth  # Add auth

# Include routers
app.include_router(feedback.router)
app.include_router(legal.router)
app.include_router(auth.router)  # Add this line
```

---

## Frontend Tasks Remaining

### 1. Authentication Context & Hooks
Create `frontend/lib/auth.ts`:
- AuthContext with React Context API
- useAuth hook
- Login/logout/register functions
- Token storage in localStorage
- Auto token refresh

### 2. Auth API Client
Update `frontend/lib/api.ts`:
- Add auth endpoints (login, register, getMe)
- Add Authorization header to all requests
- Handle 401 errors (redirect to login)

### 3. Pages to Create:
- `app/login/page.tsx` - Login form
- `app/register/page.tsx` - Register form with role selection
- `app/admin/dashboard/page.tsx` - Admin dashboard (like screenshot)
- `app/client/dashboard/page.tsx` - Client feedback/legal draft view
- `app/admin/layout.tsx` - Admin layout with protected route
- `app/client/layout.tsx` - Client layout with protected route

### 4. Components to Create:
- `components/ProtectedRoute.tsx` - Route guard
- `components/admin/StatsCard.tsx` - Dashboard stat cards
- `components/admin/SentimentChart.tsx` - Pie/donut chart
- `components/admin/WordCloud.tsx` - Word cloud component
- `components/admin/CommentList.tsx` - Comments table
- `components/Navbar.tsx` - Navigation with login/logout

---

## Quick Implementation Steps

### Step 1: Install Dependencies
```powershell
# Backend
cd backend
.\venv\Scripts\Activate.ps1
pip install pyjwt bcrypt

# Frontend
cd ../frontend
npm install recharts lucide-react
```

### Step 2: Update Database
```powershell
cd backend
prisma generate --schema=./db/schema.prisma
prisma db push --schema=./db/schema.prisma
```

### Step 3: Update Backend main.py
Add auth router import and include it.

### Step 4: Restart Backend
```powershell
cd backend
.\venv\Scripts\Activate.ps1
python main.py
```

### Step 5: Create Frontend Auth System
1. Create auth context
2. Create login/register pages
3. Create protected routes
4. Create admin dashboard
5. Create client dashboard

---

##  Backend API Endpoints (Ready to Use)

### Authentication:
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `GET /api/v1/auth/me` - Get current user (requires token)

### Feedback (Existing):
- `POST /api/v1/feedback/` - Submit feedback
- `GET /api/v1/feedback/` - Get all feedback
- `GET /api/v1/feedback/analytics/` - Get analytics
- `POST /api/v1/feedback/summary/` - AI summary
- `POST /api/v1/feedback/cluster/` - Cluster feedback
- `GET /api/v1/feedback/wordcloud/` - Word cloud image

---

## Example User Registration/Login Flow

### Register:
```typescript
const register = async (email: string, password: string, name: string, role: 'admin' | 'client') => {
  const response = await axios.post('http://localhost:8000/api/v1/auth/register', {
    email, password, name, role
  });
  
  // Store token
  localStorage.setItem('token', response.data.accessToken);
  localStorage.setItem('user', JSON.stringify(response.data.user));
  
  return response.data;
};
```

### Login:
```typescript
const login = async (email: string, password: string) => {
  const response = await axios.post('http://localhost:8000/api/v1/auth/login', {
    email, password
  });
  
  localStorage.setItem('token', response.data.accessToken);
  localStorage.setItem('user', JSON.stringify(response.data.user));
  
  return response.data;
};
```

### Protected API Calls:
```typescript
const token = localStorage.getItem('token');
const response = await axios.get('http://localhost:8000/api/v1/auth/me', {
  headers: {
    Authorization: `Bearer ${token}`
  }
});
```

---

## Dashboard Features to Implement

### Admin Dashboard (Like Screenshot):
1. **Top Stats Cards:**
   - Total Comments
   - Positive/Negative/Neutral counts
   - Quality Score
   - Languages Detected

2. **Comment Analysis Section:**
   - Text area for single comment analysis
   - "Analyze All Comments" button
   - "Add Sample" button
   - Stakeholder type selector
   - Category dropdown

3. **Individual Comments List:**
   - Filter by language
   - Filter by quality
   - Show all comments with sentiment

4. **Sentiment Distribution Chart:**
   - Pie/donut chart
   - Shows Positive/Negative/Neutral percentages

5. **Word Cloud:**
   - Visual word frequency
   - Generated from all feedback

### Client Dashboard:
1. **Feedback Submission Form:**
   - Same as current form
   - Submit consultation feedback

2. **Legal Draft View:**
   - Show AI-generated legal drafts
   - Show legal references
   - Download option

3. **My Submissions:**
   - View own submissions
   - Track status

---

## Folder Structure (Frontend)

```
frontend/
├── app/
│   ├── login/
│   │   └── page.tsx                 # Login page
│   ├── register/
│   │   └── page.tsx                 # Register page
│   ├── admin/
│   │   ├── layout.tsx               # Protected admin layout
│   │   └── dashboard/
│   │       └── page.tsx             # Admin dashboard
│   └── client/
│       ├── layout.tsx               # Protected client layout
│       └── dashboard/
│           └── page.tsx             # Client dashboard
├── components/
│   ├── ProtectedRoute.tsx           # Route guard
│   ├── Navbar.tsx                   # Main navigation
│   ├── admin/
│   │   ├── StatsCard.tsx
│   │   ├── SentimentChart.tsx
│   │   ├── WordCloud.tsx
│   │   └── CommentList.tsx
│   └── client/
│       ├── FeedbackForm.tsx
│       └── LegalDraftView.tsx
└── lib/
    ├── auth.ts                      # Auth context & hooks
    └── api.ts                       # API client (update)
```

---

## Next Steps (Priority Order)

1. **Install backend dependencies** (pyjwt, bcrypt)
2. **Update database schema** (prisma push)
3. **Update main.py** to include auth router
4. **Test auth endpoints** using curl or Postman
5. **Create frontend auth system** (context, hooks, API)
6. **Build login/register pages**
7. **Build admin dashboard** with all components
8. **Build client dashboard**
9. **Add navigation** and route protection

---

## Time Estimate

- Backend setup: 10 minutes (install + update)
- Frontend auth system: 30 minutes
- Login/Register pages: 20 minutes
- Admin dashboard: 60 minutes (complex with charts)
- Client dashboard: 30 minutes
- Navigation & polish: 20 minutes

**Total: ~3 hours for complete implementation**

---

Would you like me to continue implementing these features step by step?
