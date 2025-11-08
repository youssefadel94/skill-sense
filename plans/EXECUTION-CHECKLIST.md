# SkillSense - Hackathon Execution Checklist

**Use this checklist to execute the hackathon project from start to finish.**

---

## Pre-Hackathon (Do This Now)

### Documentation Review
- [ ] Read `HACKATHON-SUBMISSION.md` (5 min) - Understand the vision
- [ ] Skim `01-ARCHITECTURE.md` (10 min) - Understand system design
- [ ] Review `02-IMPLEMENTATION.md` (15 min) - Know what to build
- [ ] Test `03-SCAFFOLDING.md` script (5 min) - Ensure setup works

### GCP Setup (15 min)
- [ ] Create GCP project: `skillsense-hackathon-2025`
- [ ] Enable billing (free tier is sufficient)
- [ ] Enable APIs:
  ```bash
  gcloud services enable aiplatform.googleapis.com
  gcloud services enable firestore.googleapis.com
  gcloud services enable storage.googleapis.com
  gcloud services enable run.googleapis.com
  ```
- [ ] Create Firestore database (Native mode, us-central1)
- [ ] Create Cloud Storage bucket: `skillsense-uploads-[project-id]`

### Weaviate Setup (5 min)
- [ ] Sign up at https://console.weaviate.cloud
- [ ] Create free cluster (14-day trial)
- [ ] Copy cluster URL and API key
- [ ] Test connection: `curl https://your-cluster.weaviate.network/v1/meta`

### Firebase Setup (5 min)
- [ ] Create Firebase project (use same GCP project)
- [ ] Enable Firebase Hosting
- [ ] Install Firebase CLI: `npm install -g firebase-tools`
- [ ] Login: `firebase login`

### GitHub Setup (2 min)
- [ ] Create personal access token
- [ ] Scopes: `repo`, `read:user`
- [ ] Save token securely

**Total Time: ~45 minutes**

---

## Day 0: Scaffolding (2 hours)

### Run Automated Setup
- [ ] Navigate to project directory
- [ ] Run scaffolding script:
  ```bash
  cd plans
  bash 03-SCAFFOLDING.md  # Follow automated script section
  ```
- [ ] Verify structure:
  ```bash
  ls -la apps/skill-sense-api
  ls -la projects/skill-sense-shell
  ```

### Configure Environment
- [ ] Copy `.env.example` to `.env`
- [ ] Fill in credentials:
  ```env
  GCP_PROJECT_ID=skillsense-hackathon-2025
  GCP_LOCATION=us-central1
  GCS_BUCKET_NAME=skillsense-uploads-[project-id]
  WEAVIATE_HOST=your-cluster.weaviate.network
  WEAVIATE_API_KEY=your-weaviate-key
  GITHUB_TOKEN=your-github-token
  ```

### Test Setup
- [ ] Install dependencies: `npm install`
- [ ] Build backend: `cd apps/skill-sense-api && npm run build`
- [ ] Build frontend: `ng build skill-sense-shell`
- [ ] Run tests: `npm test`

**Checkpoint:** All builds successful, no errors

---

## Day 1: Backend (8 hours)

### Shared Module (2 hours)
Follow `02-IMPLEMENTATION.md` Day 1, Section 1

- [ ] Implement `FirestoreService` (30 min)
  - [ ] `create()`, `findById()`, `update()`, `delete()`
  - [ ] Test with Firestore emulator
- [ ] Implement `VertexAIService` (1 hour)
  - [ ] `extractTextFromPdf()`
  - [ ] `extractSkills()` with function calling
  - [ ] `generateEmbedding()`
  - [ ] Test with sample CV
- [ ] Implement `WeaviateService` (30 min)
  - [ ] `initializeSchema()`
  - [ ] `indexSkill()`
  - [ ] `searchSimilar()`
  - [ ] Test vector search

### Profile Module (1 hour)
- [ ] Create DTOs: `CreateProfileDto`, `UpdateProfileDto`
- [ ] Implement `ProfileService`
- [ ] Implement `ProfileController`
- [ ] Test CRUD operations: `POST /api/profiles`, `GET /api/profiles/:id`

### Extraction Module (3 hours)
- [ ] Implement `JobQueueService` (30 min)
  - [ ] `enqueue()`, `process()`, `updateStatus()`
- [ ] Implement `CvParserService` (1 hour)
  - [ ] Upload to GCS
  - [ ] Extract with Vertex AI
  - [ ] Parse skills
- [ ] Implement `GithubConnectorService` (1 hour)
  - [ ] Fetch repositories with Octokit
  - [ ] Analyze languages and dependencies
  - [ ] Extract skills from code
- [ ] Implement `ExtractionService` (30 min)
  - [ ] Orchestrate extraction
  - [ ] Update profile
  - [ ] Index in Weaviate

### Search Module (1 hour)
- [ ] Implement `SearchService`
- [ ] Implement `SearchController`
- [ ] Test semantic search: `GET /api/search?query=backend developer`

### Health Module (15 min)
- [ ] Implement health check endpoint
- [ ] Test: `GET /health`

### Integration Testing (45 min)
- [ ] Test full CV upload flow
- [ ] Test GitHub connection flow
- [ ] Test search functionality

**Checkpoint:** All backend endpoints working, tests passing

---

## Day 2: Frontend (8 hours)

### Libraries Setup (1 hour)
Follow `02-IMPLEMENTATION.md` Day 2

- [ ] Create `@skill-sense/data-access` library
  - [ ] `ApiService`
  - [ ] `SkillStore` (NgRx SignalStore)
- [ ] Create `@skill-sense/ui` library
  - [ ] `SkillCardComponent`
  - [ ] `SkillListComponent`
- [ ] Create `@skill-sense/feature-upload` library
  - [ ] `CvUploadComponent`
- [ ] Create `@skill-sense/feature-github` library
  - [ ] `GithubConnectComponent`

### Shell Application (2 hours)
- [ ] Set up routing
- [ ] Create main layout
- [ ] Add navigation
- [ ] Integrate libraries

### Upload Feature (2 hours)
- [ ] Implement file upload UI
- [ ] Add progress indicator
- [ ] Display extracted skills
- [ ] Add verify/reject buttons

### GitHub Feature (2 hours)
- [ ] Implement OAuth flow
- [ ] Display repositories
- [ ] Show extracted skills
- [ ] Merge with profile

### Styling (1 hour)
- [ ] Apply modern design
- [ ] Add animations
- [ ] Ensure responsive design
- [ ] Test on mobile

**Checkpoint:** Frontend working end-to-end

---

## Day 3: Integration & Demo (6 hours)

### Integration Testing (2 hours)
- [ ] Test CV upload → skill extraction → display
- [ ] Test GitHub connect → repo analysis → merge
- [ ] Test semantic search
- [ ] Test skill verification
- [ ] Fix any bugs

### Performance Optimization (1 hour)
- [ ] Add loading states
- [ ] Implement error boundaries
- [ ] Optimize bundle size
- [ ] Test with large files

### Demo Preparation (2 hours)
- [ ] Create test account
- [ ] Upload sample CVs
- [ ] Connect GitHub account
- [ ] Prepare talking points
- [ ] Record demo video (optional)

### Deployment (1 hour)
Follow `04-DEPLOYMENT.md`

- [ ] Deploy backend to Cloud Run
- [ ] Deploy frontend to Firebase Hosting
- [ ] Test production URLs
- [ ] Verify all features working

**Checkpoint:** Production deployment successful

---

## Final Checklist

### Code Quality
- [ ] All TypeScript strict mode enabled
- [ ] No console errors
- [ ] All tests passing
- [ ] Code formatted (Prettier)
- [ ] Linting clean (ESLint)

### Documentation
- [ ] README.md complete
- [ ] API documentation (Swagger)
- [ ] Code comments added
- [ ] Environment variables documented

### Demo Readiness
- [ ] Test account created
- [ ] Sample data loaded
- [ ] Demo script prepared
- [ ] Video recorded (optional)
- [ ] Slides created

### Submission
- [ ] GitHub repository public
- [ ] All code pushed
- [ ] README with setup instructions
- [ ] Live demo URL in README
- [ ] Presentation uploaded
- [ ] Submit to hackathon platform

---

## Time Breakdown

| Phase | Estimated | Actual | Notes |
|-------|-----------|--------|-------|
| Pre-hackathon setup | 45 min | | GCP, Weaviate, Firebase |
| Day 0: Scaffolding | 2 hours | | Automated script |
| Day 1: Backend | 8 hours | | 7 modules |
| Day 2: Frontend | 8 hours | | 4 libraries + shell |
| Day 3: Integration | 6 hours | | Testing + deployment |
| **Total** | **~25 hours** | | |

---

## Emergency Shortcuts

**If running out of time:**

### Must-Have Features (MVP)
- [ ] CV upload and skill extraction
- [ ] Skill display with confidence scores
- [ ] Basic search

### Nice-to-Have (Skip if needed)
- ~~GitHub integration~~
- ~~Advanced search~~
- ~~Skill verification UI~~

### Quick Wins
- Use mock data for demo
- Simplify UI (basic forms)
- Skip tests temporarily
- Use local deployment

---

## Troubleshooting

### Common Issues

**"Vertex AI quota exceeded"**
- Solution: Use free tier limits (60 requests/min)
- Workaround: Add rate limiting in code

**"Weaviate connection failed"**
- Solution: Check cluster URL and API key
- Workaround: Use in-memory array for demo

**"Firebase deploy failed"**
- Solution: Check `firebase.json` configuration
- Workaround: Deploy to Netlify/Vercel

**"Build errors"**
- Solution: Check TypeScript version compatibility
- Workaround: Disable strict mode temporarily

---

## Success Metrics

### Technical
- ✅ All endpoints working (8/8)
- ✅ No console errors
- ✅ <500ms API response time
- ✅ Tests passing (>80% coverage)

### Demo
- ✅ CV upload working
- ✅ Skills extracted correctly
- ✅ Search returning relevant results
- ✅ UI responsive and polished

### Documentation
- ✅ README clear and complete
- ✅ Setup instructions tested
- ✅ API docs available
- ✅ Code well-commented

---

## Post-Hackathon

### If You Win 🏆
- [ ] Celebrate! 🎉
- [ ] Share on social media
- [ ] Add to portfolio
- [ ] Consider building it out

### If You Don't Win
- [ ] Still add to portfolio
- [ ] Get feedback from judges
- [ ] Improve and iterate
- [ ] Try another hackathon

---

**Good luck! You've got this! 🚀**

*Remember: The goal is a working MVP, not perfection. Ship fast, iterate later.*
