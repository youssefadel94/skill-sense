# 🚀 SkillSense - Quick Start Guide

This guide will help you get the SkillSense platform up and running.

## ✅ What's Been Scaffolded

The following components are ready to use:

### Backend (NestJS) - ✅ Complete
- ✅ Modular architecture with 6 feature modules
- ✅ Google Cloud Platform integration (Vertex AI, Firestore, Storage)
- ✅ Weaviate vector database client
- ✅ GitHub API connector
- ✅ Async job queue system
- ✅ Health check endpoints
- ✅ Docker containerization
- ✅ Cloud Run deployment scripts

### Frontend (Angular) - ⏳ Pending
- The Angular workspace structure is ready
- Components and libraries need to be created (see plans for details)

## 📋 Prerequisites

1. **Node.js 18+** installed
2. **Google Cloud Project** created
3. **Weaviate Cloud** account (free tier available)
4. **GitHub Personal Access Token** (optional, for GitHub integration)

## 🔧 Setup Instructions

### Step 1: Install Dependencies

```bash
# Install all workspace dependencies
npm install
```

### Step 2: Configure Google Cloud

```bash
# Authenticate with Google Cloud
gcloud auth login

# Set your project
gcloud config set project YOUR_PROJECT_ID

# Enable required APIs
gcloud services enable \
  run.googleapis.com \
  aiplatform.googleapis.com \
  firestore.googleapis.com \
  storage.googleapis.com

# Create Firestore database
gcloud firestore databases create --region=us-central1

# Create GCS bucket for file uploads
gsutil mb -l us-central1 gs://YOUR_BUCKET_NAME
```

### Step 3: Set Up Weaviate

1. Go to https://console.weaviate.cloud
2. Create a new cluster (free tier: sandbox)
3. Note your cluster URL (e.g., `https://skillsense-xyz.weaviate.network`)
4. Get your API key from the cluster details

### Step 4: Configure Environment Variables

```bash
cd apps/skill-sense-api
cp .env.template .env
# Edit .env with your actual values:
```

Required variables:
- `GCP_PROJECT_ID` - Your Google Cloud project ID
- `WEAVIATE_HOST` - Your Weaviate cluster URL (without https://)
- `WEAVIATE_API_KEY` - Your Weaviate API key
- `GCS_BUCKET_NAME` - Your GCS bucket name
- `GITHUB_TOKEN` - GitHub personal access token (optional)

### Step 5: Start the Backend

```bash
# From project root
npm run start:api

# Or with watch mode for development
cd apps/skill-sense-api
npm run start:dev
```

The API will start on http://localhost:3000

### Step 6: Test the API

```bash
# Health check
curl http://localhost:3000/health

# Should return:
# {"status":"ok","timestamp":"...","service":"skill-sense-api"}
```

## 🧪 Testing Endpoints

### Create a Profile
```bash
curl -X POST http://localhost:3000/profiles \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "bio": "Software Engineer"
  }'
```

### List Profiles
```bash
curl http://localhost:3000/profiles
```

### Start CV Extraction Job
```bash
curl -X POST http://localhost:3000/extraction/cv \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "fileUrl": "gs://your-bucket/resume.pdf"
  }'
```

### Check Job Status
```bash
curl http://localhost:3000/extraction/job/JOB_ID
```

### Search Skills
```bash
curl "http://localhost:3000/search/skills?q=python&limit=5"
```

## 📁 Project Structure

```
skill-sense/
├── apps/
│   └── skill-sense-api/          # Backend API
│       ├── src/
│       │   ├── shared/           # Global services
│       │   ├── modules/          # Feature modules
│       │   ├── app.module.ts
│       │   └── main.ts
│       ├── .env                  # Environment config
│       ├── Dockerfile
│       └── package.json
├── scripts/
│   ├── deploy-backend.sh         # Linux/Mac deployment
│   └── deploy-backend.bat        # Windows deployment
├── firebase.json                 # Firebase Hosting config
└── package.json                  # Workspace root
```

## 🚀 Deployment

### Deploy to Cloud Run

**Windows:**
```bash
scripts\deploy-backend.bat
```

**Linux/Mac:**
```bash
chmod +x scripts/deploy-backend.sh
./scripts/deploy-backend.sh
```

Or manually:
```bash
cd apps/skill-sense-api

# Build and deploy
gcloud run deploy skill-sense-api \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GCP_PROJECT_ID=YOUR_PROJECT_ID
```

## 🔍 Available Modules & Services

### Shared Services
- **FirestoreService** - Database operations
- **VertexAIService** - AI skill extraction & embeddings
- **WeaviateService** - Vector search
- **GcsService** - File storage
- **JobQueueService** - Async job processing

### Feature Modules
- **ProfileModule** - User profile management
- **ExtractionModule** - Skill extraction orchestration
- **ConnectorsModule** - Data source integrations
  - CV/Resume parser
  - GitHub analyzer
  - Web search connector
- **SearchModule** - Vector-based skill search
- **HealthModule** - API health monitoring

## 🎯 Next Steps

1. **Implement Vertex AI Integration**
   - Update `VertexAIService` with actual Gemini API calls
   - Add skill extraction prompts

2. **Initialize Weaviate Schema**
   - Run schema creation on startup
   - Test vector search functionality

3. **Build Frontend (Optional)**
   - Follow Angular scaffolding in `plans/03-SCAFFOLDING.md`
   - Create components for profile view, skill cards, etc.

4. **Add Authentication**
   - Integrate Firebase Auth or Google Identity Platform
   - Protect endpoints with guards

5. **Enhance Connectors**
   - Complete CV parsing with PDF support
   - Add more GitHub analysis features
   - Implement web search integration

## 📚 Documentation

For detailed information, see:
- `plans/01-ARCHITECTURE.md` - System architecture
- `plans/02-IMPLEMENTATION.md` - Implementation guide
- `plans/03-SCAFFOLDING.md` - Scaffolding commands
- `plans/04-DEPLOYMENT.md` - Deployment guide
- `SCAFFOLDING-COMPLETE.md` - What's been built

## 🐛 Troubleshooting

### Build Fails
```bash
cd apps/skill-sense-api
npm install
npm run build
```

### Port Already in Use
```bash
# Change port in .env
PORT=3001
```

### GCP Authentication Issues
```bash
gcloud auth application-default login
```

### Firestore Permission Denied
- Ensure Firestore is initialized
- Check IAM permissions for your account

## 📞 Support

For issues or questions:
1. Check the planning documents in `plans/`
2. Review API logs
3. Verify environment variables

## 🎉 Success!

If you see this when you visit http://localhost:3000/health:
```json
{
  "status": "ok",
  "timestamp": "2025-11-08T...",
  "service": "skill-sense-api"
}
```

**You're all set!** 🚀
