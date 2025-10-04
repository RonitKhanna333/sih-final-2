# OPINIZE - eConsultation AI Analytics Platform

A full-stack, production-ready web application for multilingual sentiment analysis and policy feedback processing. This project migrates a Python Streamlit application to a modern, scalable architecture using **FastAPI** (backend) and **Next.js 14** (frontend).

## 🏗️ Architecture Overview

### Technology Stack

**Backend (Python/FastAPI)**
- **Framework**: FastAPI
- **Database**: PostgreSQL with Prisma ORM
- **ML Models**: 
  - `nlptown/bert-base-multilingual-uncased-sentiment` for sentiment analysis
  - `all-MiniLM-L6-v2` (SentenceTransformer) for embeddings
- **AI Integration**: Groq LLaMA for intelligent summarization
- **Data Processing**: Scikit-learn, NumPy, Pandas

**Frontend (TypeScript/Next.js)**
- **Framework**: Next.js 14 with App Router
- **UI Library**: Shadcn/UI + Tailwind CSS
- **State Management**: 
  - TanStack Query for server state
  - Zustand for client state (optional)
- **Data Visualization**: Recharts
- **HTTP Client**: Axios

### Project Structure

```
.
├── backend/
│   ├── main.py                 # FastAPI application entry point
│   ├── models.py               # Pydantic request/response models
│   ├── requirements.txt        # Python dependencies
│   ├── .env.example            # Environment variables template
│   ├── api/
│   │   ├── feedback.py         # Feedback endpoints
│   │   └── legal.py            # Legal precedent search
│   ├── utils/
│   │   ├── analysis.py         # ML & NLP utility functions
│   │   └── database.py         # Database operations
│   └── db/
│       └── schema.prisma       # Prisma database schema
│
└── frontend/
    ├── package.json
    ├── next.config.js
    ├── tailwind.config.js
    ├── tsconfig.json
    ├── app/
    │   ├── layout.tsx          # Root layout with providers
    │   ├── page.tsx            # Main page
    │   ├── globals.css         # Global styles
    │   └── providers.tsx       # React Query provider
    ├── components/
    │   ├── FeedbackForm.tsx    # Feedback submission form
    │   ├── FeedbackList.tsx    # Feedback display list
    │   ├── FeedbackCard.tsx    # Individual feedback card
    │   └── ui/                 # Shadcn UI components
    └── lib/
        ├── api.ts              # API client & types
        └── utils.ts            # Utility functions
```

## 📋 Features

### Core Functionality
- ✅ **Multilingual Sentiment Analysis**: English & Hindi support using transformer models
- ✅ **Nuance Detection**: Sarcasm, mixed sentiment, polite disagreement detection
- ✅ **Spam Detection**: Rule-based spam filtering
- ✅ **Predictive Scoring**: Legal risk, compliance difficulty, business growth impact
- ✅ **Edge Case Retrieval**: RAG-style similarity matching with edge case database
- ✅ **Legal Reference Linking**: Automatic matching to legal precedents
- ✅ **AI Summarization**: Groq-powered intelligent feedback summaries
- ✅ **Clustering**: KMeans clustering of similar feedback items
- ✅ **Word Cloud Generation**: Visual representation of frequent terms
- ✅ **Real-time Analytics**: Sentiment distribution, concern patterns, trends

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/feedback/` | Submit new feedback for analysis |
| GET | `/api/v1/feedback/` | Retrieve all feedback (paginated) |
| GET | `/api/v1/feedback/analytics/` | Get aggregated analytics |
| POST | `/api/v1/feedback/summary/` | Generate AI-powered summary |
| POST | `/api/v1/feedback/cluster/` | Perform KMeans clustering |
| GET | `/api/v1/feedback/wordcloud/` | Get word cloud image (PNG) |
| GET | `/api/v1/legal/search/` | Search legal precedents |
| GET | `/health` | Health check endpoint |

## 🚀 Quick Start

### ⚡ Easiest Way: Use Supabase (Recommended)

**No PostgreSQL installation needed!** We recommend using Supabase for the database:

1. **See SUPABASE_SETUP.md** for complete 2-minute setup guide
2. Benefits:
   - ✅ No local database installation
   - ✅ Free tier (perfect for development)
   - ✅ Cloud-hosted (accessible anywhere)
   - ✅ Built-in GUI for database management

**Total setup time: ~15 minutes**

---

### 📚 Documentation Files

- **START_HERE.md** ⭐ - Quick overview and getting started
- **SUPABASE_SETUP.md** 🎯 - Easiest database setup (recommended!)
- **INSTALLATION_CHECKLIST.md** - Step-by-step installation checklist
- **INSTALLATION.md** - Detailed installation guide
- **POSTGRESQL_FIX.md** - Local PostgreSQL troubleshooting (if not using Supabase)
- **QUICKSTART.md** - Quick reference guide

---

## 🚀 Setup Instructions

### Prerequisites

- **Python 3.10+**
- **Node.js 18+** and npm/yarn
- **Database**: Supabase (recommended) OR PostgreSQL 14+ (local)
- **Git**

### 1. Clone the Repository

```bash
git clone <repository-url>
cd sih-final
```

### 2. Backend Setup

#### 2.1 Create Python Virtual Environment

```powershell
# Windows PowerShell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1

# Or using Command Prompt
venv\Scripts\activate.bat
```

#### 2.2 Install Python Dependencies

```powershell
pip install -r requirements.txt
```

#### 2.3 Configure Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/econsultation_db"

# Groq AI API Key (get from https://console.groq.com)
GROQ_API_KEY="your_groq_api_key_here"

# Server Configuration
HOST="0.0.0.0"
PORT=8000

# CORS Origins (comma-separated)
CORS_ORIGINS="http://localhost:3000,http://localhost:3001"
```

#### 2.4 Set Up Database

```powershell
# Create PostgreSQL database
psql -U postgres
CREATE DATABASE econsultation_db;
\q

# Generate Prisma client and run migrations
prisma generate
prisma db push
```

#### 2.5 (Optional) Create Edge Cases File

Create `backend/edge_cases.txt` with example edge cases for RAG retrieval:

```
This feedback seems sarcastic despite positive wording
Mixed sentiment with both praise and criticism
Polite disagreement using respectful language
Very short ambiguous comment
...
```

#### 2.6 Start the Backend Server

```powershell
# Development mode with auto-reload
python main.py

# Or using uvicorn directly
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The backend will be available at: `http://localhost:8000`
- API Documentation: `http://localhost:8000/docs`
- Alternative Docs: `http://localhost:8000/redoc`

### 3. Frontend Setup

#### 3.1 Install Node Dependencies

```powershell
cd ../frontend
npm install

# Or using yarn
yarn install
```

#### 3.2 Configure Environment Variables

Create a `.env.local` file in the `frontend/` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

#### 3.3 Start the Development Server

```powershell
npm run dev

# Or using yarn
yarn dev
```

The frontend will be available at: `http://localhost:3000`

## 🧪 Testing the Application

### 1. Health Check

```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "modelsLoaded": {
    "sentiment": true,
    "embeddings": true
  },
  "databaseConnected": true,
  "timestamp": "2025-10-04T..."
}
```

### 2. Submit Test Feedback

Using the frontend form or via API:

```bash
curl -X POST http://localhost:8000/api/v1/feedback/ \
  -H "Content-Type: application/json" \
  -d '{
    "text": "This policy proposal is excellent and will benefit many stakeholders.",
    "language": "English"
  }'
```

### 3. View Analytics

Navigate to the frontend and observe:
- Real-time sentiment analysis
- Nuance detection badges
- Predictive risk scores
- Feedback list updates automatically

## 📦 Production Deployment

### Backend Deployment

1. **Set up production PostgreSQL database**
2. **Configure production environment variables**
3. **Use a production WSGI server**:

```bash
pip install gunicorn
gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

4. **Set up reverse proxy (Nginx)**
5. **Enable HTTPS with Let's Encrypt**

### Frontend Deployment

1. **Build the production bundle**:

```bash
npm run build
```

2. **Deploy to Vercel/Netlify** (recommended for Next.js):

```bash
# Vercel
vercel --prod

# Or build and export
npm run build
npm run start
```

3. **Update `NEXT_PUBLIC_API_URL`** to production backend URL

## 🔧 Configuration Options

### Backend Configuration

Edit `backend/main.py` to customize:
- **CORS origins**: Modify `CORS_ORIGINS` in `.env`
- **Model loading**: Update models in `utils/analysis.py`
- **API rate limiting**: Add middleware in `main.py`

### Frontend Configuration

Edit `frontend/next.config.js` for:
- Image optimization
- Environment variables
- Build configuration

## 🐛 Troubleshooting

### Common Issues

**1. Database Connection Error**
```
Solution: Verify PostgreSQL is running and DATABASE_URL is correct
psql -U postgres -d econsultation_db
```

**2. ML Models Not Loading**
```
Solution: Ensure sufficient RAM (4GB+) and install transformers correctly
pip install --upgrade transformers torch
```

**3. CORS Errors in Frontend**
```
Solution: Add frontend URL to CORS_ORIGINS in backend .env
CORS_ORIGINS="http://localhost:3000"
```

**4. Prisma Client Issues**
```
Solution: Regenerate Prisma client
cd backend
prisma generate
```

## 📊 Data Models

### Feedback Model

```prisma
model Feedback {
  id                         String   @id @default(uuid())
  text                       String
  sentiment                  String
  language                   String
  nuances                    String[]
  isSpam                     Boolean
  legalRiskScore             Int
  complianceDifficultyScore  Int
  businessGrowthScore        Int
  edgeCaseMatch              String?
  edgeCaseFlags              String[]
  legalReference             Json?
  createdAt                  DateTime @default(now())
  updatedAt                  DateTime @updatedAt
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- **NLP Models**: Hugging Face Transformers
- **UI Components**: Shadcn/UI
- **AI Integration**: Groq Cloud
- **Database**: Prisma ORM

## 📞 Support

For issues or questions:
- Open a GitHub issue
- Check `/docs` endpoint for API documentation
- Review logs in `backend/` for debugging

---

**Built with ❤️ using FastAPI, Next.js, and cutting-edge NLP technology**
