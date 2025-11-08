# SkillSense - Implementation Guide

**Version:** 1.0  
**Date:** November 8, 2025

This guide provides step-by-step implementation instructions for building SkillSense from scratch.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Day 0: Scaffolding](#day-0-scaffolding-2-hours)
3. [Day 1: Backend](#day-1-backend-8-hours)
4. [Day 2: Frontend](#day-2-frontend-8-hours)
5. [Day 3: Integration & Deploy](#day-3-integration--deploy-8-hours)

---

## Prerequisites

### Required Accounts
- Google Cloud Platform account with billing enabled
- Firebase project
- Weaviate Cloud Service account (free tier)
- GitHub account (for testing)

### Required Tools
```bash
# Node.js 18+
node --version  # v18.0.0+

# Package managers
npm --version   # 9.0.0+

# Angular CLI
npm install -g @angular/cli@17

# NestJS CLI
npm install -g @nestjs/cli@10

# Firebase CLI
npm install -g firebase-tools

# gcloud CLI
gcloud --version
```

### GCP Setup
```bash
# Authenticate
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Enable required APIs
gcloud services enable \
  run.googleapis.com \
  aiplatform.googleapis.com \
  storage.googleapis.com \
  firestore.googleapis.com

# Create service account
gcloud iam service-accounts create skillsense-api \
  --display-name="SkillSense API Service Account"

# Grant permissions
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:skillsense-api@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:skillsense-api@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/datastore.user"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:skillsense-api@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/storage.admin"
```

### Weaviate Cloud Setup
```bash
# 1. Sign up at https://console.weaviate.cloud
# 2. Create new cluster (free tier: sandbox-us-east-1)
# 3. Note your cluster URL and API key
# Example: https://skillsense-xyz123.weaviate.network
```

---

## Day 0: Scaffolding (2 hours)

See [03-SCAFFOLDING.md](./03-SCAFFOLDING.md) for executable commands.

After scaffolding, you should have:
```
skill-sense/
  apps/skill-sense-api/     # NestJS backend
  projects/                  # Angular libraries
  package.json               # Workspace config
  firebase.json              # Firebase config
  .env                       # Environment variables
```

---

## Day 1: Backend (8 hours)

### 1.1 Shared Services (2 hours)

#### FirestoreService

```typescript
// apps/skill-sense-api/src/shared/services/firestore.service.ts
import { Injectable } from '@nestjs/common';
import { Firestore } from '@google-cloud/firestore';

@Injectable()
export class FirestoreService {
  private firestore: Firestore;

  constructor() {
    this.firestore = new Firestore({
      projectId: process.env.GCP_PROJECT_ID,
    });
  }

  collection(name: string) {
    return this.firestore.collection(name);
  }

  async getDoc<T>(collection: string, id: string): Promise<T | null> {
    const doc = await this.firestore.collection(collection).doc(id).get();
    return doc.exists ? (doc.data() as T) : null;
  }

  async setDoc<T>(collection: string, id: string, data: T): Promise<void> {
    await this.firestore.collection(collection).doc(id).set(data);
  }

  async updateDoc<T>(collection: string, id: string, data: Partial<T>): Promise<void> {
    await this.firestore.collection(collection).doc(id).update(data);
  }

  async deleteDoc(collection: string, id: string): Promise<void> {
    await this.firestore.collection(collection).doc(id).delete();
  }

  async query<T>(collection: string, filters: any[]): Promise<T[]> {
    let query: any = this.firestore.collection(collection);
    
    filters.forEach(([field, op, value]) => {
      query = query.where(field, op, value);
    });

    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
  }
}
```

#### VertexAIService

```typescript
// apps/skill-sense-api/src/shared/services/vertex-ai.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { VertexAI, HarmCategory, HarmBlockThreshold } from '@google-cloud/vertexai';

@Injectable()
export class VertexAIService {
  private readonly logger = new Logger(VertexAIService.name);
  private vertexAI: VertexAI;

  constructor() {
    this.vertexAI = new VertexAI({
      project: process.env.GCP_PROJECT_ID,
      location: process.env.GCP_LOCATION || 'us-central1',
    });
  }

  async extractTextFromPDF(fileUrl: string): Promise<string> {
    const model = this.vertexAI.preview.getGenerativeModel({
      model: 'gemini-pro-vision',
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
    });

    const request = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              fileData: {
                mimeType: 'application/pdf',
                fileUri: fileUrl, // gs:// URL
              },
            },
            {
              text: `Extract all text from this CV/resume. 
                     Return the full text content preserving structure.`,
            },
          ],
        },
      ],
    };

    const result = await model.generateContent(request);
    const response = result.response;
    return response.candidates[0].content.parts[0].text;
  }

  async extractSkills(text: string): Promise<Array<{
    name: string;
    category: string;
    confidence: number;
    context: string;
  }>> {
    const model = this.vertexAI.preview.getGenerativeModel({
      model: 'gemini-pro',
    });

    const functionDeclaration = {
      name: 'extractSkills',
      description: 'Extract professional skills from text',
      parameters: {
        type: 'OBJECT',
        properties: {
          skills: {
            type: 'ARRAY',
            description: 'List of extracted skills',
            items: {
              type: 'OBJECT',
              properties: {
                name: {
                  type: 'STRING',
                  description: 'Skill name (e.g., "TypeScript")',
                },
                category: {
                  type: 'STRING',
                  description: 'Skill category',
                  enum: [
                    'Programming Language',
                    'Framework',
                    'Tool',
                    'Platform',
                    'Soft Skill',
                    'Domain Knowledge',
                  ],
                },
                confidence: {
                  type: 'NUMBER',
                  description: 'Confidence score 0.0-1.0',
                },
                context: {
                  type: 'STRING',
                  description: 'Text snippet where skill was found',
                },
              },
              required: ['name', 'category', 'confidence', 'context'],
            },
          },
        },
        required: ['skills'],
      },
    };

    const request = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Extract all professional skills from this text:\n\n${text}\n\n
                     For each skill:
                     - Identify the skill name
                     - Categorize it
                     - Assign confidence based on context
                     - Include the text snippet as evidence`,
            },
          ],
        },
      ],
      tools: [{ functionDeclarations: [functionDeclaration] }],
    };

    const result = await model.generateContent(request);
    const functionCall = result.response.candidates[0].content.parts[0].functionCall;
    
    return functionCall.args.skills;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const model = 'text-embedding-gecko@003';
    const [response] = await this.vertexAI.preview.getGenerativeModel({
      model,
    }).predict({
      instances: [{ content: text }],
    });

    return response.predictions[0].embeddings.values;
  }
}
```

#### WeaviateService

```typescript
// apps/skill-sense-api/src/shared/services/weaviate.service.ts
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import weaviate, { WeaviateClient } from 'weaviate-ts-client';

@Injectable()
export class WeaviateService implements OnModuleInit {
  private readonly logger = new Logger(WeaviateService.name);
  private client: WeaviateClient;

  async onModuleInit() {
    this.client = weaviate.client({
      scheme: 'https',
      host: process.env.WEAVIATE_HOST, // e.g., skillsense-xyz.weaviate.network
      apiKey: new weaviate.ApiKey(process.env.WEAVIATE_API_KEY),
    });

    await this.initializeSchema();
  }

  private async initializeSchema() {
    try {
      // Check if schema exists
      const schema = await this.client.schema.getter().do();
      const skillClassExists = schema.classes?.some(c => c.class === 'Skill');

      if (!skillClassExists) {
        await this.client.schema
          .classCreator()
          .withClass({
            class: 'Skill',
            description: 'Professional skill extracted from user profiles',
            properties: [
              {
                name: 'name',
                dataType: ['string'],
                description: 'Skill name',
              },
              {
                name: 'category',
                dataType: ['string'],
                description: 'Skill category',
              },
              {
                name: 'profileId',
                dataType: ['string'],
                description: 'Associated profile ID',
              },
              {
                name: 'confidence',
                dataType: ['number'],
                description: 'Confidence score',
              },
              {
                name: 'verified',
                dataType: ['boolean'],
                description: 'User verified',
              },
            ],
            vectorizer: 'none', // We provide embeddings from Vertex AI
            vectorIndexConfig: {
              distance: 'cosine',
            },
          })
          .do();

        this.logger.log('Weaviate schema initialized');
      }
    } catch (error) {
      this.logger.error('Failed to initialize Weaviate schema', error);
      throw error;
    }
  }

  async indexSkill(skill: {
    id: string;
    name: string;
    category: string;
    profileId: string;
    confidence: number;
    verified: boolean;
    embedding: number[];
  }): Promise<void> {
    await this.client.data
      .creator()
      .withClassName('Skill')
      .withId(skill.id)
      .withProperties({
        name: skill.name,
        category: skill.category,
        profileId: skill.profileId,
        confidence: skill.confidence,
        verified: skill.verified,
      })
      .withVector(skill.embedding)
      .do();
  }

  async searchSkills(query: string, embedding: number[], limit = 10): Promise<any[]> {
    const result = await this.client.graphql
      .get()
      .withClassName('Skill')
      .withFields('name category profileId confidence verified _additional { distance }')
      .withNearVector({ vector: embedding })
      .withLimit(limit)
      .do();

    return result.data.Get.Skill;
  }

  async deleteSkill(id: string): Promise<void> {
    await this.client.data.deleter().withClassName('Skill').withId(id).do();
  }
}
```

#### JobQueueService

```typescript
// apps/skill-sense-api/src/shared/services/job-queue.service.ts
import { Injectable } from '@nestjs/common';
import { FirestoreService } from './firestore.service';
import { v4 as uuidv4 } from 'uuid';

export interface Job {
  id: string;
  profileId: string;
  type: 'extraction' | 'indexing';
  source?: 'CV' | 'GITHUB' | 'WEB';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
  result?: any;
  error?: string;
}

@Injectable()
export class JobQueueService {
  constructor(private firestore: FirestoreService) {}

  async createJob(
    profileId: string,
    type: Job['type'],
    source?: Job['source'],
  ): Promise<Job> {
    const job: Job = {
      id: uuidv4(),
      profileId,
      type,
      source,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.firestore.setDoc('jobs', job.id, job);
    return job;
  }

  async updateStatus(
    jobId: string,
    status: Job['status'],
    data?: { result?: any; error?: string },
  ): Promise<void> {
    await this.firestore.updateDoc('jobs', jobId, {
      status,
      updatedAt: new Date(),
      ...data,
    });
  }

  async getJob(jobId: string): Promise<Job | null> {
    return this.firestore.getDoc<Job>('jobs', jobId);
  }

  async getJobsByProfile(profileId: string): Promise<Job[]> {
    return this.firestore.query<Job>('jobs', [
      ['profileId', '==', profileId],
    ]);
  }
}
```

### 1.2 Extraction Module (3 hours)

#### CV Parser Service

```typescript
// apps/skill-sense-api/src/modules/connectors/cv/cv-parser.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { VertexAIService } from '../../../shared/services/vertex-ai.service';
import { Storage } from '@google-cloud/storage';

@Injectable()
export class CvParserService {
  private readonly logger = new Logger(CvParserService.name);
  private storage: Storage;

  constructor(private vertexAI: VertexAIService) {
    this.storage = new Storage({
      projectId: process.env.GCP_PROJECT_ID,
    });
  }

  async uploadFile(file: Express.Multer.File): Promise<string> {
    const bucket = this.storage.bucket(process.env.GCS_BUCKET_NAME);
    const filename = `cvs/${Date.now()}-${file.originalname}`;
    const blob = bucket.file(filename);

    await blob.save(file.buffer, {
      contentType: file.mimetype,
      metadata: {
        originalName: file.originalname,
      },
    });

    return `gs://${process.env.GCS_BUCKET_NAME}/${filename}`;
  }

  async parseCV(fileUrl: string): Promise<{
    text: string;
    skills: Array<{
      name: string;
      category: string;
      confidence: number;
      context: string;
    }>;
  }> {
    // Step 1: Extract text from PDF
    this.logger.log(`Extracting text from ${fileUrl}`);
    const text = await this.vertexAI.extractTextFromPDF(fileUrl);

    // Step 2: Extract skills from text
    this.logger.log('Extracting skills from text');
    const skills = await this.vertexAI.extractSkills(text);

    return { text, skills };
  }
}
```

#### GitHub Connector Service

```typescript
// apps/skill-sense-api/src/modules/connectors/github/github-connector.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Octokit } from '@octokit/rest';
import { VertexAIService } from '../../../shared/services/vertex-ai.service';

@Injectable()
export class GithubConnectorService {
  private readonly logger = new Logger(GithubConnectorService.name);

  constructor(private vertexAI: VertexAIService) {}

  async analyzeGithubProfile(username: string, accessToken?: string): Promise<{
    repos: Array<{ name: string; languages: string[]; description: string }>;
    skills: Array<{
      name: string;
      category: string;
      confidence: number;
      context: string;
    }>;
  }> {
    const octokit = new Octokit({
      auth: accessToken || process.env.GITHUB_TOKEN,
    });

    // Get user's repos
    const { data: repos } = await octokit.repos.listForUser({
      username,
      per_page: 100,
      sort: 'updated',
    });

    // Analyze top 10 repos
    const topRepos = repos.slice(0, 10);
    const repoData = [];

    for (const repo of topRepos) {
      // Get languages
      const { data: languages } = await octokit.repos.listLanguages({
        owner: username,
        repo: repo.name,
      });

      repoData.push({
        name: repo.name,
        languages: Object.keys(languages),
        description: repo.description || '',
      });
    }

    // Extract skills from repo data
    const analysisText = repoData
      .map(r => `Repository: ${r.name}\nLanguages: ${r.languages.join(', ')}\nDescription: ${r.description}`)
      .join('\n\n');

    const skills = await this.vertexAI.extractSkills(analysisText);

    return { repos: repoData, skills };
  }
}
```

#### Extraction Service

```typescript
// apps/skill-sense-api/src/modules/extraction/extraction.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { FirestoreService } from '../../shared/services/firestore.service';
import { VertexAIService } from '../../shared/services/vertex-ai.service';
import { WeaviateService } from '../../shared/services/weaviate.service';
import { JobQueueService } from '../../shared/services/job-queue.service';
import { CvParserService } from '../connectors/cv/cv-parser.service';
import { GithubConnectorService } from '../connectors/github/github-connector.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ExtractionService {
  private readonly logger = new Logger(ExtractionService.name);

  constructor(
    private firestore: FirestoreService,
    private vertexAI: VertexAIService,
    private weaviate: WeaviateService,
    private jobQueue: JobQueueService,
    private cvParser: CvParserService,
    private githubConnector: GithubConnectorService,
  ) {}

  async extractFromCV(
    profileId: string,
    file: Express.Multer.File,
  ): Promise<{ jobId: string }> {
    const job = await this.jobQueue.createJob(profileId, 'extraction', 'CV');

    // Process async
    this.processCV Extraction(job.id, profileId, file).catch(err => {
      this.logger.error(`CV extraction failed: ${err.message}`);
      this.jobQueue.updateStatus(job.id, 'failed', { error: err.message });
    });

    return { jobId: job.id };
  }

  private async processCVExtraction(
    jobId: string,
    profileId: string,
    file: Express.Multer.File,
  ): Promise<void> {
    await this.jobQueue.updateStatus(jobId, 'processing');

    // Upload file to GCS
    const fileUrl = await this.cvParser.uploadFile(file);

    // Parse CV
    const { text, skills } = await this.cvParser.parseCV(fileUrl);

    // Save skills to Firestore and index in Weaviate
    const savedSkills = [];
    for (const skill of skills) {
      const skillId = uuidv4();
      const skillData = {
        id: skillId,
        profileId,
        name: skill.name,
        category: skill.category,
        confidence: skill.confidence,
        verified: false,
        evidence: [
          {
            id: uuidv4(),
            skillId,
            source: 'CV' as const,
            documentId: fileUrl,
            snippet: skill.context,
            context: skill.context,
            extractedAt: new Date(),
            confidence: skill.confidence,
          },
        ],
        firstSeenAt: new Date(),
        lastSeenAt: new Date(),
        occurrences: 1,
      };

      await this.firestore.setDoc('skills', skillId, skillData);

      // Generate embedding and index
      const embedding = await this.vertexAI.generateEmbedding(skill.name);
      await this.weaviate.indexSkill({ ...skillData, embedding });

      savedSkills.push(skillData);
    }

    await this.jobQueue.updateStatus(jobId, 'completed', {
      result: {
        skillsFound: savedSkills.length,
        evidenceCount: savedSkills.length,
      },
    });
  }

  async extractFromGithub(
    profileId: string,
    username: string,
    accessToken?: string,
  ): Promise<{ jobId: string }> {
    const job = await this.jobQueue.createJob(profileId, 'extraction', 'GITHUB');

    this.processGithubExtraction(job.id, profileId, username, accessToken).catch(err => {
      this.logger.error(`GitHub extraction failed: ${err.message}`);
      this.jobQueue.updateStatus(job.id, 'failed', { error: err.message });
    });

    return { jobId: job.id };
  }

  private async processGithubExtraction(
    jobId: string,
    profileId: string,
    username: string,
    accessToken?: string,
  ): Promise<void> {
    await this.jobQueue.updateStatus(jobId, 'processing');

    const { repos, skills } = await this.githubConnector.analyzeGithubProfile(
      username,
      accessToken,
    );

    // Save skills (similar to CV extraction)
    const savedSkills = [];
    for (const skill of skills) {
      const skillId = uuidv4();
      const skillData = {
        id: skillId,
        profileId,
        name: skill.name,
        category: skill.category,
        confidence: skill.confidence,
        verified: false,
        evidence: [
          {
            id: uuidv4(),
            skillId,
            source: 'GITHUB' as const,
            sourceUrl: `https://github.com/${username}`,
            snippet: skill.context,
            context: skill.context,
            extractedAt: new Date(),
            confidence: skill.confidence,
          },
        ],
        firstSeenAt: new Date(),
        lastSeenAt: new Date(),
        occurrences: 1,
      };

      await this.firestore.setDoc('skills', skillId, skillData);

      const embedding = await this.vertexAI.generateEmbedding(skill.name);
      await this.weaviate.indexSkill({ ...skillData, embedding });

      savedSkills.push(skillData);
    }

    await this.jobQueue.updateStatus(jobId, 'completed', {
      result: {
        skillsFound: savedSkills.length,
        evidenceCount: savedSkills.length,
      },
    });
  }
}
```

### 1.3 Profile & Search Modules (2 hours)

#### Profile Service

```typescript
// apps/skill-sense-api/src/modules/profile/profile.service.ts
import { Injectable } from '@nestjs/common';
import { FirestoreService } from '../../shared/services/firestore.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ProfileService {
  constructor(private firestore: FirestoreService) {}

  async createProfile(userId: string, email: string, name: string) {
    const profile = {
      id: uuidv4(),
      userId,
      email,
      name,
      createdAt: new Date(),
      updatedAt: new Date(),
      sources: [],
      status: 'active',
    };

    await this.firestore.setDoc('profiles', profile.id, profile);
    return profile;
  }

  async getProfile(profileId: string) {
    const profile = await this.firestore.getDoc('profiles', profileId);
    if (!profile) return null;

    // Get skills
    const skills = await this.firestore.query('skills', [
      ['profileId', '==', profileId],
    ]);

    return { ...profile, skills };
  }

  async getSkillsByProfile(profileId: string) {
    return this.firestore.query('skills', [['profileId', '==', profileId]]);
  }

  async verifySkill(skillId: string, verified: boolean) {
    await this.firestore.updateDoc('skills', skillId, { verified });
  }

  async deleteSkill(skillId: string) {
    await this.firestore.deleteDoc('skills', skillId);
    // Also delete from Weaviate (handled by WeaviateService)
  }
}
```

### 1.4 Controllers & DTOs (1 hour)

Add controllers and DTOs for all services following the service-controller separation pattern.

---

## Day 2: Frontend (8 hours)

### 2.1 Core Services (2 hours)

#### API Service

```typescript
// projects/skill-sense-core/src/lib/services/api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Profiles
  createProfile(data: { email: string; name: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/profiles`, data);
  }

  getProfile(id: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/api/profiles/${id}`);
  }

  // Extraction
  extractFromCV(profileId: string, file: File): Observable<{ jobId: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('profileId', profileId);

    return this.http.post<{ jobId: string }>(
      `${this.baseUrl}/api/extract/cv`,
      formData,
    );
  }

  extractFromGithub(profileId: string, username: string): Observable<{ jobId: string }> {
    return this.http.post<{ jobId: string }>(
      `${this.baseUrl}/api/extract/github`,
      { profileId, username },
    );
  }

  getJobStatus(jobId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/api/jobs/${jobId}`);
  }

  // Skills
  verifySkill(skillId: string, verified: boolean): Observable<any> {
    return this.http.patch(`${this.baseUrl}/api/skills/${skillId}/verify`, { verified });
  }

  deleteSkill(skillId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/api/skills/${skillId}`);
  }
}
```

#### Skill Store

```typescript
// projects/skill-sense-core/src/lib/stores/skill.store.ts
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { ApiService } from '../services/api.service';

interface SkillState {
  skills: any[];
  loading: boolean;
  error: string | null;
  selectedSkill: any | null;
}

export const SkillStore = signalStore(
  { providedIn: 'root' },
  withState<SkillState>({
    skills: [],
    loading: false,
    error: null,
    selectedSkill: null,
  }),
  withMethods((store, apiService = inject(ApiService)) => ({
    async loadSkills(profileId: string) {
      patchState(store, { loading: true, error: null });
      try {
        const profile = await apiService.getProfile(profileId).toPromise();
        patchState(store, { skills: profile.skills || [], loading: false });
      } catch (error: any) {
        patchState(store, { error: error.message, loading: false });
      }
    },

    selectSkill(skill: any) {
      patchState(store, { selectedSkill: skill });
    },

    async verifySkill(skillId: string, verified: boolean) {
      await apiService.verifySkill(skillId, verified).toPromise();
      const skills = store.skills().map(s =>
        s.id === skillId ? { ...s, verified } : s,
      );
      patchState(store, { skills });
    },

    async deleteSkill(skillId: string) {
      await apiService.deleteSkill(skillId).toPromise();
      const skills = store.skills().filter(s => s.id !== skillId);
      patchState(store, { skills });
    },
  })),
);
```

### 2.2 UI Components (4 hours)

#### Skill Card Component

```typescript
// projects/skill-sense-ui/src/lib/skill-card/skill-card.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-skill-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
  ],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>{{ skill.name }}</mat-card-title>
        <mat-card-subtitle>{{ skill.category }}</mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>
        <div class="confidence">
          Confidence: {{ (skill.confidence * 100).toFixed(0) }}%
        </div>
        <mat-chip-set>
          <mat-chip [color]="skill.verified ? 'primary' : 'warn'">
            {{ skill.verified ? 'Verified' : 'Unverified' }}
          </mat-chip>
          <mat-chip>{{ skill.evidence.length }} evidence</mat-chip>
        </mat-chip-set>
      </mat-card-content>
      <mat-card-actions>
        <button mat-button (click)="viewEvidence.emit(skill)">
          View Evidence
        </button>
        <button mat-button (click)="verify.emit(skill)" *ngIf="!skill.verified">
          Verify
        </button>
        <button mat-icon-button (click)="delete.emit(skill)">
          <mat-icon>delete</mat-icon>
        </button>
      </mat-card-actions>
    </mat-card>
  `,
  styles: [`
    mat-card {
      margin: 16px 0;
    }
    .confidence {
      margin: 8px 0;
      font-weight: 500;
    }
  `],
})
export class SkillCardComponent {
  @Input() skill: any;
  @Output() viewEvidence = new EventEmitter();
  @Output() verify = new EventEmitter();
  @Output() delete = new EventEmitter();
}
```

#### CV Upload Component

```typescript
// projects/skill-sense-sources/src/lib/cv-upload/cv-upload.component.ts
import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ApiService } from 'skill-sense-core';

@Component({
  selector: 'app-cv-upload',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatProgressBarModule],
  template: `
    <div class="upload-container">
      <input
        type="file"
        #fileInput
        (change)="onFileSelected($event)"
        accept=".pdf,.docx"
        style="display: none"
      />
      <button
        mat-raised-button
        color="primary"
        (click)="fileInput.click()"
        [disabled]="uploading"
      >
        Upload CV
      </button>
      <mat-progress-bar
        *ngIf="uploading"
        mode="indeterminate"
      ></mat-progress-bar>
      <p *ngIf="errorMessage" class="error">{{ errorMessage }}</p>
    </div>
  `,
  styles: [`
    .upload-container {
      padding: 24px;
      text-align: center;
    }
    .error {
      color: red;
      margin-top: 8px;
    }
  `],
})
export class CvUploadComponent {
  @Output() uploaded = new EventEmitter<string>();

  uploading = false;
  errorMessage = '';

  constructor(private api: ApiService) {}

  async onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    this.uploading = true;
    this.errorMessage = '';

    try {
      const profileId = localStorage.getItem('profileId')!;
      const result = await this.api.extractFromCV(profileId, file).toPromise();
      this.uploaded.emit(result.jobId);
    } catch (error: any) {
      this.errorMessage = error.message;
    } finally {
      this.uploading = false;
    }
  }
}
```

### 2.3 Feature Pages (2 hours)

Create profile view, skill list, and other feature pages using the components and store.

---

## Day 3: Integration & Deploy (8 hours)

### 3.1 Integration Testing (3 hours)

- Test CV upload → extraction → skill display flow
- Test GitHub connect → extraction → skill display flow
- Test skill verification workflow
- Test evidence viewer
- Test search functionality

### 3.2 UI Polish (2 hours)

- Add loading states
- Add error handling
- Improve responsive design
- Add animations

### 3.3 Deployment (3 hours)

See [04-DEPLOYMENT.md](./04-DEPLOYMENT.md) for deployment instructions.

---

## Implementation Checklist

### Backend
- [ ] Shared services implemented (Firestore, Vertex AI, Weaviate, JobQueue)
- [ ] CV parser service
- [ ] GitHub connector service
- [ ] Extraction orchestration
- [ ] Profile management
- [ ] Search functionality
- [ ] Controllers and DTOs
- [ ] Error handling
- [ ] Logging

### Frontend
- [ ] API service
- [ ] Signal store
- [ ] Skill card component
- [ ] Evidence viewer component
- [ ] CV upload component
- [ ] GitHub connect component
- [ ] Profile view page
- [ ] Skill list page
- [ ] Search page
- [ ] Routing configured
- [ ] Error handling
- [ ] Loading states

### Integration
- [ ] End-to-end flows tested
- [ ] Error scenarios handled
- [ ] Performance optimized
- [ ] UI polished

### Deployment
- [ ] Backend deployed to Cloud Run
- [ ] Frontend deployed to Firebase Hosting
- [ ] Environment variables configured
- [ ] APIs enabled
- [ ] Monitoring configured

---

**Implementation Guide Complete** ✅

Follow this guide step-by-step to build a production-ready SkillSense MVP in 2-3 days.
