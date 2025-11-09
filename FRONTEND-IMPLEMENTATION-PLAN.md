# 🎨 Frontend Implementation Plan

## Phase 1: Firebase Authentication (1-2 hours)

### Dependencies to Install
```bash
cd apps/skill-sense-shell
npm install firebase @angular/fire
```

### Firebase Setup
1. Create Firebase project (if not exists): https://console.firebase.google.com
2. Enable Email/Password authentication
3. Get Firebase config (Web app credentials)
4. Create `environment.ts` with Firebase config

### Components to Create
- `auth/login.component.ts` - Email/password login
- `auth/register.component.ts` - User registration
- `auth/auth.guard.ts` - Route protection
- `auth/auth.service.ts` - Firebase Auth service

### Integration with Backend
- Pass Firebase ID token to NestJS
- Verify token in NestJS middleware
- Use Firebase UID as userId in all API calls

---

## Phase 2: Core Frontend Components (2-3 hours)

### 1. Dashboard Component
**File:** `src/app/dashboard/dashboard.component.ts`

**Features:**
- Display user profile
- Show skill count
- Quick stats (gaps, recommendations)
- Navigation to other features

### 2. Upload CV Component
**File:** `src/app/upload/upload-cv.component.ts`

**Features:**
- File upload (PDF/DOCX)
- Progress indicator
- Call `/extraction/cv` endpoint
- Display extracted skills

### 3. Profile Component
**File:** `src/app/profile/profile.component.ts`

**Features:**
- Display user info
- List all skills with categories
- Edit profile
- Delete profile

### 4. Skill Gap Analysis Component
**File:** `src/app/analysis/skill-gaps.component.ts`

**Features:**
- Input target role
- Call `/profiles/:id/skill-gaps` endpoint
- Display gaps with priority
- Show learning time estimates

### 5. Recommendations Component
**File:** `src/app/recommendations/recommendations.component.ts`

**Features:**
- Call `/profiles/:id/recommendations` endpoint
- Display recommended skills
- Show relevance scores
- Export to CSV

### 6. Trends Component
**File:** `src/app/trends/trends.component.ts`

**Features:**
- Call `/profiles/trends` endpoint
- Display trending skills chart
- Top categories visualization
- Market insights

---

## Phase 3: AI Features Integration (2-3 hours)

### Backend: Add New AI Endpoints

#### 1. CV Generation
**Endpoint:** `POST /ai/generate-cv`
**Body:** `{ userId, targetRole, style }`
**Response:** Generated CV in markdown/HTML

#### 2. Role Matching
**Endpoint:** `POST /ai/match-role`
**Body:** `{ userId, jobDescription }`
**Response:** Match score, missing skills, strengths

#### 3. Learning Path
**Endpoint:** `GET /ai/learning-path/:userId?targetRole=...`
**Response:** Step-by-step learning roadmap

#### 4. Interview Prep
**Endpoint:** `GET /ai/interview-prep/:userId?targetRole=...`
**Response:** AI-generated interview questions

### Frontend: New Components

#### CV Generator Component
**File:** `src/app/ai/cv-generator.component.ts`
- Select target role
- Choose CV style
- Generate and preview
- Download as PDF

#### Role Matcher Component
**File:** `src/app/ai/role-matcher.component.ts`
- Paste job description
- Get match score
- See skill gaps
- Get improvement suggestions

#### Learning Path Component
**File:** `src/app/ai/learning-path.component.ts`
- Select target role
- Display roadmap timeline
- Track progress
- Recommended resources

#### Interview Prep Component
**File:** `src/app/ai/interview-prep.component.ts`
- Select target role
- Get AI questions
- Practice mode
- Save answers

---

## Phase 4: Styling & UX (1-2 hours)

### UI Library Options
**Choice 1:** Angular Material (Recommended)
```bash
ng add @angular/material
```

**Choice 2:** Tailwind CSS (Modern)
```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init
```

### Design System
- Primary color: Blue (#3B82F6)
- Secondary color: Purple (#8B5CF6)
- Success: Green (#10B981)
- Warning: Orange (#F59E0B)
- Error: Red (#EF4444)

### Key Screens
1. **Landing Page** - Hero, features, CTA
2. **Dashboard** - Overview with cards
3. **Skills Page** - Interactive skill list
4. **AI Features** - Clean, focused interfaces
5. **Settings** - Profile management

---

## Phase 5: Data Visualization (1-2 hours)

### Charts Library
**Install Chart.js:**
```bash
npm install chart.js
```

### Chart Components (Already Available)

#### 1. SimpleChartComponent
**File:** `src/app/components/simple-chart.component.ts`

```typescript
import { Component, Input, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartType, registerables } from 'chart.js';
import { ChartData, createBarChartConfig, createPieChartConfig, createLineChartConfig } from '../utils/chart-data.util';

Chart.register(...registerables);

@Component({
  selector: 'app-simple-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="simple-chart-container" [attr.style]="style || defaultStyle">
      <canvas #chartCanvas></canvas>
    </div>
  `
})
export class SimpleChartComponent {
  @ViewChild('chartCanvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @Input() type: ChartType = 'bar';
  @Input() data: ChartData | Array<{ label: string; value: number }> = { labels: [], datasets: [] };
  @Input() dataLabel: string = 'Data';
  @Input() style?: string;
  @Input() options?: any;
  
  defaultStyle = 'padding: 20px; background-color: white; border-radius: 8px;';
  private chart?: Chart;
  
  // Implementation handles chart rendering, updates, and cleanup
}
```

#### 2. Chart Data Utilities
**File:** `src/app/utils/chart-data.util.ts`

```typescript
import { ChartConfiguration, ChartType } from 'chart.js';

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
}

// Utilities:
// - generateChartColors(count: number): string[]
// - transformToChartData(data, label): ChartData
// - createBarChartConfig(data, options): ChartConfiguration<'bar'>
// - createPieChartConfig(data, type, options): ChartConfiguration<'pie' | 'doughnut'>
// - createLineChartConfig(data, options): ChartConfiguration<'line'>
```

### Visualizations to Add
1. **Skill Distribution Pie Chart**
   ```typescript
   <app-simple-chart 
     type="doughnut" 
     [data]="skillsByCategory"
     dataLabel="Skills by Category">
   </app-simple-chart>
   ```

2. **Skill Gap Timeline**
   ```typescript
   <app-simple-chart 
     type="bar" 
     [data]="gapsByPriority"
     dataLabel="Skill Gaps">
   </app-simple-chart>
   ```

3. **Trending Skills Line Chart**
   ```typescript
   <app-simple-chart 
     type="line" 
     [data]="trendingSkills"
     dataLabel="Trending Skills">
   </app-simple-chart>
   ```

4. **Match Score Gauge**
   ```typescript
   <app-simple-chart 
     type="doughnut" 
     [data]="matchScore"
     dataLabel="Match Score">
   </app-simple-chart>
   ```

---

## Phase 6: Backend Auth Integration (1 hour)

### NestJS Changes

#### 1. Install Firebase Admin
```bash
cd apps/skill-sense-api
npm install firebase-admin
```

#### 2. Create Auth Guard
**File:** `src/shared/guards/firebase-auth.guard.ts`

```typescript
@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.split('Bearer ')[1];
    
    if (!token) return false;
    
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      request.user = { uid: decodedToken.uid };
      return true;
    } catch {
      return false;
    }
  }
}
```

#### 3. Protect Routes
```typescript
@UseGuards(FirebaseAuthGuard)
@Controller('profiles')
export class ProfileController { ... }
```

---

## Phase 7: Deployment (1-2 hours)

### Backend to Cloud Run
```bash
cd apps/skill-sense-api
gcloud run deploy skill-sense-api --source . --region us-central1
```

### Frontend to Firebase Hosting
```bash
cd apps/skill-sense-shell
npm run build
firebase deploy --only hosting
```

### Environment Variables
**Production:**
- `FIREBASE_CONFIG` - Firebase credentials
- `API_URL` - Cloud Run backend URL
- `GCP_PROJECT_ID` - Google Cloud project
- `CORS_ORIGIN` - Frontend URL

---

## Phase 8: Submission Materials (2-3 hours)

### 1. Demo Video (60 seconds)
**Script:**
1. (0-10s) Show landing page, click "Get Started"
2. (10-20s) Upload CV, show skills extracted
3. (20-35s) Analyze skill gaps for "DevOps Engineer"
4. (35-50s) Get AI recommendations, view learning path
5. (50-60s) Show dashboard with visualizations

### 2. Tech Video (60 seconds)
**Script:**
1. (0-15s) Show architecture diagram
2. (15-30s) Explain NestJS + Vertex AI + Firestore
3. (30-45s) Show code: skill extraction with Gemini
4. (45-60s) Demo Weaviate vector search

### 3. 1-Page Report (PDF)
**Sections:**
- **Objective:** AI-powered skill extraction platform
- **Tech Stack:** NestJS, Angular, Vertex AI, Firestore, Weaviate
- **Features:** 6 AI features, 4 data connectors
- **Architecture:** Diagram showing flow
- **Results:** Demo screenshots, metrics

### 4. GitHub README
**Sections:**
- Project overview
- Features list
- Tech stack
- Setup instructions
- API documentation (link to Swagger)
- Screenshots
- Team information

---

## 📊 Timeline Summary

| Phase | Task | Time | Priority |
|-------|------|------|----------|
| 1 | Firebase Auth Setup | 1-2h | 🔴 Critical |
| 2 | Core Components | 2-3h | 🔴 Critical |
| 3 | AI Features | 2-3h | 🟡 High |
| 4 | Styling & UX | 1-2h | 🟡 High |
| 5 | Visualizations | 1-2h | 🟢 Medium |
| 6 | Backend Auth | 1h | 🔴 Critical |
| 7 | Deployment | 1-2h | 🔴 Critical |
| 8 | Submission Materials | 2-3h | 🔴 Critical |

**Total:** 11-18 hours

---

## 🎯 Recommended Order

**Day 1 (4-6 hours):**
1. Firebase Auth setup
2. Core components (Dashboard, Upload, Profile)
3. Backend auth integration

**Day 2 (4-6 hours):**
4. AI features implementation
5. Styling with Angular Material
6. Data visualizations

**Day 3 (3-6 hours):**
7. Deployment (both frontend & backend)
8. Create submission materials
9. Final testing and polish

---

Ready to start? Let's begin with **Phase 1: Firebase Authentication Setup**!
