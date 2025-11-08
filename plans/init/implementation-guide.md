# SkillSense Implementation Guide

Date: 2025-11-08

This guide provides step-by-step instructions to scaffold and implement the SkillSense project using the confirmed tech stack: **Vertex AI, Weaviate, Cloud Run, npm/yarn workspaces, full Google Cloud**.

---

## Prerequisites

### Required Tools

- **Node.js**: v18+ (LTS recommended)
- **npm/yarn**: Latest version
- **Google Cloud SDK**: `gcloud` CLI installed and configured
- **Docker**: For local Nest API development and containerization
- **Angular CLI**: `npm i -g @angular/cli`
- **NestJS CLI**: `npm i -g @nestjs/cli`
- **Terraform** (optional): For IaC (or use `gcloud` scripts)
- **Firebase CLI**: `npm i -g firebase-tools`

### Google Cloud Setup

1. **Create GCP Project**:
   ```bash
   gcloud projects create skillsense-hackathon --name="SkillSense"
   gcloud config set project skillsense-hackathon
   ```

2. **Enable Required APIs**:
   ```bash
   gcloud services enable \
     run.googleapis.com \
     firestore.googleapis.com \
     sqladmin.googleapis.com \
     aiplatform.googleapis.com \
     cloudtasks.googleapis.com \
     redis.googleapis.com \
     secretmanager.googleapis.com \
     cloudbuild.googleapis.com \
     container.googleapis.com
   ```

3. **Set Up Billing**:
   - Link billing account in GCP Console
   - Set up budget alerts

4. **Create Service Account**:
   ```bash
   gcloud iam service-accounts create skillsense-api \
     --display-name="SkillSense API Service Account"
   
   gcloud projects add-iam-policy-binding skillsense-hackathon \
     --member="serviceAccount:skillsense-api@skillsense-hackathon.iam.gserviceaccount.com" \
     --role="roles/aiplatform.user"
   
   gcloud projects add-iam-policy-binding skillsense-hackathon \
     --member="serviceAccount:skillsense-api@skillsense-hackathon.iam.gserviceaccount.com" \
     --role="roles/datastore.user"
   ```

5. **Initialize Firestore**:
   ```bash
   gcloud firestore databases create --region=us-central1
   ```

---

## Phase 1: Monorepo Scaffolding

### Step 1.1: Initialize Workspace

```bash


# Create new directory for SkillSense (or use a separate repo)
# Option A: Create in separate repo (recommended for clean start)
mkdir -p ../skillsense
cd ../skillsense

# Option B: Create in current repo under a new folder
mkdir -p apps/skillsense
cd apps/skillsense
```

For this guide, we'll assume **separate repo** approach:

```bash
# Initialize git and npm workspace
git init
npm init -y
```

### Step 1.2: Configure Workspace package.json

Edit `package.json`:

```json
{
  "name": "skillsense-monorepo",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "apps/*",
    "libs/*"
  ],
  "scripts": {
    "build": "npm run build --workspaces",
    "test": "npm run test --workspaces",
    "lint": "npm run lint --workspaces",
    "start:api": "npm run start:dev --workspace=apps/api-nest",
    "start:web": "npm run start --workspace=apps/web-angular",
    "deploy:api": "npm run deploy --workspace=apps/api-nest",
    "deploy:web": "firebase deploy --only hosting"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.3.0",
    "prettier": "^3.1.0",
    "eslint": "^8.55.0"
  }
}
```

### Step 1.3: Create Folder Structure

```bash
mkdir -p apps/api-nest
mkdir -p apps/web-angular
mkdir -p libs/domain
mkdir -p libs/utils
mkdir -p libs/connectors
mkdir -p tools/sample-data
mkdir -p tools/scripts
mkdir -p infrastructure/terraform
```

---

## Phase 2: Backend (NestJS) Setup

### Step 2.1: Scaffold Nest API

```bash
cd apps/api-nest
nest new . --package-manager=npm --skip-git
```

Select defaults, then update `package.json`:

```json
{
  "name": "api-nest",
  "scripts": {
    "build": "nest build",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:debug": "nest start --debug --watch",
    "start:prod": "node dist/main",
    "deploy": "gcloud run deploy skillsense-api --source . --region=us-central1 --allow-unauthenticated",
    "test": "jest",
    "lint": "eslint \"{src,test}/**/*.ts\""
  },
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/platform-express": "^10.0.0",
    "@google-cloud/firestore": "^7.1.0",
    "@google-cloud/aiplatform": "^3.13.0",
    "@google-cloud/tasks": "^4.1.0",
    "@google-cloud/documentai": "^8.0.0",
    "@google-cloud/storage": "^7.7.0",
    "weaviate-ts-client": "^2.0.0",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.1",
    "firebase-admin": "^12.0.0",
    "ioredis": "^5.3.0",
    "axios": "^1.6.0"
  }
}
```

Install dependencies:

```bash
npm install
```

### Step 2.2: Create Nest Modules

```bash
# Generate modules
nest g module ingest
nest g module nlp
nest g module profile
nest g module auth
nest g module ai
nest g module agent

# Generate services
nest g service ingest
nest g service nlp
nest g service profile
nest g service auth
nest g service ai
nest g service agent

# Generate controllers
nest g controller ingest
nest g controller profile
nest g controller skills
```

### Step 2.3: Configure Environment Variables

Create `.env`:

```env
# Google Cloud
GOOGLE_CLOUD_PROJECT=skillsense-hackathon
GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json

# Firestore
FIRESTORE_DATABASE_ID=(default)

# Vertex AI
VERTEX_AI_LOCATION=us-central1
VERTEX_AI_ENDPOINT=us-central1-aiplatform.googleapis.com

# Document AI
DOCUMENT_AI_PROCESSOR_ID=your-processor-id
# Create processor: gcloud documentai processors create --type=FORM_PARSER_PROCESSOR --location=us

# Cloud Storage (for CV/document uploads)
CV_BUCKET=skillsense-uploads

# Google Custom Search (for web/blog discovery)
GOOGLE_CUSTOM_SEARCH_API_KEY=your-api-key
# Get key: https://developers.google.com/custom-search/v1/overview
GOOGLE_SEARCH_ENGINE_ID=your-search-engine-id
# Create search engine: https://programmablesearchengine.google.com/

# GitHub (for repo search)
GITHUB_TOKEN=your-github-token

# Weaviate
WEAVIATE_SCHEME=http
WEAVIATE_HOST=localhost:8080
WEAVIATE_API_KEY=

# Redis (Memorystore)
REDIS_HOST=localhost
REDIS_PORT=6379

# Cloud Tasks
CLOUD_TASKS_QUEUE=skillsense-ingestion
CLOUD_TASKS_LOCATION=us-central1

# API Config
PORT=3000
NODE_ENV=development
API_BASE_URL=http://localhost:3000
```

**Important Google APIs to Enable:**

```bash
# Enable all required Google APIs
gcloud services enable \
  documentai.googleapis.com \
  customsearch.googleapis.com \
  storage.googleapis.com
```

### Step 2.4: Add Dockerfile for Cloud Run

Create `apps/api-nest/Dockerfile`:

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY apps/api-nest/package*.json ./apps/api-nest/

# Install dependencies
RUN npm ci

# Copy source
COPY apps/api-nest ./apps/api-nest
COPY libs ./libs

# Build
WORKDIR /app/apps/api-nest
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy built app
COPY --from=builder /app/apps/api-nest/dist ./dist
COPY --from=builder /app/apps/api-nest/node_modules ./node_modules
COPY --from=builder /app/apps/api-nest/package*.json ./

EXPOSE 8080

CMD ["node", "dist/main"]
```

### Step 2.5: Set Up Vertex AI Integration with Document AI & Gemini

Create `apps/api-nest/src/ai/vertex-ai.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { PredictionServiceClient } from '@google-cloud/aiplatform';
import { DocumentProcessorServiceClient } from '@google-cloud/documentai';
import { Storage } from '@google-cloud/storage';
import { helpers } from '@google-cloud/aiplatform';

@Injectable()
export class VertexAiService {
  private aiClient: PredictionServiceClient;
  private docAiClient: DocumentProcessorServiceClient;
  private storage: Storage;
  private project = process.env.GOOGLE_CLOUD_PROJECT;
  private location = process.env.VERTEX_AI_LOCATION || 'us-central1';

  constructor() {
    this.aiClient = new PredictionServiceClient({
      apiEndpoint: `${this.location}-aiplatform.googleapis.com`,
    });
    this.docAiClient = new DocumentProcessorServiceClient();
    this.storage = new Storage();
  }

  /**
   * Upload file to Cloud Storage and return URI
   */
  async uploadToStorage(file: Buffer, filename: string): Promise<string> {
    const bucket = this.storage.bucket(process.env.CV_BUCKET || 'skillsense-uploads');
    const blob = bucket.file(filename);
    
    await blob.save(file);
    
    return `gs://${bucket.name}/${filename}`;
  }

  /**
   * Process CV/document using Document AI
   */
  async processDocument(storageUri: string): Promise<any> {
    const processorName = `projects/${this.project}/locations/${this.location}/processors/${process.env.DOCUMENT_AI_PROCESSOR_ID}`;
    
    const request = {
      name: processorName,
      gcsDocument: {
        gcsUri: storageUri,
        mimeType: 'application/pdf',
      },
    };

    const [result] = await this.docAiClient.processDocument(request);
    const { document } = result;
    
    return {
      text: document.text,
      entities: document.entities,
      pages: document.pages,
    };
  }

  /**
   * Process PDF directly with Gemini Pro Vision (multimodal)
   */
  async analyzePdfWithGemini(storageUri: string): Promise<string> {
    const endpoint = `projects/${this.project}/locations/${this.location}/publishers/google/models/gemini-pro-vision`;
    
    const prompt = `
Analyze this CV/resume document and extract:
1. All technical skills (programming languages, frameworks, tools)
2. Soft skills (leadership, communication, etc.)
3. Domain expertise
4. Work experience highlights
5. Education and certifications

Return structured JSON with evidence snippets for each skill.
`;

    const instance = helpers.toValue({
      contents: [{
        role: 'user',
        parts: [
          { text: prompt },
          { fileData: { mimeType: 'application/pdf', fileUri: storageUri } }
        ]
      }]
    });

    const request = {
      endpoint,
      instances: [instance],
    };

    const [response] = await this.aiClient.predict(request);
    const predictions = helpers.fromValue(response.predictions[0]);
    
    return predictions.content;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const endpoint = `projects/${this.project}/locations/${this.location}/publishers/google/models/text-embedding-gecko@latest`;
    
    const instance = helpers.toValue({
      content: text,
    });

    const request = {
      endpoint,
      instances: [instance],
    };

    const [response] = await this.aiClient.predict(request);
    const predictions = helpers.fromValue(response.predictions[0]);
    
    return predictions.embeddings.values;
  }

  /**
   * Extract skills using Gemini with function calling
   */
  async extractSkillsWithFunctionCalling(text: string, availableTools: any[]): Promise<any> {
    const endpoint = `projects/${this.project}/locations/${this.location}/publishers/google/models/gemini-pro`;
    
    const prompt = `
You are a skill extraction expert. Analyze the following text and extract all professional skills.
For each skill, provide:
- name: the skill name
- category: programming|tool|soft-skill|domain-knowledge|framework|language
- confidence: 0-1 score
- evidence: brief text snippet

If you need more information, call the appropriate search tools.

Text to analyze:
${text}

Respond with JSON array: [{ name, category, confidence, evidence }]
`;

    const instance = helpers.toValue({
      contents: [{
        role: 'user',
        parts: [{ text: prompt }]
      }],
      tools: availableTools, // Gemini will decide which tools to call
      toolConfig: {
        functionCallingConfig: {
          mode: 'AUTO' // or 'ANY' to force tool use
        }
      }
    });

    const request = {
      endpoint,
      instances: [instance],
    };

    const [response] = await this.aiClient.predict(request);
    const predictions = helpers.fromValue(response.predictions[0]);
    
    // Handle function calls if Gemini requested them
    if (predictions.functionCalls) {
      // Execute the requested functions and continue conversation
      // This would involve calling your connector extensions
    }
    
    return JSON.parse(predictions.content);
  }

  /**
   * Search web using Google Custom Search API (for agent grounding)
   */
  async searchWeb(query: string): Promise<any[]> {
    const customSearchApiKey = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY;
    const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;
    
    const url = `https://www.googleapis.com/customsearch/v1?key=${customSearchApiKey}&cx=${searchEngineId}&q=${encodeURIComponent(query)}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    return data.items || [];
  }
}
```

### Step 2.6: Set Up Weaviate Integration

Create `apps/api-nest/src/ai/weaviate.service.ts`:

```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import weaviate, { WeaviateClient } from 'weaviate-ts-client';

@Injectable()
export class WeaviateService implements OnModuleInit {
  private client: WeaviateClient;

  async onModuleInit() {
    this.client = weaviate.client({
      scheme: process.env.WEAVIATE_SCHEME || 'http',
      host: process.env.WEAVIATE_HOST || 'localhost:8080',
    });

    await this.initializeSchema();
  }

  private async initializeSchema() {
    // Create Evidence class
    const evidenceClass = {
      class: 'Evidence',
      description: 'Skill evidence from various sources',
      vectorizer: 'none', // We provide embeddings from Vertex AI
      properties: [
        { name: 'personId', dataType: ['string'] },
        { name: 'sourceType', dataType: ['string'] },
        { name: 'sourceId', dataType: ['string'] },
        { name: 'snippet', dataType: ['text'] },
        { name: 'metadata', dataType: ['object'] },
        { name: 'confidence', dataType: ['number'] },
        { name: 'createdAt', dataType: ['date'] },
      ],
    };

    // Create Skill class
    const skillClass = {
      class: 'Skill',
      description: 'Professional skills',
      vectorizer: 'none',
      properties: [
        { name: 'personId', dataType: ['string'] },
        { name: 'name', dataType: ['string'] },
        { name: 'category', dataType: ['string'] },
        { name: 'confidence', dataType: ['number'] },
        { name: 'evidenceIds', dataType: ['string[]'] },
        { name: 'confirmedByUser', dataType: ['boolean'] },
      ],
    };

    try {
      await this.client.schema.classCreator().withClass(evidenceClass).do();
      await this.client.schema.classCreator().withClass(skillClass).do();
    } catch (error) {
      // Classes may already exist
      console.log('Schema classes already exist or error:', error.message);
    }
  }

  async addEvidence(data: {
    personId: string;
    sourceType: string;
    sourceId: string;
    snippet: string;
    metadata?: any;
    confidence: number;
    embedding: number[];
  }): Promise<string> {
    const result = await this.client.data
      .creator()
      .withClassName('Evidence')
      .withProperties({
        personId: data.personId,
        sourceType: data.sourceType,
        sourceId: data.sourceId,
        snippet: data.snippet,
        metadata: data.metadata,
        confidence: data.confidence,
        createdAt: new Date().toISOString(),
      })
      .withVector(data.embedding)
      .do();

    return result.id;
  }

  async searchSimilarEvidence(
    embedding: number[],
    personId?: string,
    limit = 10,
  ): Promise<any[]> {
    let query = this.client.graphql
      .get()
      .withClassName('Evidence')
      .withFields('personId sourceType snippet confidence _additional { distance }')
      .withNearVector({ vector: embedding })
      .withLimit(limit);

    if (personId) {
      query = query.withWhere({
        path: ['personId'],
        operator: 'Equal',
        valueString: personId,
      });
    }

    const result = await query.do();
    return result.data.Get.Evidence;
  }
}
```

### Step 2.7: Implement Queue Manager (Based on Reference)

Create `apps/api-nest/src/queue/queue-manager.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { CloudTasksClient } from '@google-cloud/tasks';

@Injectable()
export class QueueManagerService {
  private client: CloudTasksClient;
  private project = process.env.GOOGLE_CLOUD_PROJECT;
  private location = process.env.CLOUD_TASKS_LOCATION || 'us-central1';
  private queue = process.env.CLOUD_TASKS_QUEUE || 'skillsense-ingestion';

  constructor() {
    this.client = new CloudTasksClient();
  }

  async enqueueIngestionJob(payload: {
    personId: string;
    sourceType: string;
    sourceData: any;
  }): Promise<string> {
    const parent = this.client.queuePath(this.project, this.location, this.queue);

    const task = {
      httpRequest: {
        httpMethod: 'POST',
        url: `${process.env.API_BASE_URL}/api/ingest/process`,
        headers: {
          'Content-Type': 'application/json',
        },
        body: Buffer.from(JSON.stringify(payload)).toString('base64'),
      },
    };

    const [response] = await this.client.createTask({ parent, task });
    return response.name;
  }
}
```

---

## Phase 3: Shared Libraries Setup

### Step 3.1: Domain Types Library

Create `libs/domain/package.json`:

```json
{
  "name": "@skillsense/domain",
  "version": "1.0.0",
  "main": "index.ts",
  "types": "index.ts"
}
```

Create `libs/domain/index.ts`:

```typescript
export interface Person {
  id: string;
  name?: string;
  email?: string;
  profileIds?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Skill {
  id: string;
  personId: string;
  name: string;
  category?: SkillCategory;
  confidence: number; // 0-1
  evidenceIds: string[];
  confirmedByUser: boolean;
  createdAt: Date;
}

export type SkillCategory = 
  | 'programming'
  | 'soft-skill'
  | 'tool'
  | 'framework'
  | 'language'
  | 'domain-knowledge';

export interface Evidence {
  id: string;
  personId: string;
  sourceType: SourceType;
  sourceId: string;
  snippet: string;
  metadata?: Record<string, any>;
  embeddingId?: string;
  confidence: number;
  createdAt: Date;
}

export type SourceType = 
  | 'cv'
  | 'github'
  | 'linkedin'
  | 'blog'
  | 'publication'
  | 'doc'
  | 'agent-search';

export interface JobPosting {
  id: string;
  title: string;
  description: string;
  requiredSkills: string[];
  preferredSkills: string[];
  embeddingId?: string;
  createdAt: Date;
}

export interface IngestionJob {
  id: string;
  personId: string;
  sourceType: SourceType;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  errors?: string[];
  createdAt: Date;
  updatedAt: Date;
}
```

### Step 3.2: Connectors Library

Create `libs/connectors/package.json`:

```json
{
  "name": "@skillsense/connectors",
  "version": "1.0.0",
  "main": "index.ts",
  "dependencies": {
    "axios": "^1.6.0",
    "@octokit/rest": "^20.0.0",
    "@google-cloud/storage": "^7.7.0"
  }
}
```

Create `libs/connectors/github.connector.ts`:

```typescript
import { Octokit } from '@octokit/rest';

export class GitHubConnector {
  private octokit: Octokit;

  constructor(token?: string) {
    this.octokit = new Octokit({ auth: token });
  }

  async getUserRepos(username: string) {
    const { data } = await this.octokit.repos.listForUser({
      username,
      sort: 'updated',
      per_page: 100,
    });
    return data;
  }

  async getRepoReadme(owner: string, repo: string) {
    try {
      const { data } = await this.octokit.repos.getReadme({ owner, repo });
      const content = Buffer.from(data.content, 'base64').toString('utf-8');
      return content;
    } catch {
      return null;
    }
  }

  async getRepoLanguages(owner: string, repo: string) {
    const { data } = await this.octokit.repos.listLanguages({ owner, repo });
    return Object.keys(data);
  }

  async getUserCommits(username: string, since?: Date) {
    const repos = await this.getUserRepos(username);
    const commits = [];

    for (const repo of repos.slice(0, 10)) {
      try {
        const { data } = await this.octokit.repos.listCommits({
          owner: repo.owner.login,
          repo: repo.name,
          author: username,
          since: since?.toISOString(),
          per_page: 50,
        });
        commits.push(...data.map(c => ({
          repo: repo.name,
          message: c.commit.message,
          date: c.commit.author.date,
          sha: c.sha,
        })));
      } catch {
        // Skip repos with no access
      }
    }

    return commits;
  }

  /**
   * Agent search function for Gemini function calling
   * This will be exposed as a tool for the AI agent
   */
  async agentSearchGitHub(params: { username: string, query?: string }): Promise<any> {
    const { username, query } = params;
    
    // Get repos and filter by query if provided
    const repos = await this.getUserRepos(username);
    const commits = await this.getUserCommits(username);
    
    // Extract skills from repo data
    const languages = new Set<string>();
    const topics = new Set<string>();
    
    for (const repo of repos) {
      const langs = await this.getRepoLanguages(repo.owner.login, repo.name);
      langs.forEach(l => languages.add(l));
      
      if (repo.topics) {
        repo.topics.forEach(t => topics.add(t));
      }
    }
    
    return {
      username,
      repos: repos.length,
      commits: commits.length,
      languages: Array.from(languages),
      topics: Array.from(topics),
      recentActivity: commits.slice(0, 10),
    };
  }
}
```

### Step 3.3: Create Vertex AI Agent Extensions

Create `apps/api-nest/src/agent/extensions.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { GitHubConnector } from '@skillsense/connectors';

/**
 * Define tools/extensions that Vertex AI Agent can call
 * These follow the OpenAPI schema format required by Vertex AI
 */
@Injectable()
export class ExtensionsService {
  /**
   * Get OpenAPI schema for GitHub search extension
   */
  getGitHubSearchExtension() {
    return {
      name: 'search_github',
      description: 'Search GitHub repositories, commits, and contributions for a user to identify technical skills',
      parameters: {
        type: 'object',
        properties: {
          username: {
            type: 'string',
            description: 'GitHub username to search for'
          },
          query: {
            type: 'string',
            description: 'Optional search query to filter results'
          }
        },
        required: ['username']
      }
    };
  }

  /**
   * Get all available extensions for Gemini function calling
   */
  getAllExtensions() {
    return {
      functionDeclarations: [
        this.getGitHubSearchExtension(),
        {
          name: 'search_web',
          description: 'Search the web using Google Custom Search to find blogs, articles, and publications',
          parameters: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Search query'
              },
              siteSearch: {
                type: 'string',
                description: 'Limit search to specific domain (e.g., medium.com)'
              }
            },
            required: ['query']
          }
        },
        {
          name: 'search_google_scholar',
          description: 'Search academic publications on Google Scholar',
          parameters: {
            type: 'object',
            properties: {
              author: {
                type: 'string',
                description: 'Author name'
              },
              query: {
                type: 'string',
                description: 'Publication topic or keyword'
              }
            },
            required: ['author']
          }
        }
      ]
    };
  }

  /**
   * Execute a function call requested by Gemini
   */
  async executeFunction(functionName: string, args: any): Promise<any> {
    switch (functionName) {
      case 'search_github':
        const githubConnector = new GitHubConnector(process.env.GITHUB_TOKEN);
        return await githubConnector.agentSearchGitHub(args);
      
      case 'search_web':
        // Implement web search using Custom Search API
        return await this.searchWeb(args.query, args.siteSearch);
      
      case 'search_google_scholar':
        // Implement Scholar search
        return await this.searchScholar(args);
      
      default:
        throw new Error(`Unknown function: ${functionName}`);
    }
  }

  private async searchWeb(query: string, siteSearch?: string): Promise<any> {
    // Implementation using Google Custom Search API
    // This would call the searchWeb method from VertexAiService
    return { results: [] };
  }

  private async searchScholar(params: any): Promise<any> {
    // Implementation for Google Scholar search
    return { publications: [] };
  }
}
```

### Step 3.4: Create Agent Orchestrator

Create `apps/api-nest/src/agent/agent-orchestrator.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { VertexAiService } from '../ai/vertex-ai.service';
import { ExtensionsService } from './extensions.service';
import { helpers } from '@google-cloud/aiplatform';

@Injectable()
export class AgentOrchestratorService {
  constructor(
    private vertexAi: VertexAiService,
    private extensions: ExtensionsService,
  ) {}

  /**
   * Run multi-source agent search with Gemini function calling
   */
  async runAgentSearch(params: {
    personId: string;
    sources: string[];
    userData: any;
  }): Promise<any> {
    const { personId, sources, userData } = params;
    
    // Build initial prompt
    const prompt = `
You are a comprehensive skill discovery agent. Your task is to find ALL professional skills for the following person by searching multiple sources.

Person data: ${JSON.stringify(userData)}

Sources to search: ${sources.join(', ')}

For each source:
1. Call the appropriate search function
2. Extract skills from the results
3. Provide evidence snippets

Use the available tools to gather comprehensive data. Return a structured JSON with all discovered skills and their evidence.
`;

    const tools = this.extensions.getAllExtensions();
    let conversationHistory = [
      {
        role: 'user',
        parts: [{ text: prompt }]
      }
    ];

    let maxIterations = 5;
    let iteration = 0;
    const discoveredSkills = [];

    // Agent loop: Gemini calls functions until it has enough data
    while (iteration < maxIterations) {
      const response = await this.vertexAi.extractSkillsWithFunctionCalling(
        prompt,
        [tools]
      );

      // Check if Gemini wants to call a function
      if (response.functionCalls) {
        for (const functionCall of response.functionCalls) {
          // Execute the function
          const result = await this.extensions.executeFunction(
            functionCall.name,
            functionCall.args
          );

          // Add function result to conversation
          conversationHistory.push({
            role: 'function',
            parts: [{
              functionResponse: {
                name: functionCall.name,
                response: result
              }
            }]
          });
        }
      } else {
        // No more function calls, agent is done
        discoveredSkills.push(...response);
        break;
      }

      iteration++;
    }

    return {
      personId,
      skills: discoveredSkills,
      sourcesSearched: sources,
      iterations: iteration
    };
  }
}
```

---

## Phase 4: Frontend (Angular) Setup

### Step 4.1: Scaffold Angular App

```bash
cd apps/web-angular
ng new . --routing --style=scss --skip-git
```

Update `package.json`:

```json
{
  "name": "web-angular",
  "scripts": {
    "ng": "ng",
    "start": "ng serve",
    "build": "ng build",
    "build:prod": "ng build --configuration production",
    "test": "ng test",
    "lint": "ng lint"
  },
  "dependencies": {
    "@angular/animations": "^17.0.0",
    "@angular/common": "^17.0.0",
    "@angular/compiler": "^17.0.0",
    "@angular/core": "^17.0.0",
    "@angular/fire": "^17.0.0",
    "@angular/forms": "^17.0.0",
    "@angular/material": "^17.0.0",
    "@angular/platform-browser": "^17.0.0",
    "@angular/router": "^17.0.0",
    "rxjs": "^7.8.0",
    "firebase": "^10.7.0"
  }
}
```

### Step 4.2: Generate Core Modules

```bash
ng generate module core --module app
ng generate module shared --module app
ng generate module features/profile --module app
ng generate module features/ingest --module app
ng generate module features/matches --module app
ng generate module features/admin --module app
```

### Step 4.3: Set Up Firebase Auth

```bash
ng add @angular/fire
```

Create `apps/web-angular/src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  firebase: {
    apiKey: 'YOUR_API_KEY',
    authDomain: 'skillsense-hackathon.firebaseapp.com',
    projectId: 'skillsense-hackathon',
    storageBucket: 'skillsense-hackathon.appspot.com',
    messagingSenderId: 'YOUR_SENDER_ID',
    appId: 'YOUR_APP_ID',
  },
  apiUrl: 'http://localhost:3000/api',
};
```

---

## Phase 5: Infrastructure Setup

### Step 5.1: Deploy Weaviate on GKE

Option A: Use Weaviate Cloud Service (WCS) - Recommended for hackathon speed
- Sign up at https://console.weaviate.cloud
- Create cluster, copy URL and API key
- Update `.env` with Weaviate credentials

Option B: Deploy on GKE

Create `infrastructure/terraform/weaviate.tf`:

```hcl
resource "google_container_cluster" "weaviate" {
  name     = "weaviate-cluster"
  location = "us-central1-a"
  
  initial_node_count = 1
  
  node_config {
    machine_type = "e2-standard-4"
    disk_size_gb = 50
  }
}

resource "kubernetes_deployment" "weaviate" {
  metadata {
    name = "weaviate"
  }
  
  spec {
    replicas = 1
    
    selector {
      match_labels = {
        app = "weaviate"
      }
    }
    
    template {
      metadata {
        labels = {
          app = "weaviate"
        }
      }
      
      spec {
        container {
          image = "semitechnologies/weaviate:latest"
          name  = "weaviate"
          
          port {
            container_port = 8080
          }
          
          env {
            name  = "QUERY_DEFAULTS_LIMIT"
            value = "25"
          }
        }
      }
    }
  }
}
```

### Step 5.2: Create Cloud Tasks Queue

```bash
gcloud tasks queues create skillsense-ingestion \
  --location=us-central1 \
  --max-dispatches-per-second=10 \
  --max-concurrent-dispatches=5
```

### Step 5.3: Set Up Memorystore (Redis)

```bash
gcloud redis instances create skillsense-cache \
  --size=1 \
  --region=us-central1 \
  --redis-version=redis_7_0
```

---

## Phase 6: Sample Data & Testing

### Step 6.1: Create Synthetic CVs

Create `tools/sample-data/cv-samples/john-doe.json`:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "experience": [
    {
      "title": "Senior Software Engineer",
      "company": "Tech Corp",
      "duration": "2020-2023",
      "description": "Led development of microservices using Node.js and TypeScript. Implemented CI/CD pipelines with GitHub Actions. Managed team of 5 engineers."
    }
  ],
  "education": [
    {
      "degree": "BS Computer Science",
      "school": "University of Tech",
      "year": 2019
    }
  ],
  "skills": ["JavaScript", "TypeScript", "Node.js", "Docker", "Kubernetes"]
}
```

### Step 6.2: Create Test Scripts

Create `tools/scripts/test-ingestion.sh`:

```bash
#!/bin/bash

API_URL=${API_URL:-http://localhost:3000}

echo "Testing CV ingestion..."
curl -X POST "$API_URL/api/ingest" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceType": "cv",
    "payload": {
      "file": "./tools/sample-data/cv-samples/john-doe.json"
    }
  }'

echo "\nTesting GitHub ingestion..."
curl -X POST "$API_URL/api/ingest" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceType": "github",
    "payload": {
      "username": "octocat"
    }
  }'
```

---

## Phase 7: Deployment

### Step 7.1: Deploy Nest API to Cloud Run

```bash
cd apps/api-nest

# Build and deploy
gcloud run deploy skillsense-api \
  --source . \
  --region=us-central1 \
  --allow-unauthenticated \
  --set-env-vars="GOOGLE_CLOUD_PROJECT=skillsense-hackathon,VERTEX_AI_LOCATION=us-central1"
```

### Step 7.2: Deploy Angular to Firebase Hosting

```bash
cd apps/web-angular

# Build
npm run build:prod

# Initialize Firebase (if not done)
firebase init hosting

# Deploy
firebase deploy --only hosting
```

---

## Phase 8: CI/CD Setup

### Step 8.1: GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy SkillSense

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint
      - run: npm run test

  deploy-api:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: google-github-actions/auth@v1
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}
      - uses: google-github-actions/setup-gcloud@v1
      - run: |
          gcloud run deploy skillsense-api \
            --source apps/api-nest \
            --region us-central1

  deploy-web:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build:prod --workspace=apps/web-angular
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SA_KEY }}'
          channelId: live
```

---

## Next Steps

1. ✅ **Scaffolding complete** - Monorepo structure ready
2. 🚀 **Next**: Implement connector agents (GitHub, LinkedIn, CV parsers)
3. 🚀 **Next**: Build NLP pipeline with Vertex AI
4. 🚀 **Next**: Create Angular UI components
5. 🚀 **Next**: Integrate Weaviate vector search
6. 🚀 **Next**: Add authentication and privacy controls

---

## Quick Start Commands

```bash
# Install all dependencies
npm install

# Start backend dev server
npm run start:api

# Start frontend dev server (in separate terminal)
npm run start:web

# Run tests
npm run test

# Deploy to production
npm run deploy:api
npm run deploy:web
```

---

## Troubleshooting

### Common Issues

1. **Vertex AI authentication errors**:
   - Ensure service account has `aiplatform.user` role
   - Check `GOOGLE_APPLICATION_CREDENTIALS` path

2. **Weaviate connection errors**:
   - Verify Weaviate is running: `curl http://localhost:8080/v1/.well-known/ready`
   - Check firewall rules if using GKE

3. **Cloud Tasks queue not found**:
   - Create queue: `gcloud tasks queues create skillsense-ingestion`

4. **Firebase deployment fails**:
   - Run `firebase login` and select correct project
   - Verify `firebase.json` configuration

---

## Additional Resources

- [Vertex AI Documentation](https://cloud.google.com/vertex-ai/docs)
- [Weaviate Documentation](https://weaviate.io/developers/weaviate)
- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [NestJS Documentation](https://docs.nestjs.com)
- [Angular Documentation](https://angular.io/docs)

---

Ready to start implementation! Let me know if you need detailed code for any specific connector or module.
