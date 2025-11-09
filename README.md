# SkillSense 🧠

**AI-Powered Skill Discovery & Career Development Platform**

Automatically extract, validate, and organize professional skills from multiple sources using cutting-edge AI technology. Get personalized skill gap analysis, learning recommendations, and career insights powered by Google Vertex AI and Weaviate vector search.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Angular](https://img.shields.io/badge/Angular-20+-red)](https://angular.dev)
[![NestJS](https://img.shields.io/badge/NestJS-11+-E0234E)](https://nestjs.com)
[![Hack Nation 2025](https://img.shields.io/badge/Hack%20Nation-2025-blue)](https://hack-nation.ai)

---

## 🏆 Hack Nation 2025 Submission

**SkillSense** is built for **Hack Nation 2025**, leveraging Google Vertex AI (Gemini 2.0 Flash) to revolutionize career development through AI-powered skill intelligence.

### Submission Materials
- **📄 Project Summary:** [SUBMISSION/PROJECT_SUMMARY.md](SUBMISSION/PROJECT_SUMMARY.md)
- **📊 Technical Report:** [SUBMISSION/TECHNICAL_REPORT.md](SUBMISSION/TECHNICAL_REPORT.md)
- **🎬 Demo Video:** _(Coming soon - 60 sec demo)_
- **🛠️ Tech Video:** _(Coming soon - 60 sec walkthrough)_
- **✅ Submission Checklist:** [SUBMISSION/SUBMISSION_CHECKLIST.md](SUBMISSION/SUBMISSION_CHECKLIST.md)

### What Makes SkillSense Special
✨ **AI-First Approach** - Uses Gemini 2.0 Flash for intelligent skill extraction and career analysis  
🔍 **Vector Search** - Semantic skill matching with Weaviate for intelligent recommendations  
📊 **Data-Driven Insights** - Real market trends, gap analysis, and personalized learning paths  
🚀 **Production Ready** - Full-stack TypeScript, scalable architecture, deployed on Google Cloud

---

## 🌟 Features

### Core Capabilities

- **📄 Multi-Source Skill Extraction**
  - CV/Resume parsing (PDF, DOCX)
  - GitHub repository analysis
  - LinkedIn profile scraping
  - Web portfolio crawling

- **🤖 AI-Powered Analysis**
  - Skill gap identification for target roles
  - Personalized learning path generation
  - Career recommendations
  - Confidence scoring with evidence

- **🔍 Semantic Search**
  - Vector-based skill search using Weaviate
  - Find similar profiles
  - Discover trending skills
  - Market demand insights

- **📊 Visualization Dashboard**
  - Skills overview with categories
  - Confidence metrics
  - Learning progress tracking
  - Market trend analysis

- **💼 Career Tools**
  - Role matching with job descriptions
  - CV generation from skill profile
  - Interview preparation suggestions
  - Skill verification system

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Google Cloud Project** with enabled APIs:
  - Vertex AI API
  - Cloud Firestore API
  - Cloud Storage API
- **Weaviate Cloud** account ([Sign up](https://console.weaviate.cloud))
- **Firebase** project ([Console](https://console.firebase.google.com))

### Installation

1. **Clone the repository**:

   ```bash
   git clone https://github.com/yourusername/skill-sense.git
   cd skill-sense
   ```

2. **Install all dependencies**:

   ```bash
   npm run setup
   ```

3. **Configure environment variables**:

   ```bash
   # Backend configuration
   cp apps/skill-sense-api/.env.template apps/skill-sense-api/.env
   
   # Edit with your credentials
   # Required: GCP_PROJECT_ID, WEAVIATE_HOST, WEAVIATE_API_KEY, etc.
   ```

4. **Update Firebase config**:

   ```bash
   # Edit apps/skill-sense-shell/src/environments/environment.ts
   # Add your Firebase project credentials
   ```

### Running Locally

**Start both backend and frontend:**

```bash
npm run start:all
```

**Or start separately:**

```bash
# Backend (port 3000)
npm run start:api

# Frontend (port 4200)
npm run start:web
```

Visit `http://localhost:4200` to see the application.

---

## 📁 Project Structure

```
skill-sense/
├── apps/
│   ├── skill-sense-api/          # NestJS Backend
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── extraction/   # CV, GitHub, LinkedIn extractors
│   │   │   │   ├── profile/      # User profile management
│   │   │   │   ├── search/       # Vector search & recommendations
│   │   │   │   └── health/       # Health checks
│   │   │   └── shared/
│   │   │       └── services/     # Firestore, Vertex AI, Weaviate
│   │   └── Dockerfile
│   │
│   └── skill-sense-shell/        # Angular Frontend
│       ├── src/app/
│       │   ├── auth/             # Authentication (Login, Register)
│       │   ├── dashboard/        # Main dashboard
│       │   ├── profile/          # Profile viewing & editing
│       │   ├── upload/           # CV upload interface
│       │   ├── gaps/             # Skill gap analysis
│       │   ├── recommendations/  # AI recommendations
│       │   ├── trends/           # Market trends
│       │   ├── services/         # API & Auth services
│       │   ├── models/           # TypeScript interfaces
│       │   └── components/       # Shared UI components
│       └── public/
│
├── plans/                        # 📋 Documentation & Planning
│   ├── 01-ARCHITECTURE.md        # System architecture
│   ├── 02-IMPLEMENTATION.md      # Implementation guide
│   ├── NEXT-ACTIONS.md           # Development roadmap
│   └── guides-scaffolds/         # Code patterns & examples
│
├── scripts/                      # Deployment scripts
├── package.json                  # Monorepo root
└── README.md                     # You are here!
```

---

## 🛠️ Common Commands

```bash
# Development
npm run setup          # Install all dependencies
npm run start:api      # Start backend only
npm run start:web      # Start frontend only
npm run start:all      # Start both concurrently

# Building
npm run build          # Build both apps
npm run build:api      # Build backend only
npm run build:web      # Build frontend only

# Testing
npm run test           # Run all tests
npm run test:api       # Test backend
npm run test:web       # Test frontend

# Deployment
npm run deploy         # Deploy both to cloud
npm run deploy:api     # Deploy backend to Cloud Run
npm run deploy:web     # Deploy frontend to Firebase Hosting
```

---

## 🏗️ Architecture

### Technology Stack

**Backend:**
- **NestJS** - Enterprise Node.js framework
- **Vertex AI** - Google's AI/ML platform (Gemini models)
- **Firestore** - NoSQL database
- **Weaviate** - Vector database for semantic search
- **Cloud Storage** - File storage
- **TypeScript** - Type-safe development

**Frontend:**
- **Angular 20+** - Modern web framework with signals
- **Standalone Components** - Latest Angular architecture
- **RxJS** - Reactive programming
- **Firebase Auth** - User authentication
- **Chart.js** - Data visualization

**Infrastructure:**
- **Cloud Run** - Serverless backend hosting
- **Firebase Hosting** - Frontend CDN
- **GitHub Actions** - CI/CD (optional)

### Data Flow

```
User Upload → Cloud Storage → Vertex AI → Skills Extracted
                                    ↓
                            Firestore (Profiles)
                                    ↓
                            Weaviate (Vectors) → Semantic Search
```

---

## 📚 Documentation Navigation

### Getting Started
- **[GETTING-STARTED.md](GETTING-STARTED.md)** - Step-by-step setup guide
- **[GCP-AUTHENTICATION-SETUP.md](GCP-AUTHENTICATION-SETUP.md)** - Google Cloud setup

### Architecture & Planning
- **[plans/01-ARCHITECTURE.md](plans/01-ARCHITECTURE.md)** - Complete system architecture
- **[plans/02-IMPLEMENTATION.md](plans/02-IMPLEMENTATION.md)** - Implementation details
- **[plans/03-SCAFFOLDING.md](plans/03-SCAFFOLDING.md)** - Code scaffolding guide

### Development Guides
- **[FRONTEND-IMPLEMENTATION-PLAN.md](FRONTEND-IMPLEMENTATION-PLAN.md)** - Frontend development
- **[plans/NEXT-ACTIONS.md](plans/NEXT-ACTIONS.md)** - Roadmap & next steps
- **[plans/guides-scaffolds/](plans/guides-scaffolds/)** - Code patterns & examples

### Status & Decisions
- **[IMPLEMENTATION-STATUS.md](IMPLEMENTATION-STATUS.md)** - Current progress
- **[ARCHITECTURE-DECISION.md](ARCHITECTURE-DECISION.md)** - Key architectural choices

---

## 🎯 Key Features Explained

### 1. Skill Extraction
Upload your CV or connect your GitHub profile, and SkillSense uses Vertex AI to:
- Extract technical and soft skills
- Identify skill categories (Programming, Tools, Frameworks, etc.)
- Calculate confidence scores based on evidence
- Track skill occurrences across sources

### 2. Skill Gap Analysis
Enter your target role (e.g., "Senior DevOps Engineer"), and get:
- List of missing skills with priority levels
- Estimated learning time for each skill
- Recommended learning resources
- Personalized learning paths

### 3. Semantic Search
Powered by Weaviate vector database:
- Find profiles with similar skill sets
- Discover related skills
- Search by natural language queries
- Get context-aware results

### 4. Career Insights
- Market trend analysis
- In-demand skills tracking
- Role matching with job descriptions
- Salary insights (future feature)

---

## 🔧 Configuration

### Backend Environment Variables

Create `apps/skill-sense-api/.env`:

```env
# Google Cloud Platform
GCP_PROJECT_ID=your-project-id
GCP_LOCATION=us-central1

# Weaviate
WEAVIATE_HOST=your-cluster.weaviate.network
WEAVIATE_API_KEY=your-api-key

# Cloud Storage
GCS_BUCKET_NAME=your-bucket-name

# Optional: GitHub Integration
GITHUB_TOKEN=your-github-token

# API Configuration
PORT=3000
NODE_ENV=development
```

### Frontend Environment

Edit `apps/skill-sense-shell/src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
  firebase: {
    apiKey: 'your-api-key',
    authDomain: 'your-project.firebaseapp.com',
    projectId: 'your-project-id',
    storageBucket: 'your-project.appspot.com',
    messagingSenderId: 'your-sender-id',
    appId: 'your-app-id'
  }
};
```

---

## 🚢 Deployment

### Prerequisites
- Google Cloud CLI installed
- Firebase CLI installed (`npm install -g firebase-tools`)
- Authenticated with both services

### Backend to Cloud Run

```bash
# Deploy backend
npm run deploy:api

# Or manually:
cd apps/skill-sense-api
gcloud run deploy skill-sense-api \
  --source . \
  --region us-central1 \
  --allow-unauthenticated
```

### Frontend to Firebase Hosting

```bash
# Deploy frontend
npm run deploy:web

# Or manually:
cd apps/skill-sense-shell
npm run build
firebase deploy --only hosting
```

---

## 🧪 Development Workflow

### Testing with Mock Data
The frontend includes mock data for testing without the backend:
- All components work standalone
- Mock profiles, skills, and analytics
- Great for UI/UX development

### Connecting to Backend
1. Ensure backend is running (`npm run start:api`)
2. Check `environment.ts` has correct `apiUrl`
3. Verify Firebase authentication is configured
4. Test health endpoint: `http://localhost:3000/health`

### Adding New Features
1. Check `plans/NEXT-ACTIONS.md` for roadmap
2. Follow patterns in `plans/guides-scaffolds/`
3. Use existing components as templates
4. Update models in `apps/skill-sense-shell/src/app/models/`

---

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Follow existing code patterns
4. Add tests for new features
5. Submit a pull request

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

---

## 🆘 Troubleshooting

### Build Errors
```bash
# Clean install
rm -rf node_modules apps/*/node_modules
npm run setup
```

### Port Already in Use
```bash
# Kill process on port 3000 (backend)
npx kill-port 3000

# Kill process on port 4200 (frontend)
npx kill-port 4200
```

### GCP Authentication Issues
```bash
# Re-authenticate
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

### Firestore Permission Denied
- Ensure Firestore is initialized in GCP Console
- Check IAM permissions for your service account
- Verify Firestore rules allow authenticated access

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/skill-sense/issues)
- **Documentation**: Check `plans/` directory
- **Questions**: Create a discussion on GitHub

---

## 🎓 Learn More

- [Angular Documentation](https://angular.dev)
- [NestJS Documentation](https://docs.nestjs.com)
- [Vertex AI Documentation](https://cloud.google.com/vertex-ai/docs)
- [Weaviate Documentation](https://weaviate.io/developers/weaviate)

---

**Built with ❤️ using TypeScript, Angular, NestJS, and Google Cloud AI**

