# SkillSense — Hackathon Plan

Date: 2025-11-08

## Tech Stack Decisions (Confirmed)

- **Backend**: NestJS on Cloud Run (TypeScript, modular architecture)
- **Frontend**: Angular 17+ on Firebase Hosting (standalone components, NgRx SignalStore)
- **AI/ML**: Vertex AI (Gemini Pro Vision, text-embedding-gecko, gemini-pro with function calling)
- **Vector DB**: Weaviate Cloud Service (5-min setup, no GKE)
- **Primary DB**: Firestore (simplified - no Postgres/Redis for hackathon)
- **Queue**: Simple Firestore-based job queue (~50 lines)
- **Monorepo**: npm/yarn workspaces (not Nx for speed)
- **Cloud**: Full Google Cloud stack
- **Architecture Patterns**: Based on monorepo patterns (see `PATTERNS-EXECUTABLE.md`)

---

## Short Summary

Create a single-repo monorepo containing:
- A NestJS backend (API + AI/agent orchestration) deployed to Cloud Run
- An Angular frontend (following this repo's architecture) hosted on Firebase Hosting

We will reuse patterns from `cloud-run/video/video-processing-service` as a Nest reference and align Angular conventions to the repo's main frontend (use existing tsconfig, lint rules, style patterns). Firebase + Google Cloud services will be used for Auth, hosting, and infrastructure.

---

## Goals for the Hackathon (MVP)

- Ingest multiple structured/semi-structured sources using AI agents (CV, GitHub, LinkedIn, blogs, internal docs)
- Run NLP to extract explicit and implicit skills; build structured profiles with confidence scores and evidence trails
- Provide Angular UI to explore skill profiles, edit/remove hallucinations, and request skill-based matches
- Expose APIs and admin UI to run batch ingestion, view logs, and evidence trails
- Enable interactive skill gap analysis and personalized learning recommendations

---

## High-Level Architecture

### 1. Monorepo Layout 

```
/
├── apps/
│   └── skill-sense-api/       # NestJS backend (Cloud Run)
│       ├── src/
│       │   ├── main.ts
│       │   ├── app.module.ts
│       │   ├── shared/
│       │   │   ├── shared.module.ts      # @Global() infrastructure services
│       │   │   └── services/
│       │   │       ├── firestore.service.ts
│       │   │       ├── vertex-ai.service.ts
│       │   │       ├── weaviate.service.ts
│       │   │       └── job-queue.service.ts
│       │   └── modules/
│       │       ├── profile/
│       │       ├── extraction/
│       │       ├── connectors/
│       │       └── search/
├── projects/                  # Angular libraries 
│   ├── skill-sense-shell/     # Main app (Firebase Hosting)
│   ├── skill-sense-core/      # Models, services, stores
│   │   └── src/
│   │       ├── lib/
│   │       │   ├── models/
│   │       │   ├── services/
│   │       │   └── stores/
│   │       └── public-api.ts
│   ├── skill-sense-ui/        # Shared components (standalone)
│   ├── skill-sense-profile/   # Profile feature
│   └── skill-sense-sources/   # Source connectors UI
├── firebase.json
├── package.json               # npm workspaces
└── README.md
```

### 2. Components

#### Frontend (Angular - Standalone Components Pattern)

- **Authentication**: Firebase Auth + login flow
- **Profile Explorer**: Skill profile view, evidence list, edit/confirm skills
  - Components: `<app-skill-card>`, `<app-evidence-viewer>`, `<app-confidence-badge>`
  - State: NgRx SignalStore for skill profile state
- **Ingestion UI**: Upload CVs, link GitHub, trigger extractions
  - Components: `<app-cv-upload>`, `<app-github-connect>`
- **Search UI**: Query skills, show matches
- **Admin Dashboard**: View jobs, logs, evidence audit

**Pattern**: All components standalone, import from library `public-api.ts`, RxJS-first services

#### Backend (NestJS - Modular Pattern)

- **Shared Module** (@Global()): Firestore, Vertex AI, Weaviate services (auto-injected everywhere)
- **Profile Module**: CRUD for profiles, skills, evidence
- **Extraction Module**: Orchestrate CV/GitHub/Web parsing, skill extraction
- **Connector Module**: CV parser (Gemini Vision), GitHub API, Web search
- **Search Module**: Weaviate vector search, skill matching
- **Health Module**: Health checks, readiness probes

**Pattern**: Thin controllers (HTTP), thick services (logic), DTO validation, simple job queue

#### Data & AI Infrastructure

- **Primary Store**: Firestore (profiles, skills, evidence, jobs)
- **Vector DB**: Weaviate Cloud Service (embeddings, semantic search)
- **AI**: Vertex AI (Gemini Pro Vision for CVs, gemini-pro for extraction)
- **Queue**: Simple Firestore-based job queue (~50 lines)
- **Hosting**: Cloud Run (backend), Firebase Hosting (frontend)

**Reference**: See `PATTERNS-EXECUTABLE.md` for all implementation patterns

---

## Detailed Plan Sections

### 1) Project Scaffolding (Day 0 - 2 hours)


```bash
# Root package.json with npm workspaces
npm init -y
npm install -D @angular/cli @nestjs/cli typescript

# NestJS backend (apps/skill-sense-api)
nest new skill-sense-api --skip-git
mv skill-sense-api apps/

# Angular libraries (projects/)
ng generate library skill-sense-shell --project-root=projects/skill-sense-shell
ng generate library skill-sense-core --project-root=projects/skill-sense-core
ng generate library skill-sense-ui --project-root=projects/skill-sense-ui
ng generate library skill-sense-profile --project-root=projects/skill-sense-profile
ng generate library skill-sense-sources --project-root=projects/skill-sense-sources
```

**Create shared module structure:**

```typescript
// apps/skill-sense-api/src/shared/shared.module.ts
@Global()
@Module({
  providers: [FirestoreService, VertexAIService, WeaviateService, JobQueueService],
  exports: [FirestoreService, VertexAIService, WeaviateService, JobQueueService],
})
export class SharedModule {}
```

**Create public APIs:**

```typescript
// projects/skill-sense-core/src/public-api.ts
export * from './lib/models/skill.model';
export * from './lib/models/evidence.model';
export * from './lib/services/skill.service';
export * from './lib/stores/skill.store';
```

**Initialize workspace scripts:**

```json
{
  "scripts": {
    "build:api": "cd apps/skill-sense-api && npm run build",
    "build:web": "ng build skill-sense-shell",
    "start:api": "cd apps/skill-sense-api && npm run start:dev",
    "start:web": "ng serve skill-sense-shell",
    "deploy:api": "gcloud run deploy skill-sense-api --source apps/skill-sense-api",
    "deploy:web": "firebase deploy --only hosting"
  }
}
```

**Skip**: Terraform (manual gcloud for hackathon speed - see HACKATHON-OPTIMIZATION.md)
- Set up Firebase project and hosting config

### 2) Backend (Nest) Design and API Contract (Day 1)

**API Contract (Sketch):**

**Ingestion APIs**
- `POST /api/ingest`
  - body: `{ sourceType: 'cv'|'github'|'linkedin'|'blog'|'doc'|'agent-search', payload: {...} }`
  - returns: `{ jobId }`
- `GET /api/ingest/{jobId}/status`
  - returns: `{ jobId, status, progress, errors }`

**Profile APIs**
- `GET /api/profiles/{personId}`
  - returns: `{ personId, skills: [{ name, confidence, evidenceIds }], metadata }`
- `POST /api/profiles/{personId}/skills/verify`
  - body: `{ skillId, action: 'confirm'|'remove'|'edit', comment }`
- `GET /api/profiles/{personId}/evidence`
  - returns: `[{ id, sourceType, snippet, confidence }]`

**Skill Analysis APIs**
- `POST /api/skills/analyze`
  - body: `{ text }` 
  - returns: `{ skills: [{ name, confidence, evidenceSnippets }] }`
- `POST /api/skills/search`
  - body: `{ query, filters }` 
  - returns: `{ results: [{ personId, skills, matchScore }] }`

**Agent APIs**
- `POST /api/agents/search`
  - body: `{ personId, sources: ['github', 'linkedin', 'blog', 'publications'] }`
  - returns: `{ jobId }` (triggers async multi-source agent search)

**Backend Implementation Notes:**
- Use DTOs and validation with `class-validator`
- Use Nest modules per responsibility: `IngestModule`, `NlpModule`, `ProfileModule`, `AuthModule`, `AiModule`, `AgentModule`
- Queue long-running jobs (ingestion, embedding, agent searches) with Cloud Tasks
- Integrate `QueueManager` pattern from `cloud-run/video` reference

### 3) AI Pipeline (Day 1-2)

**Pipeline Flow:**
```
Ingest → Normalize → Chunk → Embed (Vertex AI) → Index (Weaviate) → RAG Extraction → Store Evidence
```

**Vertex AI Integration:**
- Use `@google-cloud/aiplatform` SDK
- Embeddings: `text-embedding-gecko@latest` (768 dimensions)
- LLM: `gemini-pro` or `text-bison` for skill extraction and reasoning
- Agent coordination: use Vertex AI Agent Builder for orchestrating multi-source searches

**Weaviate Setup:**
- Deploy Weaviate on GKE or use Weaviate Cloud Service (WCS)
- Schema: `Skill`, `Evidence`, `Person` classes with vector properties
- Hybrid search: combine vector similarity + BM25 keyword search
- Multi-tenancy: use tenant isolation for user data privacy

**Hallucination Mitigation:**
- Keep evidence links for every skill (source, text snippet, document ID, timestamp)
- Present confidence scores (0-1) and original text to users for verification
- Provide edit/confirm step in UI for humans to prune hallucinations
- Log all LLM responses with prompt/response pairs for audit

### 4) Data Connectors & AI Agent Search (Day 2)

**This section is expanded to include AI agent-based search across all sources.**

#### 4.1 CV Parser Connector
- **Input**: PDF, DOCX, TXT uploads to Cloud Storage
- **Tools**: 
  - **Google Document AI** (Form Parser / Custom Processor) for structured extraction
  - **Gemini Pro Vision** for native PDF/DOCX processing (multimodal input via Cloud Storage URIs)
  - No need for `pdf-parse` or `mammoth` - use native GCP services
- **Agent capability**: Extract structured sections (education, experience, skills, certifications)
- **Workflow**:
  1. Upload file to Cloud Storage bucket
  2. Send Cloud Storage URI to Document AI or Gemini
  3. Extract text + structured data (tables, sections)
  4. Parse with Vertex AI for skill extraction
- **Output**: Normalized JSON with evidence snippets

#### 4.2 GitHub Connector & Agent
- **API**: GitHub REST/GraphQL API
- **Agent tasks**:
  - Search user's public repos, starred repos, contributions
  - Extract: README files, package.json/requirements.txt (tech stack), commit messages, PR descriptions, issues created/commented
  - Analyze code languages, frameworks used (from repo topics and file analysis)
  - Identify contributions: commits count, PR review activity, issue resolution patterns
- **Skills extracted**: Programming languages, frameworks, DevOps tools, collaboration patterns
- **Evidence**: Repo URLs, commit SHAs, code snippets, README excerpts

#### 4.3 LinkedIn Connector & Agent
- **Input**: LinkedIn export (ZIP file) or manual profile scraping (public profiles only)
- **Agent tasks**:
  - Parse: work experience, education, certifications, endorsements, recommendations
  - Extract skills from job descriptions and project summaries
  - Identify implicit skills (leadership from "managed team of X", "led project")
- **Privacy note**: LinkedIn API is restricted; use user-provided exports or public profiles
- **Evidence**: Position titles, date ranges, endorsement counts, recommendation text

#### 4.4 Blog & Publication Connector & Agent
- **Input**: Personal blog URLs, Medium profiles, Dev.to, Substack
- **Agent tasks**:
  - Crawl and scrape blog posts (with user consent)
  - Use Google Custom Search API to find articles authored by user
  - Extract topics, technologies mentioned, writing frequency
  - Analyze depth of technical content (beginner vs expert level)
- **Skills extracted**: Technical writing, subject matter expertise, thought leadership
- **Evidence**: Article URLs, publication dates, excerpt snippets

#### 4.5 Academic Publications Connector & Agent
- **Input**: Google Scholar profile, ORCID, ResearchGate
- **Agent tasks**:
  - Fetch publications using Google Scholar API or web scraping
  - Extract: paper titles, abstracts, keywords, citation counts
  - Identify research domains and methodologies
- **Skills extracted**: Research skills, domain expertise, academic impact
- **Evidence**: Paper titles, DOIs, citation metrics

#### 4.6 Company Internal Documents Connector & Agent
- **Input**: Performance reviews, goal documents, reference letters, project docs (PDFs, DOCX)
- **Agent tasks**:
  - Parse documents using Google Document AI (OCR + NLP)
  - Extract: achievements, goals met, manager feedback, project outcomes
  - Identify soft skills (leadership, communication, teamwork) from feedback text
- **Privacy**: Require explicit consent and data retention policies
- **Evidence**: Document names, excerpt snippets, upload timestamps

#### 4.7 Social Media Connector & Agent (Optional)
- **Input**: Twitter/X, Instagram (if public and relevant)
- **Agent tasks**:
  - Analyze public posts for professional content (tech talks, tutorials, community engagement)
  - Extract hashtags, topics, engagement metrics
- **Skills extracted**: Community building, public speaking (if mentions talks/conferences)
- **Evidence**: Post URLs, dates, engagement stats

#### 4.8 AI Agent Orchestration Strategy

**Multi-Source Agent Workflow:**
1. User initiates ingestion and selects sources (e.g., CV + GitHub + LinkedIn + Blog)
2. Backend creates a Cloud Task for each source connector
3. Each connector agent:
   - Authenticates/fetches data from source
   - Extracts raw text and metadata
   - Sends to NLP module for skill extraction
   - Generates embeddings via Vertex AI
   - Stores evidence in Firestore + vectors in Weaviate
4. Aggregation agent:
   - Merges skills from all sources
   - Deduplicates and resolves conflicts (e.g., same skill from multiple sources → higher confidence)
   - Generates final skill profile with evidence trails
5. User reviews profile in UI, confirms/edits skills

**Agent Tools & Libraries:**
- **Vertex AI Agent Builder** (primary): Orchestrate multi-step workflows with built-in reasoning engine
- **Vertex AI Extensions**: Define custom tools for external API calls (GitHub, Scholar, etc.)
- **Google Custom Search API**: Discover public profiles/articles with built-in grounding
- **Gemini Function Calling**: Let LLM decide which tools to invoke based on context
- **Cloud Functions/Cloud Run**: Host extension endpoints for complex logic
- **Puppeteer/Playwright** (fallback): Web scraping only if APIs unavailable

**Agent Search Implementation (Google-Native):**

**Method 1: Vertex AI Agent Builder + Data Stores + Extensions**
```typescript
// Create agent with Vertex AI Agent Builder
// Agent automatically:
// 1. Grounds responses with Google Search
// 2. Queries Firestore data stores
// 3. Calls extensions (GitHub, LinkedIn connectors)
// 4. Decides search strategy based on available sources
```

**Method 2: Gemini with Function Calling**
```typescript
// Define tools/functions agent can call
const tools = [
  { name: 'search_github', description: 'Search GitHub repos and commits for user' },
  { name: 'search_google_scholar', description: 'Find academic publications' },
  { name: 'search_web', description: 'Search the web using Custom Search API' },
  { name: 'fetch_linkedin_data', description: 'Parse LinkedIn export' }
];

// Gemini decides which tools to use
const response = await gemini.generateContent({
  model: 'gemini-pro',
  contents: [{
    role: 'user',
    parts: [{ text: 'Find all technical skills for username X from GitHub, blogs, and publications' }]
  }],
  tools: tools,  // Gemini will call appropriate functions
  toolConfig: { functionCallingConfig: { mode: 'AUTO' } }
});

// Agent executes selected tools, aggregates results
```

**Search Flow Example:**
1. User requests: "Ingest skills from GitHub + blogs"
2. Vertex AI Agent Builder receives request
3. Agent uses **Extensions** to:
   - Call GitHub API (via custom extension)
   - Use **Google Custom Search API** to find user's blog posts
   - Use **Document AI** to parse any uploaded PDFs
4. Agent extracts skills using **Gemini** with evidence grounding
5. Results stored in Weaviate + Firestore with evidence links

**Privacy & Consent:**
- Consent UI: User explicitly selects which sources to scan
- Data minimization: Only extract relevant skill-related data
- Retention policy: Auto-delete raw data after processing (keep only evidence snippets)
- User control: API to delete all data and embeddings (`DELETE /api/profiles/{personId}/data`)

### 5) Frontend (Angular) — UX & Structure (Day 2)

- **Architecture**: Follow main Angular patterns in this repo (check `projects/` and `src/`)
- **Key Pages**:
  - **Dashboard**: Overview of skill profile, recent ingestion jobs
  - **Profile Viewer**: Skills list with confidence scores, evidence drawer
  - **Ingest Page**: Upload CV, connect GitHub/LinkedIn, trigger agent searches
  - **Matches Page**: Search jobs or people, view skill-based matches
  - **Admin**: View jobs/logs, manage evidence, audit trails
- **State Management**: Service-based state + RxJS (NgRx optional for hackathon speed)
- **UI Library**: Angular Material or reuse existing UI components from this repo

### 6) Deployment & Google Cloud Setup (Day 3)

**Infrastructure (Terraform/gcloud):**
- **Cloud Run**: Deploy Nest API container
- **Firebase Hosting**: Host Angular static app
- **Firestore**: Primary datastore (profiles, evidence)
- **Cloud SQL (Postgres)**: Audit logs, relational queries
- **Weaviate**: Deploy on GKE or use WCS
- **Memorystore (Redis)**: Cache and session storage
- **Cloud Tasks**: Async job queue
- **Vertex AI**: Enable APIs, set up service accounts

**CI/CD:**
- GitHub Actions:
  - Lint, test on PR
  - Build Docker image for Nest API
  - Deploy to Cloud Run on merge to main
  - Build Angular app and deploy to Firebase Hosting

**Environment Variables:**
- Use Secret Manager for API keys, DB credentials
- `.env` files for local dev

### 7) Privacy, Consent & Governance

- **Consent UX**: At ingestion time, user selects sources and grants permissions
- **Data minimization**: Only store skill-relevant snippets (not entire documents)
- **Retention policy**: Configurable TTL for raw data
- **Deletion endpoints**: `DELETE /api/profiles/{personId}/data` (hard delete)
- **Access controls**: Firebase Auth + custom claims (admin, user, reviewer roles)
- **Audit logs**: Track all profile edits, deletions, ingestion jobs (store in Cloud SQL)

---

## Improvements and Repo-Specific Suggestions

- **Nx adoption**: Consider migrating to Nx for better monorepo DX (generators, caching, task orchestration)
- **Shared types**: Use `libs/domain` to avoid duplicate DTOs between frontend and backend
- **Testing**:
  - Unit tests for NLP extractors (Jest)
  - E2E flow: upload CV → produce skills (Playwright/Cypress)
  - Load tests for Cloud Run API (k6 or Locust)
- **Sample data**: Add synthetic CVs, GitHub repos, LinkedIn exports in `/tools/sample-data`
- **Observability**:
  - Structured logging (Winston + Cloud Logging)
  - Error tracking (Sentry or Cloud Error Reporting)
  - Tracing (Cloud Trace)
  - Evidence audit trail viewer in admin UI

---

## Hackathon Roadmap & Timeboxed Milestones

**Day 0 (Setup):**
- ✅ Scaffold monorepo, apps, and CI skeleton
- ✅ Set up GCP project, enable APIs (Vertex AI, Firestore, Cloud Run)
- ✅ Wire up Firebase Auth for dev
- ✅ Deploy Weaviate (GKE or WCS)

**Day 1 (Ingest + NLP):**
- ✅ Implement CV parser connector
- ✅ Implement GitHub connector and agent
- ✅ Build simple skill extractor using Vertex AI (prompt-based)
- ✅ Persist profiles in Firestore
- ✅ Store embeddings in Weaviate

**Day 2 (Agents + UI):**
- ✅ Implement LinkedIn, blog, publication connectors
- ✅ Build agent orchestration workflow (multi-source)
- ✅ Angular UI: Profile Viewer, Ingest page, Evidence drawer
- ✅ Add human-in-loop verification UI (confirm/edit skills)

**Day 3 (Matching + Polish):**
- ✅ Implement job-person matching API (vector similarity search)
- ✅ Add privacy controls and data deletion endpoints
- ✅ Admin dashboard: view logs, jobs, audit trails
- ✅ Prepare demo presentation and slide deck

---

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Data source availability | Use synthetic data and small sample datasets for hackathon |
| Cost of Vertex AI/Weaviate | Use small models for prototyping; monitor quotas; switch to bigger models only for final demo |
| LLM hallucinations | Provide human-in-loop verification; show evidence snippets clearly; log all LLM responses |
| LinkedIn API restrictions | Use user-provided exports or simulated data |
| Time constraints | Focus on 1-2 connectors for MVP (CV + GitHub); add more if time permits |
| Weaviate deployment complexity | Use Weaviate Cloud Service (WCS) for faster setup |

---

## Next Steps

1. ✅ **Tech stack confirmed**: Vertex AI, Weaviate, Cloud Run, npm/yarn workspaces
2. 🚀 **Next**: Create implementation guide markdown (`plans/implementation-guide.md`)
3. 🚀 **Next**: Scaffold monorepo structure (`apps/`, `libs/`, workspace config)
4. 🚀 **Next**: Set up GCP infrastructure (Terraform or gcloud scripts)

---

## References & Useful Paths in This Repo

- **Nest reference**: `cloud-run/video/video-processing-service` (service and queue patterns)
- **Angular architecture**: `projects/` (multiple Angular apps) and `src/` (main app patterns)
- **Firebase config**: `firebase.json`, `functions/` (Cloud Functions examples)
- **Build tools**: `angular.json`, `package.json`, `tsconfig.*.json`

---

## Appendix: Minimal Data Shapes

### Person
```typescript
{
  id: string;
  name?: string;
  email?: string;
  profileIds?: string[]; // versioned profile ids
  createdAt: Date;
  updatedAt: Date;
}
```

### Skill
```typescript
{
  id: string;
  personId: string;
  name: string;
  category?: string; // e.g., 'programming', 'soft-skill', 'tool'
  confidence: number; // 0-1
  evidenceIds: string[];
  confirmedByUser: boolean;
  createdAt: Date;
}
```

### Evidence
```typescript
{
  id: string;
  personId: string;
  sourceType: 'cv' | 'github' | 'linkedin' | 'blog' | 'publication' | 'doc';
  sourceId: string; // file id, repo url, article url, etc.
  snippet: string; // text excerpt
  metadata?: Record<string, any>; // e.g., commit SHA, article date
  embeddingId?: string; // Weaviate object ID
  confidence: number;
  createdAt: Date;
}
```

### JobPosting
```typescript
{
  id: string;
  title: string;
  description: string;
  requiredSkills: string[];
  preferredSkills: string[];
  embeddingId?: string;
  createdAt: Date;
}
```

---

## Contact / Questions

Ready to proceed with implementation guide and scaffolding. Let me know if you want to adjust any part of this plan before moving forward.
