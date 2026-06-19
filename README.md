# 🌿 CarbonWise AI

> **Track Today. Predict Tomorrow. Reduce Forever.**

A production-ready, full-stack AI-powered sustainability platform that helps users calculate, track, predict, and reduce their carbon footprint using Artificial Intelligence, data analytics, forecasting, sustainability scoring, and personalized recommendations.

---

## 🚀 Live Demo

- **Frontend**: Firebase Hosting → `https://your-project.web.app`
- **Backend API**: Google Cloud Run → `https://carbonwise-api-xxxx-uc.a.run.app`

---

## ✨ Features

| Feature | Description |
|---|---|
| 🧮 Carbon Calculator | 4-step wizard for Transport, Energy, Food & Lifestyle |
| 📊 Analytics Dashboard | Charts, trends, emission breakdown |
| 🤖 AI Recommendations | Gemini AI personalized tips & weekly plans |
| 💬 AI Carbon Coach | Real-time chatbot powered by Gemini |
| 🔮 AI Predictions | Weighted average + Gemini insights forecasting |
| 🎯 Reduction Goals | Create, track & manage emission goals |
| 🏆 Eco Challenges | Complete challenges & earn eco points |
| 🥇 Leaderboard | Weekly/monthly/all-time rankings |
| 📋 PDF Reports | Generate & download sustainability reports |
| 👤 User Profiles | Badges, eco points, sustainability score |
| 🔐 Authentication | Firebase Auth with Google & Email/Password |

---

## 🛠️ Tech Stack

### Frontend
- **React 18** + Vite
- **Tailwind CSS** (dark theme)
- **Framer Motion** (animations)
- **Recharts** (data visualization)
- **React Hook Form** (forms)
- **React Router DOM v6**
- **Firebase SDK** (auth)

### Backend
- **Node.js** + Express.js
- **MongoDB Atlas** + Mongoose
- **Firebase Admin SDK** (token verification)
- **Google Gemini AI** (`gemini-1.5-flash`)
- **Winston** (logging)
- **Helmet** + CORS + Rate limiting

### Deployment
- **Frontend**: Firebase Hosting
- **Backend**: Google Cloud Run (Docker)
- **Database**: MongoDB Atlas

---

## 📁 Project Structure

```
CarbonWise AI/
├── frontend/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── navigation/     # Sidebar, TopBar, MobileNav
│   │   │   └── ui/             # StatCard, ScoreGauge, Modal, etc.
│   │   ├── context/            # AuthContext
│   │   ├── firebase/           # Firebase config
│   │   ├── hooks/
│   │   ├── layouts/            # AuthLayout, DashboardLayout
│   │   ├── pages/
│   │   │   ├── auth/           # Login, Register, ForgotPassword
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Calculator.jsx
│   │   │   ├── History.jsx
│   │   │   ├── Predictions.jsx
│   │   │   ├── Goals.jsx
│   │   │   ├── Challenges.jsx
│   │   │   ├── AICoach.jsx
│   │   │   ├── Leaderboard.jsx
│   │   │   ├── Reports.jsx
│   │   │   └── Profile.jsx
│   │   ├── routes/             # ProtectedRoute
│   │   ├── services/           # API service layer
│   │   └── utils/              # Helpers, constants
│   ├── firebase.json
│   └── .firebaserc
│
└── backend/
    ├── src/
    │   ├── config/             # database.js, firebase.js
    │   ├── controllers/        # 8 controllers
    │   ├── middleware/         # auth, errorHandler, rateLimiter
    │   ├── models/             # 6 Mongoose models
    │   ├── routes/             # 8 route files
    │   ├── utils/              # logger, carbonCalculator, forecastEngine
    │   ├── app.js
    │   └── server.js
    ├── Dockerfile
    └── cloudrun.yaml
```

---

## ⚙️ Environment Variables

### Frontend (`frontend/.env`)
```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_API_URL=http://localhost:5000/api
```

### Backend (`backend/.env`)
```env
PORT=5000
MONGODB_URI=mongodb+srv://...
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=
GEMINI_API_KEY=
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

---

## 🔧 Local Development Setup

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Firebase project
- Google Gemini API key

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/carbonwise-ai.git
cd carbonwise-ai
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Fill in all environment variables
npm run dev
```
Backend runs at `http://localhost:5000`
Health check: `http://localhost:5000/health`

### 3. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
# Fill in Firebase config values
npm run dev
```
Frontend runs at `http://localhost:5173`

---

## 🔥 Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Enable **Authentication** → Sign-in methods:
   - Email/Password ✅
   - Google ✅
4. Go to **Project Settings** → **General** → Copy web app config to `frontend/.env`
5. Go to **Project Settings** → **Service Accounts** → Generate new private key
6. Use the JSON values for `FIREBASE_PROJECT_ID`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL` in `backend/.env`

---

## 🍃 MongoDB Atlas Setup

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a free M0 cluster
3. Create a database user with read/write permissions
4. Add your IP to the IP Access List (or `0.0.0.0/0` for Cloud Run)
5. Get the connection string and set `MONGODB_URI` in `backend/.env`
6. Replace `<username>`, `<password>`, and set database name to `carbonwise`

---

## 🤖 Gemini API Setup

1. Go to [Google AI Studio](https://aistudio.google.com)
2. Create an API key
3. Set `GEMINI_API_KEY` in `backend/.env`
4. The app uses `gemini-1.5-flash` model (free tier available)

---

## 🚀 Deployment

### Frontend → Firebase Hosting

```bash
cd frontend

# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize (select Hosting, use existing project)
firebase init hosting
# Public directory: dist
# Single-page app: Yes
# GitHub deploys: No

# Build
npm run build

# Deploy
firebase deploy --only hosting
```

Update `frontend/.firebaserc` with your project ID.

---

### Backend → Google Cloud Run

**Prerequisites**: Google Cloud SDK installed and authenticated

```bash
cd backend

# Set your project
gcloud config set project YOUR_PROJECT_ID

# Enable required APIs
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

# Build and push Docker image
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/carbonwise-api

# Create secrets in Secret Manager
echo -n "your-mongodb-uri" | gcloud secrets create mongodb-uri --data-file=-
echo -n "your-gemini-key" | gcloud secrets create gemini-api-key --data-file=-
echo -n "your-firebase-project" | gcloud secrets create firebase-project-id --data-file=-
# ... repeat for firebase-private-key and firebase-client-email

# Deploy to Cloud Run
gcloud run deploy carbonwise-api \
  --image gcr.io/YOUR_PROJECT_ID/carbonwise-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 5000 \
  --memory 512Mi \
  --set-env-vars NODE_ENV=production \
  --set-env-vars FRONTEND_URL=https://your-project.web.app
```

After deployment, update `VITE_API_URL` in your Firebase hosting environment with the Cloud Run URL, then redeploy the frontend.

---

## 🌐 API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Register/sync user |
| POST | `/api/auth/login` | Yes | Login user |
| GET | `/api/auth/profile` | Yes | Get user profile |
| PUT | `/api/auth/profile` | Yes | Update profile |
| POST | `/api/carbon/calculate` | Yes | Calculate emissions |
| POST | `/api/carbon/save` | Yes | Save carbon record |
| GET | `/api/carbon/history` | Yes | Get history |
| GET | `/api/carbon/stats` | Yes | Get statistics |
| POST | `/api/goals` | Yes | Create goal |
| GET | `/api/goals` | Yes | Get all goals |
| PUT | `/api/goals/:id` | Yes | Update goal |
| DELETE | `/api/goals/:id` | Yes | Delete goal |
| GET | `/api/challenges` | Yes | Get challenges |
| POST | `/api/challenges/complete` | Yes | Complete challenge |
| POST | `/api/ai/recommendations` | Yes | Get AI tips |
| POST | `/api/ai/chat` | Yes | AI coach chat |
| POST | `/api/predictions/generate` | Yes | Generate forecast |
| GET | `/api/predictions/latest` | Yes | Get latest prediction |
| POST | `/api/reports/generate` | Yes | Generate report |
| GET | `/api/reports` | Yes | Get all reports |
| GET | `/api/leaderboard` | Yes | Get leaderboard |
| GET | `/health` | No | Health check |

---

## 📊 MongoDB Collections

- **users** - User profiles, eco points, badges
- **carbonrecords** - Individual emission calculations
- **goals** - Carbon reduction goals
- **challenges** - Eco challenges (seeded on startup)
- **predictions** - AI forecast data
- **reports** - Generated report data

---

## 🔒 Security Features

- Firebase Authentication token verification on every protected route
- Helmet.js HTTP security headers
- Rate limiting (general: 100/15min, AI: 10/min, auth: 20/15min)
- CORS whitelist for known origins
- Input validation on all endpoints
- Environment variables for all secrets

---

## 🎯 Emission Calculation Logic

| Category | Factor |
|---|---|
| Car (Petrol) | 0.21 kg CO₂/km |
| Car (Electric) | 0.05 kg CO₂/km |
| Bus | 0.089 kg CO₂/km |
| Train | 0.041 kg CO₂/km |
| Electricity (India) | 0.82 kg CO₂/kWh |
| Vegan Diet | 1.5 kg CO₂/day |
| Mixed Diet | 4.0 kg CO₂/day |
| Meat Heavy | 7.0 kg CO₂/day |

**Sustainability Score**: Inversely proportional to total monthly emission (0–100 scale).

---

## 🏗️ AI Prediction Algorithm

**MVP Weighted Average:**
```
Predicted Emission = (Last Month × 0.5) + (Previous × 0.3) + (Third × 0.2)
```

**Trend Analysis**: Calculates % change between recent months to determine increasing/decreasing/stable trend.

**Gemini AI Insights**: Real-time natural language insights based on forecast data.

---

## 👥 Team / Author

Built for the Hackathon 2026 — *CarbonWise AI*

---

## 📄 License

MIT License — feel free to use and modify for your projects.

---

*Track Today. Predict Tomorrow. Reduce Forever.* 🌍
