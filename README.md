# VoteFlow

> **India's mobile-first civic web app** — helping first-time voters determine eligibility and next steps in seconds.

Built with React (Vite PWA) · Node.js (Express) · Firebase Auth + Firestore · Google Cloud Run

---

## 📁 Project Structure

```
VoteFlow/
├── frontend/          # React + Vite (PWA)
│   ├── src/
│   │   ├── screens/       # LanguageScreen, FormScreen, ResultScreen
│   │   ├── components/    # Header, TrustFooter
│   │   ├── context/       # AppContext (global state)
│   │   ├── constants/     # india.js (states, cities, strings)
│   │   ├── firebase.js    # Firebase Anonymous Auth
│   │   ├── api.js         # Axios API client (auto JWT inject)
│   │   ├── App.jsx        # Screen state machine
│   │   └── index.css      # Full design system
│   └── vite.config.js
│
├── backend/           # Express API
│   ├── server.js          # /evaluate  /polling-booth  /health
│   ├── seed.js            # One-time Firestore population script
│   ├── deploy.sh          # One-command Cloud Run deployment
│   ├── .env.example       
│   └── package.json       
│
└── Dockerfile         # Cloud Run container
```

---

## ⚙️ Setup

### 1. Firebase Project

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Anonymous Authentication** → Authentication → Sign-in Providers
3. Create a **Firestore** database in Native mode
4. Download a **Service Account key** (Project Settings → Service Accounts → Generate new private key)
   → Save as `backend/serviceAccountKey.json`

### 2. Firestore Collections

Create these collections manually or via the Firebase console:

#### `polling_booths`
```json
{
  "name": "Government High School, Andheri East",
  "address": "Marol Maroshi Road, Andheri East, Mumbai 400059",
  "constituency": "Andheri East Assembly",
  "state": "Maharashtra",
  "city": "Mumbai",
  "last_updated": "2025-01-01"
}
```

#### `data_confidence`
```json
{
  "state": "Maharashtra",
  "city": "Mumbai",
  "status": "SAFE",
  "total_score": 92,
  "last_updated": "2025-01-01"
}
```
> Set `status: "BLOCKED"` to trigger `LOW_CONFIDENCE` response for any city.

### 3. Firestore Security Rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Backend only reads — no direct client writes allowed
    match /polling_booths/{id} {
      allow read: if false;
      allow write: if false;
    }
    match /data_confidence/{id} {
      allow read: if false;
      allow write: if false;
    }
    // Evaluation logs: backend writes via Admin SDK (bypasses rules)
    match /evaluations/{id} {
      allow read: if false;
      allow write: if false;
    }
  }
}
```

---

## 🖥️ Local Development

### Backend

```bash
cd backend
cp .env.example .env
# Fill in FIREBASE_PROJECT_ID and set GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
npm start
# Runs on http://localhost:8080
```

Test endpoints:
```bash
# Health check (no auth required)
curl http://localhost:8080/health

# Evaluate (requires Firebase Bearer token)
curl -X POST http://localhost:8080/evaluate \
  -H "Authorization: Bearer <FIREBASE_ID_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"age":22,"state":"Maharashtra","city":"Thane","hasVoterId":"no","recentlyMoved":false}'

# Polling booth
curl "http://localhost:8080/polling-booth?state=Maharashtra&city=Thane" \
  -H "Authorization: Bearer <FIREBASE_ID_TOKEN>"
```

### Frontend

```bash
cd frontend
cp .env.example .env
# Fill in VITE_FIREBASE_* values from Firebase console
# Set VITE_BACKEND_URL=http://localhost:8080
npm run dev
# Opens http://localhost:5173
```

---

## 🐳 Deploy to Cloud Run (Unified Full-Stack)

### Prerequisites
```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
gcloud services enable run.googleapis.com containerregistry.googleapis.com
```

### Build & Push Docker Image

```bash
# Run from the root of the project
# This builds both the Vite frontend and Express backend into a single container
docker build -t gcr.io/YOUR_PROJECT_ID/voteflow:latest .
docker push gcr.io/YOUR_PROJECT_ID/voteflow:latest
```

### Deploy to Cloud Run

```bash
gcloud run deploy voteflow \
  --image gcr.io/YOUR_PROJECT_ID/voteflow:latest \
  --platform managed \
  --region asia-south1 \
  --port 8080 \
  --allow-unauthenticated \
  --set-env-vars "FIREBASE_PROJECT_ID=YOUR_PROJECT_ID" \
  --set-secrets "FIREBASE_SERVICE_ACCOUNT_JSON=voteflow-sa-key:latest"
```

> **Secret Manager**: Store your service account JSON in Google Secret Manager:
> ```bash
> gcloud secrets create voteflow-sa-key --data-file=serviceAccountKey.json
> ```

### Get your Live URL

```bash
gcloud run services describe voteflow \
  --region asia-south1 \
  --format "value(status.url)"
```

Visit this URL in your browser to use the full VoteFlow app!

---

## 🔐 API Response Examples

### POST /evaluate

**Request:**
```json
{ "age": 22, "state": "Maharashtra", "city": "Thane", "hasVoterId": "no", "recentlyMoved": false }
```

**Response:**
```json
{
  "status": "ELIGIBLE_NOT_REGISTERED",
  "message": "You are eligible to vote but are not yet registered...",
  "next_actions": ["Visit voters.eci.gov.in to register online (Form 6)", "..."],
  "required_steps": ["Aadhaar Card / Passport...", "..."],
  "last_updated": "2025-05-01T09:00:00.000Z",
  "source": "Election Commission of India"
}
```

### GET /polling-booth?state=Maharashtra&city=Thane

**Success:**
```json
{
  "status": "FOUND",
  "booth": {
    "booth_id": "abc123",
    "name": "Government School, Thane West",
    "address": "Station Road, Thane West, 400601",
    "constituency": "Thane Assembly",
    "state": "Maharashtra",
    "city": "Thane",
    "last_updated": "2025-01-01"
  }
}
```

**Low confidence:**
```json
{
  "status": "LOW_CONFIDENCE",
  "message": "Polling data is currently unavailable for this location.",
  "fallback_url": "https://eci.gov.in"
}
```

---

## 📱 App Flows

| Flow | Screen | Description |
|------|--------|-------------|
| 1 | Language | 10 Indian languages, stored to localStorage |
| 2 | Form | 4-step — Age → State/City → Voter ID → Moved |
| 3 | Result | Status banner + next steps + required docs |
| 4 | Booth | Booth name/address/constituency + Maps link |

### Status States

| Status | Trigger |
|--------|---------|
| `UNDERAGE` | age < 18 |
| `ELIGIBLE_NOT_REGISTERED` | age ≥ 18 + no voter ID (or not_sure) |
| `REGISTERED_MOVED` | has voter ID + recently moved |
| `REGISTERED_VALID` | has voter ID + same address |

---

## 🔒 Security Notes

- All Firestore reads are **server-side only** (Admin SDK bypasses rules)
- Client **cannot write** to Firestore directly
- Every API request requires a **valid Firebase JWT** (Anonymous Auth)
- Rate limited to **60 req / 15 min per IP**
- No PII is stored — only anonymized `uid`, `state`, `city`, `status`
