# SkillSense - Architecture & Design

**Version:** 1.0  
**Date:** November 8, 2025

## Executive Summary

SkillSense is an AI-powered skill discovery platform that automatically extracts, validates, and organizes professional skills from multiple sources. The system uses Vertex AI agents for extraction, Weaviate for semantic search, and provides evidence-based profiles with confidence scoring.

---

## System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Firebase Hosting                         │
│                  (Angular 17+ Frontend)                      │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS
┌────────────────────────▼────────────────────────────────────┐
│                    Cloud Run (NestJS API)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Extraction  │  │  Connectors  │  │    Search    │      │
│  │   Module     │  │    Module    │  │    Module    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────┬────────────────┬────────────────┬──────────────────┘
         │                │                │
    ┌────▼────┐      ┌────▼────┐     ┌────▼────┐
    │ Vertex  │      │   GCS   │     │Weaviate │
    │   AI    │      │ Storage │     │  Cloud  │
    └─────────┘      └─────────┘     └─────────┘
         │
    ┌────▼────┐
    │Firestore│
    │   DB    │
    └─────────┘
```

---

## Technology Stack

### Backend (NestJS)

**Framework**: NestJS 10+ with TypeScript strict mode

**Key Libraries**:
- `@nestjs/common`, `@nestjs/core` - Core framework
- `@google-cloud/vertixAI` - Vertex AI SDK
- `@google-cloud/storage` - GCS for file storage
- `@google-cloud/firestore` - Database
- `weaviate-ts-client` - Vector database client
- `class-validator`, `class-transformer` - DTO validation
- `@octokit/rest` - GitHub API client

**Architecture Pattern**: Modular monolith with feature modules

### Frontend (Angular)

**Framework**: Angular 17+ with standalone components

**Key Libraries**:
- `@angular/material` - UI components
- `@ngrx/signals` - State management (SignalStore)
- `@angular/fire` - Firebase integration
- `rxjs` - Reactive programming

**Architecture Pattern**: Modular libraries with public APIs

### Infrastructure

| Service | Purpose | Rationale |
|---------|---------|-----------|
| **Cloud Run** | Backend hosting | Serverless, auto-scaling, cost-effective |
| **Firebase Hosting** | Frontend hosting | CDN, SSL, free tier |
| **Vertex AI** | AI/ML models | Gemini Pro Vision, embeddings, function calling |
| **Weaviate Cloud** | Vector database | 5-min setup, semantic search, hybrid queries |
| **Firestore** | Primary database | Real-time, scalable, simple queries |
| **Cloud Storage** | File storage | CV uploads, temporary files |

---

## Data Models

### Core Entities

#### Profile
```typescript
interface Profile {
  id: string;                    // UUID
  userId: string;                // Firebase Auth UID
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  sources: SourceConnection[];   // Connected data sources
  skills: Skill[];               // Extracted skills
  status: 'active' | 'processing' | 'error';
}
```

#### Skill
```typescript
interface Skill {
  id: string;
  profileId: string;
  name: string;                  // e.g., "TypeScript"
  category: string;              // e.g., "Programming Language"
  confidence: number;            // 0.0 - 1.0
  verified: boolean;             // User confirmed
  evidence: Evidence[];          // Supporting evidence
  firstSeenAt: Date;
  lastSeenAt: Date;
  occurrences: number;           // How many times found
}
```

#### Evidence
```typescript
interface Evidence {
  id: string;
  skillId: string;
  source: 'CV' | 'GITHUB' | 'WEB';
  sourceUrl?: string;            // GitHub repo URL, web page
  documentId?: string;           // GCS file path
  snippet: string;               // Text excerpt showing skill
  context: string;               // Surrounding context
  extractedAt: Date;
  confidence: number;
}
```

#### SourceConnection
```typescript
interface SourceConnection {
  type: 'CV' | 'GITHUB' | 'WEB';
  status: 'connected' | 'processing' | 'error';
  connectedAt: Date;
  lastSyncAt?: Date;
  metadata: {
    // CV: { filename, fileSize, fileUrl }
    // GitHub: { username, repoCount }
    // Web: { urls[] }
  };
}
```

#### Job
```typescript
interface Job {
  id: string;
  profileId: string;
  type: 'extraction' | 'indexing';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  source: 'CV' | 'GITHUB' | 'WEB';
  createdAt: Date;
  updatedAt: Date;
  result?: {
    skillsFound: number;
    evidenceCount: number;
  };
  error?: string;
}
```

---

## API Design

### REST Endpoints

#### Profile Management
```http
POST   /api/profiles              # Create profile
GET    /api/profiles/:id          # Get profile
PATCH  /api/profiles/:id          # Update profile
DELETE /api/profiles/:id          # Delete profile
```

#### Extraction
```http
POST   /api/extract/cv            # Upload CV for extraction
POST   /api/extract/github        # Connect GitHub account
POST   /api/extract/web           # Analyze web presence
GET    /api/jobs/:jobId           # Get extraction job status
```

#### Skills
```http
GET    /api/profiles/:id/skills   # List all skills
PATCH  /api/skills/:id/verify     # Verify/reject skill
DELETE /api/skills/:id             # Remove skill
GET    /api/skills/:id/evidence   # Get skill evidence
```

#### Search
```http
POST   /api/search/skills         # Semantic skill search
POST   /api/search/profiles       # Find profiles by skills
```

### Request/Response Examples

#### Extract from CV
```typescript
// POST /api/extract/cv
Request:
{
  profileId: "uuid",
  file: <multipart/form-data>
}

Response:
{
  jobId: "uuid",
  status: "processing",
  estimatedTime: "2-3 minutes"
}
```

#### Get Extraction Status
```typescript
// GET /api/jobs/:jobId
Response:
{
  id: "uuid",
  status: "completed",
  result: {
    skillsFound: 15,
    evidenceCount: 47,
    skills: [
      {
        name: "TypeScript",
        confidence: 0.95,
        occurrences: 8
      }
    ]
  }
}
```

---

## Module Architecture

### Backend Structure

```
apps/skill-sense-api/
  src/
    main.ts                        # Bootstrap
    app.module.ts                  # Root module
    
    shared/
      shared.module.ts              # @Global() module
      services/
        firestore.service.ts        # Database access
        vertex-ai.service.ts        # AI/ML operations
        weaviate.service.ts         # Vector search
        gcs.service.ts              # File storage
        job-queue.service.ts        # Job management
    
    modules/
      profile/
        profile.module.ts
        profile.controller.ts
        profile.service.ts
        dto/
          create-profile.dto.ts
          update-profile.dto.ts
      
      extraction/
        extraction.module.ts
        extraction.controller.ts
        extraction.service.ts
        orchestrator.service.ts     # Parallel agent execution
        dto/
          extract-cv.dto.ts
          extract-github.dto.ts
      
      connectors/
        connectors.module.ts
        cv/
          cv-parser.service.ts      # Gemini Vision PDF parsing
        github/
          github-connector.service.ts  # GitHub API
        web/
          web-search.service.ts     # Google Custom Search
      
      search/
        search.module.ts
        search.controller.ts
        vector-search.service.ts    # Weaviate queries
      
      health/
        health.module.ts
        health.controller.ts
```

### Frontend Structure

```
projects/
  skill-sense-shell/               # Main application
    src/
      main.ts
      app.routes.ts                 # Standalone routing
      app.component.ts
  
  skill-sense-core/                # Core domain
    src/
      lib/
        models/
          profile.model.ts
          skill.model.ts
          evidence.model.ts
        services/
          api.service.ts            # HTTP client
          skill.service.ts
        stores/
          skill.store.ts            # NgRx SignalStore
      public-api.ts
  
  skill-sense-ui/                  # Shared components
    src/
      lib/
        skill-card/
          skill-card.component.ts   # Standalone component
        evidence-viewer/
          evidence-viewer.component.ts
        confidence-badge/
          confidence-badge.component.ts
        loading-spinner/
          loading-spinner.component.ts
      public-api.ts
  
  skill-sense-profile/             # Profile feature
    src/
      lib/
        profile-view/
          profile-view.component.ts
        skill-list/
          skill-list.component.ts
        skill-detail/
          skill-detail.component.ts
      public-api.ts
  
  skill-sense-sources/             # Source connectors
    src/
      lib/
        cv-upload/
          cv-upload.component.ts
        github-connect/
          github-connect.component.ts
        web-analyze/
          web-analyze.component.ts
      public-api.ts
```

---

## AI/ML Architecture

### Vertex AI Integration

#### 1. CV Parsing (Gemini Pro Vision)
```typescript
// Extract text and structure from PDF/DOCX
const model = 'gemini-pro-vision';
const prompt = `
  Extract professional skills from this CV.
  For each skill, provide:
  - Skill name
  - Category (language, framework, tool, soft skill)
  - Context (where it was mentioned)
  - Confidence (0.0-1.0)
`;
```

#### 2. Skill Extraction (Gemini Pro)
```typescript
// Extract skills from text with function calling
const functionDeclaration = {
  name: 'extractSkills',
  parameters: {
    type: 'OBJECT',
    properties: {
      skills: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            name: { type: 'STRING' },
            category: { type: 'STRING' },
            confidence: { type: 'NUMBER' }
          }
        }
      }
    }
  }
};
```

#### 3. Embeddings (text-embedding-gecko)
```typescript
// Generate embeddings for semantic search
const embedding = await vertexAI.generateEmbedding({
  text: 'TypeScript React Node.js',
  model: 'text-embedding-gecko@003'
});
// Store in Weaviate for vector search
```

### Weaviate Schema

```typescript
{
  class: 'Skill',
  properties: [
    { name: 'name', dataType: ['string'] },
    { name: 'category', dataType: ['string'] },
    { name: 'profileId', dataType: ['string'] },
    { name: 'confidence', dataType: ['number'] },
    { name: 'verified', dataType: ['boolean'] }
  ],
  vectorizer: 'none',  // We provide embeddings from Vertex AI
  vectorIndexConfig: {
    distance: 'cosine'
  }
}
```

---

## Security & Privacy

### Authentication
- Firebase Auth (email/password)
- JWT tokens for API authentication
- Role-based access control (RBAC)

### Data Protection
- User owns their profile data
- Explicit consent for each source connection
- Data deletion on user request
- No sharing of raw CV data

### API Security
- CORS configured for Firebase Hosting domain
- Rate limiting (100 req/min per user)
- Input validation on all endpoints
- Sanitization of user-provided content

---

## Scalability Considerations

### Performance Targets
- CV extraction: < 3 minutes
- GitHub analysis: < 5 minutes
- Search queries: < 500ms
- UI interactions: < 100ms

### Scaling Strategy
- **Cloud Run**: Auto-scales 0-100 instances
- **Firestore**: Sharded by profileId
- **Weaviate**: Horizontal scaling with WCS
- **Caching**: In-memory cache for frequent queries

### Cost Optimization
- Cloud Run: Pay per request
- Firestore: Optimize queries, use caching
- Vertex AI: Batch API calls, cache embeddings
- Weaviate: Start with smallest tier ($25/mo)

---

## Monitoring & Observability

### Metrics
- API latency (p50, p95, p99)
- Extraction success rate
- Skill extraction accuracy
- User verification rate (accepted vs rejected skills)

### Logging
- Structured JSON logs to Cloud Logging
- Request tracing with correlation IDs
- Error tracking with stack traces

### Alerts
- API error rate > 5%
- Extraction job failures > 10%
- Response time > 2s

---

## Development Workflow

### Code Quality
- TypeScript strict mode
- ESLint + Prettier
- Pre-commit hooks (lint, test)
- 100% type coverage

### Testing Strategy
- Unit tests: 80% coverage target
- Integration tests: API endpoints
- E2E tests: Critical user flows
- Manual testing: UI/UX validation

### Deployment
- Backend: `gcloud run deploy` from `apps/skill-sense-api`
- Frontend: `firebase deploy --only hosting`
- Environment: Dev → Staging → Production

---

## Success Criteria

### MVP Requirements (Day 3)
- ✅ User can upload CV and see extracted skills
- ✅ User can connect GitHub and see code-based skills
- ✅ User can verify/reject extracted skills
- ✅ User can search profiles by skills
- ✅ Evidence viewer shows skill sources
- ✅ Confidence scores displayed
- ✅ Deployed and accessible via public URL

### Production Readiness
- ✅ Comprehensive error handling
- ✅ Input validation
- ✅ Security best practices
- ✅ Performance optimization
- ✅ Monitoring and logging
- ✅ Documentation complete

---

## Future Enhancements

### Phase 2 (Post-Hackathon)
- LinkedIn integration
- Skill gap analysis
- Learning recommendations
- Team skill mapping
- Job matching
- API for third-party integrations

### Phase 3 (Scale)
- Multi-language support
- Custom skill taxonomies
- Enterprise features (SSO, audit logs)
- Mobile apps (iOS/Android)
- Advanced analytics dashboard

---

**Architecture Complete** ✅

This architecture balances simplicity for rapid development with production-ready patterns for scalability and maintainability.
