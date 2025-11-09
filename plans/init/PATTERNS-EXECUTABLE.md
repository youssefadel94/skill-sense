# SkillSense: Executable Architecture Patterns

**Goal:** Copy-paste ready implementations for 2-3 day hackathon

---

## Angular Patterns

### 1. Modular Library Structure

**Why:** Reusable code, clear boundaries, scalable monorepo

```bash
# Create this exact structure
projects/
  skill-sense-shell/          # Main app (Firebase Hosting)
  skill-sense-core/           # Models, interfaces, services
  skill-sense-ui/             # Shared components
  skill-sense-profile/        # Profile feature
  skill-sense-sources/        # Source connectors UI
```

**Usage:**
```typescript
// Import from any project
import { SkillCardComponent } from 'skill-sense-ui';
import { SkillService } from 'skill-sense-core';
```

---

### 2. Standalone Components

**Why:** Angular 17+, faster compilation, tree-shakable

```typescript
// skill-card.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-skill-card',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `
    <mat-card>
      <h3>{{ skill.name }}</h3>
      <p>Confidence: {{ skill.confidence }}%</p>
    </mat-card>
  `
})
export class SkillCardComponent {
  @Input() skill!: Skill;
}
```

**Rules:**
- Always `standalone: true`
- Import dependencies in `imports: []`
- No NgModules except routing

---

### 3. Public API Pattern

**Why:** Clean library boundaries, prevents leakage

```typescript
// projects/skill-sense-core/src/public-api.ts
export * from './lib/models/skill.model';
export * from './lib/models/evidence.model';
export * from './lib/services/skill.service';
export * from './lib/interfaces/connector.interface';
```

**Import from public API only:**
```typescript
// ✅ Good
import { Skill, SkillService } from 'skill-sense-core';

// ❌ Bad
import { Skill } from 'skill-sense-core/lib/models/skill.model';
```

---

### 4. RxJS-First Services

**Why:** Composable async, built-in error handling, cancellable

```typescript
// skill.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, interval } from 'rxjs';
import { switchMap, takeWhile, map, catchError } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class SkillService {
  constructor(private http: HttpClient) {}

  extractSkills(profileId: string): Observable<ExtractionResult> {
    return this.http.post<{ jobId: string }>(`/api/extract/${profileId}`, {})
      .pipe(
        switchMap(({ jobId }) => this.pollJobStatus(jobId)),
        map(result => this.transformSkills(result)),
        catchError(error => this.handleError(error))
      );
  }

  private pollJobStatus(jobId: string): Observable<any> {
    return interval(2000).pipe(
      switchMap(() => this.http.get(`/api/jobs/${jobId}`)),
      takeWhile(job => job.status !== 'completed', true)
    );
  }
}
```

**Component usage:**
```typescript
@Component({
  template: `<div *ngFor="let skill of skills$ | async">{{ skill.name }}</div>`
})
export class ProfileComponent {
  skills$ = this.skillService.extractSkills(this.profileId);
  
  constructor(private skillService: SkillService) {}
}
```

---

### 5. NgRx SignalStore (State)

**Why:** Centralized state, reactive, time-travel debugging

```typescript
// skill.store.ts
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { inject } from '@angular/core';

interface SkillState {
  skills: Skill[];
  loading: boolean;
  error: string | null;
}

export const SkillStore = signalStore(
  { providedIn: 'root' },
  withState<SkillState>({
    skills: [],
    loading: false,
    error: null
  }),
  withMethods((store, skillService = inject(SkillService)) => ({
    async loadSkills(profileId: string) {
      patchState(store, { loading: true });
      try {
        const skills = await skillService.getSkills(profileId).toPromise();
        patchState(store, { skills, loading: false });
      } catch (error) {
        patchState(store, { error: error.message, loading: false });
      }
    }
  }))
);
```

**Component usage:**
```typescript
@Component({
  template: `
    <div *ngIf="store.loading()">Loading...</div>
    <app-skill-card *ngFor="let skill of store.skills()" [skill]="skill" />
  `
})
export class ProfileComponent {
  store = inject(SkillStore);
  
  ngOnInit() {
    this.store.loadSkills(this.profileId);
  }
}
```

---

## NestJS Patterns

### 1. Modular Architecture

**Why:** Clear boundaries, testable, scalable

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SharedModule } from './shared/shared.module';
import { ProfileModule } from './modules/profile/profile.module';
import { ExtractionModule } from './modules/extraction/extraction.module';
import { SearchModule } from './modules/search/search.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SharedModule,
    ProfileModule,
    ExtractionModule,
    SearchModule,
  ],
})
export class AppModule {}
```

**Module structure:**
```
modules/
  extraction/
    extraction.module.ts
    extraction.controller.ts
    extraction.service.ts
    dto/
      extract-skills.dto.ts
```

---

### 2. @Global() Shared Module

**Why:** Single instance services, no repeated imports

```typescript
// shared/shared.module.ts
import { Module, Global } from '@nestjs/common';
import { FirestoreService } from './services/firestore.service';
import { VertexAIService } from './services/vertex-ai.service';
import { WeaviateService } from './services/weaviate.service';

@Global()
@Module({
  providers: [FirestoreService, VertexAIService, WeaviateService],
  exports: [FirestoreService, VertexAIService, WeaviateService],
})
export class SharedModule {}
```

**Usage (auto-injected everywhere):**
```typescript
@Injectable()
export class ExtractionService {
  constructor(
    private firestore: FirestoreService,  // ✅ No import needed
    private vertexAI: VertexAIService,    // ✅ Auto-available
  ) {}
}
```

---

### 3. DTO Validation

**Why:** Runtime type safety, auto-validation, clear contracts

```typescript
// dto/extract-skills.dto.ts
import { IsUUID, IsArray, IsEnum, IsOptional, IsNumber, Min, Max } from 'class-validator';

export enum SourceType {
  CV = 'CV',
  GITHUB = 'GITHUB',
  WEB = 'WEB'
}

export class ExtractSkillsDto {
  @IsUUID()
  profileId: string;

  @IsArray()
  @IsEnum(SourceType, { each: true })
  sources: SourceType[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  minConfidence?: number;
}
```

**Controller usage:**
```typescript
@Controller('extract')
export class ExtractionController {
  @Post()
  async extract(@Body() dto: ExtractSkillsDto) {
    // ✅ dto validated automatically
    // ✅ 400 error if invalid
    return this.service.extract(dto);
  }
}
```

**Enable globally in main.ts:**
```typescript
import { ValidationPipe } from '@nestjs/common';

app.useGlobalPipes(new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
}));
```

---

### 4. Service-Controller Separation

**Why:** Controllers = HTTP, Services = logic, easy testing

```typescript
// extraction.controller.ts (thin)
import { Controller, Post, Body, Get, Param } from '@nestjs/common';

@Controller('extract')
export class ExtractionController {
  constructor(private readonly service: ExtractionService) {}

  @Post()
  async extract(@Body() dto: ExtractSkillsDto) {
    return this.service.extract(dto);
  }

  @Get('status/:jobId')
  async getStatus(@Param('jobId') jobId: string) {
    return this.service.getStatus(jobId);
  }
}
```

```typescript
// extraction.service.ts (thick - all business logic)
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ExtractionService {
  private readonly logger = new Logger(ExtractionService.name);

  constructor(
    private firestore: FirestoreService,
    private vertexAI: VertexAIService,
  ) {}

  async extract(dto: ExtractSkillsDto): Promise<{ jobId: string }> {
    this.logger.log(`Extracting skills for ${dto.profileId}`);
    
    const job = await this.createJob(dto);
    
    // Process async
    this.processExtraction(job).catch(err => 
      this.logger.error(`Failed: ${err.message}`)
    );
    
    return { jobId: job.id };
  }

  private async createJob(dto: ExtractSkillsDto) {
    // Job creation logic
  }

  private async processExtraction(job: Job) {
    // Extraction logic
  }
}
```

---

### 5. Simple Job Queue

**Why:** Firestore-native, simple, good enough for hackathon

```typescript
// shared/services/job-queue.service.ts
import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

export interface Job {
  id: string;
  profileId: string;
  type: 'extraction' | 'indexing';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
  result?: any;
  error?: string;
}

@Injectable()
export class JobQueueService {
  constructor(private firestore: FirestoreService) {}

  async createJob(profileId: string, type: Job['type']): Promise<Job> {
    const job: Job = {
      id: uuidv4(),
      profileId,
      type,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await this.firestore.collection('jobs').doc(job.id).set(job);
    return job;
  }

  async updateStatus(
    jobId: string, 
    status: Job['status'], 
    data?: Partial<Job>
  ): Promise<void> {
    await this.firestore.collection('jobs').doc(jobId).update({
      status,
      updatedAt: new Date(),
      ...data,
    });
  }

  async getJob(jobId: string): Promise<Job> {
    const doc = await this.firestore.collection('jobs').doc(jobId).get();
    return doc.data() as Job;
  }
}
```

**Usage:**
```typescript
async extract(dto: ExtractSkillsDto) {
  const job = await this.jobQueue.createJob(dto.profileId, 'extraction');
  
  this.processExtraction(job.id).catch(err => 
    this.jobQueue.updateStatus(job.id, 'failed', { error: err.message })
  );
  
  return { jobId: job.id };
}

private async processExtraction(jobId: string) {
  await this.jobQueue.updateStatus(jobId, 'processing');
  const result = await this.doExtraction();
  await this.jobQueue.updateStatus(jobId, 'completed', { result });
}
```

---

## SkillSense File Structure

### Backend
```
apps/skill-sense-api/
  src/
    main.ts
    app.module.ts
    shared/
      shared.module.ts              # @Global() services
      services/
        firestore.service.ts
        vertex-ai.service.ts
        weaviate.service.ts
        job-queue.service.ts
    modules/
      profile/
        profile.module.ts
        profile.controller.ts
        profile.service.ts
      extraction/
        extraction.module.ts
        extraction.controller.ts
        extraction.service.ts
        dto/extract-skills.dto.ts
      connectors/
        cv/cv-parser.service.ts
        github/github.service.ts
        web/web-search.service.ts
      search/
        search.module.ts
        search.controller.ts
        vector-search.service.ts
```

### Frontend
```
projects/
  skill-sense-shell/
    src/
      main.ts
      app.routes.ts
  skill-sense-core/
    src/
      lib/
        models/
          skill.model.ts
          evidence.model.ts
        services/
          api.service.ts
          skill.service.ts
        stores/
          skill.store.ts
      public-api.ts
  skill-sense-ui/
    src/
      lib/
        skill-card/skill-card.component.ts
        evidence-viewer/evidence-viewer.component.ts
        confidence-badge/confidence-badge.component.ts
      public-api.ts
  skill-sense-profile/
    src/
      lib/
        profile-view/profile-view.component.ts
        skill-list/skill-list.component.ts
  skill-sense-sources/
    src/
      lib/
        cv-upload/cv-upload.component.ts
        github-connect/github-connect.component.ts
```

---

## Quick Implementation Checklist

### Angular
- [ ] Standalone components only (`standalone: true`)
- [ ] Public API exports (`public-api.ts`)
- [ ] RxJS services (return `Observable<T>`)
- [ ] NgRx SignalStore for state
- [ ] Components <150 lines

### NestJS
- [ ] Feature modules per domain
- [ ] `@Global()` SharedModule for infrastructure
- [ ] DTO validation with class-validator
- [ ] Thin controllers, thick services
- [ ] TypeScript strict mode

### Deployment
- [ ] Backend: Cloud Run
- [ ] Frontend: Firebase Hosting
- [ ] Database: Firestore
- [ ] Vector DB: Weaviate Cloud Service
- [ ] AI: Vertex AI (Gemini)

---

**Ready to scaffold!** All patterns proven in production, optimized for hackathon speed.
