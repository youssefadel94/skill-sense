# SkillSense 🚀

**AI-Powered Skill Intelligence Platform for Career Growth**

[![Hack Nation 2025](https://img.shields.io/badge/Hack%20Nation-2025-blue)](https://hack-nation.ai)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org/)

> Automatically extract, analyze, and optimize your professional skills using Google Vertex AI. Connect GitHub, LinkedIn, and upload CVs to build a comprehensive skill profile with AI-powered career insights.

[🎥 Demo Video](#) • [📄 Technical Report](./SUBMISSION/TECHNICAL_REPORT.md) • [🌐 Live Demo](#)

---

## 🎯 What is SkillSense?

SkillSense is an intelligent career platform that solves the fragmentation problem in skill management. Instead of manually maintaining multiple profiles and resumes, SkillSense:

- 🔗 **Connects** your GitHub repos, LinkedIn profile, and uploaded CVs
- 🤖 **Extracts** skills automatically using Google Vertex AI (Gemini 2.0 Flash)
- 📊 **Analyzes** proficiency levels, skill gaps, and market trends
- 📝 **Generates** dynamic, role-targeted resumes with AI
- 🎓 **Recommends** personalized learning paths based on career goals
- 🔍 **Discovers** similar professionals through semantic skill search

---

## ✨ Key Features

### 🔌 Multi-Source Integration
- **GitHub:** Analyzes repositories, commits, and code to extract technical skills
- **LinkedIn:** Parses profile data, experience, and endorsements
- **CV Upload:** Processes PDF/DOCX files with multimodal AI

### 🧠 AI-Powered Analysis
- **Skill Extraction:** Context-aware identification with evidence citations
- **Proficiency Estimation:** Beginner → Expert classification based on usage patterns
- **Confidence Scoring:** 0.0-1.0 reliability metrics for each skill
- **Category Mapping:** Automatic classification into 20+ skill categories

### 📈 Career Intelligence
- **Skill Gap Analysis:** Compare your skills against target roles
- **Learning Paths:** AI-generated step-by-step skill development plans
- **Market Trends:** Real-time insights on skill demand and growth
- **Role Matching:** Find jobs that align with your skill profile

### 📄 Smart CV Generation
- **AI Content Creation:** Professional summaries and achievement statements
- **Role Optimization:** Emphasize skills relevant to target positions
- **Multiple Templates:** Modern, Classic, Creative, Minimal designs
- **Export Options:** PDF, DOCX, HTML formats (coming soon)

### 🔍 Vector-Powered Search
- **Semantic Search:** Find skills beyond exact keyword matches
- **Similar Profiles:** Discover professionals with complementary skills
- **Skill Discovery:** Explore related competencies you should learn

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Angular Frontend                         │
│  Dashboard • CV Generator • Trends • Recommendations         │
└─────────────────────┬───────────────────────────────────────┘
                      │ REST API
┌─────────────────────▼───────────────────────────────────────┐
│                   NestJS Backend API                         │
│  ┌──────────────┐  ┌───────────────┐  ┌─────────────────┐  │
│  │   Profile    │  │  Extraction   │  │   Vertex AI     │  │
│  │   Service    │  │   Service     │  │   Integration   │  │
│  └──────────────┘  └───────────────┘  └─────────────────┘  │
│  ┌──────────────┐  ┌───────────────┐  ┌─────────────────┐  │
│  │ Connectors:  │  │   Firestore   │  │    Weaviate     │  │
│  │ GitHub       │  │   Service     │  │  Vector Search  │  │
│  │ LinkedIn     │  │               │  │                 │  │
│  │ CV Parser    │  │               │  │                 │  │
│  └──────────────┘  └───────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **Firebase Project** (Firestore + Authentication)
- **Google Cloud Project** (Vertex AI enabled)
- **Weaviate Instance** (cloud or self-hosted)
- **GitHub Token** (for repo analysis)
- **LinkedIn OAuth** (optional, for profile integration)

### Installation

```bash
# Clone the repository
git clone https://github.com/youssefadel94/skill-sense.git
cd skill-sense/skill-sense

# Install dependencies
npm install

# Set up environment variables
cp skill-sense/apps/skill-sense-api/.env.example skill-sense/apps/skill-sense-api/.env
cp skill-sense/apps/skill-sense-shell/src/environments/environment.ts.template skill-sense/apps/skill-sense-shell/src/environments/environment.ts

# Edit .env and environment.ts with your credentials
```

### Configuration

**Backend (.env):**
```env
GCP_PROJECT_ID=your-gcp-project-id
GCP_LOCATION=us-central1
FIREBASE_PROJECT_ID=your-firebase-project
FIRESTORE_COLLECTION=profiles
WEAVIATE_HOST=http://localhost:8080
WEAVIATE_API_KEY=your-weaviate-key
GITHUB_TOKEN=ghp_your_github_token
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-secret
```

**Frontend (environment.ts):**
```typescript
export const environment = {
  production: false,
  firebase: {
    apiKey: 'your-firebase-api-key',
    authDomain: 'your-project.firebaseapp.com',
    projectId: 'your-project-id',
    storageBucket: 'your-project.appspot.com',
    messagingSenderId: '123456789',
    appId: 'your-app-id'
  },
  apiUrl: 'http://localhost:3000'
};
```

### Run the Application

```bash
# Terminal 1: Start the backend API
npm run start:api
# API runs on http://localhost:3000

# Terminal 2: Start the frontend
npm run start:shell
# App runs on http://localhost:4200
```

### Access the App

1. Open http://localhost:4200
2. Sign up / Log in with Firebase Auth
3. Connect your GitHub account
4. Upload a CV or connect LinkedIn
5. Explore your skill profile, trends, and recommendations!

---

## 🛠️ Tech Stack

### Frontend
- **Angular 17** - Standalone components with signals
- **Chart.js** - Data visualization
- **RxJS** - Reactive programming
- **Firebase Auth** - User authentication
- **TypeScript** - Type safety

### Backend
- **NestJS** - Modular Node.js framework
- **TypeScript** - Type-safe server code
- **Swagger** - API documentation
- **Class-validator** - DTO validation

### AI & ML
- **Google Vertex AI** - Gemini 2.0 Flash for skill extraction
- **Weaviate** - Vector database for semantic search
- **Custom Prompts** - Engineered for skill analysis

### Data & Storage
- **Firestore** - NoSQL database for profiles, CVs, recommendations
- **Google Cloud Storage** - CV file storage
- **Firebase Authentication** - Secure user management

### DevOps
- **NX Workspace** - Monorepo tooling
- **ESLint & Prettier** - Code quality
- **Git** - Version control

---

## 📁 Project Structure

```
skill-sense/
├── skill-sense/
│   ├── apps/
│   │   ├── skill-sense-api/          # NestJS Backend
│   │   │   ├── src/
│   │   │   │   ├── modules/
│   │   │   │   │   ├── profile/      # Profile management
│   │   │   │   │   ├── extraction/   # Skill extraction pipeline
│   │   │   │   │   ├── connectors/   # GitHub, LinkedIn, CV
│   │   │   │   │   ├── search/       # Vector search
│   │   │   │   │   └── health/       # Health checks
│   │   │   │   └── shared/
│   │   │   │       └── services/
│   │   │   │           ├── vertex-ai.service.ts
│   │   │   │           ├── firestore.service.ts
│   │   │   │           └── weaviate.service.ts
│   │   │   └── .env
│   │   │
│   │   └── skill-sense-shell/        # Angular Frontend
│   │       ├── src/
│   │       │   ├── app/
│   │       │   │   ├── dashboard/    # Main dashboard
│   │       │   │   ├── profile/      # User profile
│   │       │   │   ├── cv-generator/ # CV creation
│   │       │   │   ├── trends/       # Skill trends
│   │       │   │   ├── gaps/         # Skill gap analysis
│   │       │   │   ├── recommendations/
│   │       │   │   ├── learning-paths/
│   │       │   │   ├── integrations/ # Connect sources
│   │       │   │   └── services/
│   │       │   │       ├── api.service.ts
│   │       │   │       └── auth.service.ts
│   │       │   └── environments/
│   │       │       └── environment.ts
│   │
│   ├── plans/                         # Documentation
│   │   ├── ARCHITECTURE.md
│   │   ├── IMPLEMENTATION.md
│   │   └── guides-scaffolds/
│   │
│   └── SUBMISSION/                    # Hack Nation materials
│       ├── PROJECT_SUMMARY.md
│       ├── TECHNICAL_REPORT.md
│       └── SUBMISSION_CHECKLIST.md
│
└── README.md (this file)
```

---

## 🎬 Usage Examples

### 1. Extract Skills from GitHub
```typescript
// Connect GitHub repository
POST /api/extraction/github
{
  "userId": "user123",
  "repoUrl": "https://github.com/username/awesome-project"
}

// Response: Job ID for async processing
{ "jobId": "job-xyz-123", "status": "processing" }

// Check status
GET /api/extraction/jobs/job-xyz-123

// Skills automatically added to profile
```

### 2. Analyze Skill Gaps
```typescript
// Get skill gaps for target role
GET /api/profiles/user123/skill-gaps?targetRole=Senior Frontend Developer

// Response
{
  "gaps": [
    {
      "skill": "Next.js",
      "priority": "high",
      "reason": "Required for 80% of Senior Frontend roles"
    },
    {
      "skill": "TypeScript",
      "priority": "medium",
      "reason": "Strongly preferred in modern development"
    }
  ],
  "matchPercentage": 72
}
```

### 3. Generate AI-Powered CV
```typescript
// Generate role-targeted resume
POST /api/profiles/user123/cv/generate
{
  "template": "modern",
  "format": "pdf",
  "targetRole": "Full Stack Developer",
  "emphasisCategories": ["Frontend", "Backend", "Cloud"]
}

// Response: CV with AI-generated content
{
  "id": "cv-123",
  "content": "<html>...</html>",
  "downloadUrl": "..."
}
```

---

## 🧪 Testing

```bash
# Run backend tests
npm run test:api

# Run frontend tests
npm run test:shell

# E2E tests
npm run e2e

# Coverage report
npm run test:coverage
```

---

## 🚢 Deployment

### Backend (Google Cloud Run)
```bash
# Build Docker image
docker build -t skill-sense-api ./apps/skill-sense-api

# Deploy to Cloud Run
gcloud run deploy skill-sense-api \
  --image gcr.io/YOUR_PROJECT/skill-sense-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### Frontend (Firebase Hosting)
```bash
# Build for production
npm run build:shell

# Deploy to Firebase
firebase deploy --only hosting
```

---

## 🗺️ Roadmap

- [x] Multi-source skill extraction (GitHub, LinkedIn, CV)
- [x] AI-powered analysis with Vertex AI
- [x] Vector search with Weaviate
- [x] Dynamic CV generation
- [x] Skill gap analysis
- [x] Learning path recommendations
- [ ] Full LinkedIn OAuth integration
- [ ] PDF export for generated CVs
- [ ] Job board API integration
- [ ] Skill endorsement system
- [ ] Team/organization analytics
- [ ] Mobile app (React Native)
- [ ] Chrome extension for quick skill capture
- [ ] Skill badges and gamification

---

## 🤝 Contributing

This project was built for Hack Nation 2025. Contributions, issues, and feature requests are welcome!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Hack Nation 2025** for the opportunity to build this project
- **Google Cloud Platform** for Vertex AI and infrastructure
- **Weaviate** for vector search capabilities
- **NestJS & Angular Teams** for excellent frameworks
- **Open Source Community** for foundational libraries

---

## 📧 Contact

**Developer:** Youssef Adel  
**GitHub:** [@youssefadel94](https://github.com/youssefadel94)  
**Project Link:** [https://github.com/youssefadel94/skill-sense](https://github.com/youssefadel94/skill-sense)

---

## 🏆 Hack Nation 2025

Built with ❤️ for **Hack Nation 2025** - Empowering careers through AI

[🌐 Project Submission](https://projects.hack-nation.ai) • [📋 Google Form](https://tinyurl.com/HN-Submission)

---

**⭐ If you find SkillSense useful, please consider starring the repository!**
