# Quick Start Guide - OPINIZE

This guide will get you up and running in 5 minutes.

## Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL 14+

## Automated Setup (Windows)

Run the automated setup script:

```powershell
.\setup.ps1
```

## Manual Setup

### 1. Backend Setup (5 minutes)

```powershell
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Create .env file
copy .env.example .env
# Edit .env and set:
# - DATABASE_URL="postgresql://username:password@localhost:5432/econsultation_db"
# - GROQ_API_KEY="your_key_here"

# Create database
psql -U postgres -c "CREATE DATABASE econsultation_db;"

# Generate Prisma client and push schema
prisma generate
prisma db push

# Start backend server
python main.py
```

Backend will be available at: http://localhost:8000

### 2. Frontend Setup (3 minutes)

```powershell
# Open a new terminal
cd frontend

# Install dependencies
npm install

# Create .env.local file
copy .env.local.example .env.local
# Default values should work (NEXT_PUBLIC_API_URL=http://localhost:8000)

# Start development server
npm run dev
```

Frontend will be available at: http://localhost:3000

## Testing

1. **Open browser**: http://localhost:3000
2. **Submit feedback**: Enter text in the form and click "Submit Feedback"
3. **View results**: See sentiment analysis, nuances, and predictive scores
4. **API docs**: Visit http://localhost:8000/docs for interactive API documentation

## Features to Try

### Basic Features
- ✅ Submit English feedback
- ✅ Submit Hindi feedback (हिंदी फीडबैक)
- ✅ View sentiment analysis results
- ✅ See nuance detection (sarcasm, mixed sentiment)
- ✅ Check predictive scores

### Advanced Features
- ✅ View analytics dashboard (coming in next version)
- ✅ Generate AI summary of all feedback
- ✅ Perform clustering analysis
- ✅ View word cloud visualization

## Common Commands

### Backend
```powershell
cd backend

# Start server
python main.py

# Run with specific port
$env:PORT="8080"; python main.py

# Database migrations
prisma db push

# View database
prisma studio
```

### Frontend
```powershell
cd frontend

# Development
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## API Examples

### Submit Feedback
```bash
curl -X POST http://localhost:8000/api/v1/feedback/ \
  -H "Content-Type: application/json" \
  -d '{
    "text": "This is a great policy proposal!",
    "language": "English"
  }'
```

### Get All Feedback
```bash
curl http://localhost:8000/api/v1/feedback/
```

### Get Analytics
```bash
curl http://localhost:8000/api/v1/feedback/analytics/
```

### Generate Summary
```bash
curl -X POST http://localhost:8000/api/v1/feedback/summary/
```

## Troubleshooting

### Port Already in Use
```powershell
# Backend (change port)
$env:PORT="8001"; python main.py

# Frontend (change port)
npm run dev -- -p 3001
```

### Database Connection Error
```powershell
# Verify PostgreSQL is running
psql -U postgres -c "SELECT version();"

# Check connection string in backend/.env
# Make sure DATABASE_URL is correct
```

### Module Not Found
```powershell
# Backend: Reinstall dependencies
pip install -r requirements.txt

# Frontend: Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## Environment Variables

### Backend (.env)
```env
DATABASE_URL="postgresql://user:pass@localhost:5432/econsultation_db"
GROQ_API_KEY="gsk_..."  # Get from https://console.groq.com
HOST="0.0.0.0"
PORT=8000
CORS_ORIGINS="http://localhost:3000"
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Next Steps

1. **Explore the API**: Visit http://localhost:8000/docs
2. **Submit various feedback types**: Test sentiment analysis
3. **Try Hindi feedback**: Test multilingual support
4. **View analytics**: Check aggregate statistics
5. **Generate summaries**: Use AI-powered summarization

## Support

- 📖 Full documentation: See README.md
- 🐛 Issues: Check console logs in browser and terminal
- 🔍 API docs: http://localhost:8000/docs
- ⚡ Health check: http://localhost:8000/health

---

**Happy analyzing! 🚀**
