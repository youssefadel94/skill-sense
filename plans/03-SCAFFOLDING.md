# SkillSense - Project Scaffolding Guide

**Version:** 1.0  
**Date:** November 8, 2025

This document provides executable commands to scaffold the complete SkillSense project structure.

---

## Quick Start

```bash
# Clone or create project directory
mkdir skill-sense
cd skill-sense

# Run scaffolding
# Option 1: Use automated script
chmod +x scaffold.sh
./scaffold.sh

# Option 2: Follow manual steps below
```

---

## Manual Scaffolding Steps

### Step 1: Initialize Root Workspace (5 min)

```bash
# Initialize package.json
npm init -y

# Configure npm workspaces
cat > package.json << 'EOF'
{
  "name": "skill-sense",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "apps/*",
    "projects/*"
  ],
  "scripts": {
    "install:all": "npm install && cd apps/skill-sense-api && npm install",
    "build:api": "cd apps/skill-sense-api && npm run build",
    "build:web": "ng build skill-sense-shell --configuration production",
    "start:api": "cd apps/skill-sense-api && npm run start:dev",
    "start:web": "ng serve skill-sense-shell --open",
    "test:api": "cd apps/skill-sense-api && npm run test",
    "test:web": "ng test",
    "deploy:api": "gcloud run deploy skill-sense-api --source apps/skill-sense-api --region us-central1 --allow-unauthenticated",
    "deploy:web": "ng build skill-sense-shell --configuration production && firebase deploy --only hosting"
  },
  "devDependencies": {
    "@angular/cli": "^17.0.0",
    "@nestjs/cli": "^10.0.0",
    "typescript": "^5.0.0"
  }
}
EOF

# Install dev dependencies
npm install
```

### Step 2: Scaffold NestJS Backend (10 min)

```bash
# Create apps directory
mkdir -p apps

# Generate NestJS app
npx @nestjs/cli new skill-sense-api --directory apps/skill-sense-api --package-manager npm --skip-git

# Navigate to API
cd apps/skill-sense-api

# Install backend dependencies
npm install --save \
  @google-cloud/vertexai \
  @google-cloud/firestore \
  @google-cloud/storage \
  @nestjs/config \
  class-validator \
  class-transformer \
  weaviate-ts-client \
  @octokit/rest \
  uuid

npm install --save-dev \
  @types/uuid

# Create directory structure
mkdir -p src/shared/services
mkdir -p src/modules/profile
mkdir -p src/modules/extraction
mkdir -p src/modules/connectors/cv
mkdir -p src/modules/connectors/github
mkdir -p src/modules/connectors/web
mkdir -p src/modules/search
mkdir -p src/modules/health

# Return to root
cd ../..
```

### Step 3: Create Shared Module Structure (5 min)

```bash
# Create shared.module.ts
cat > apps/skill-sense-api/src/shared/shared.module.ts << 'EOF'
import { Module, Global } from '@nestjs/common';
import { FirestoreService } from './services/firestore.service';
import { VertexAIService } from './services/vertex-ai.service';
import { WeaviateService } from './services/weaviate.service';
import { GcsService } from './services/gcs.service';
import { JobQueueService } from './services/job-queue.service';

@Global()
@Module({
  providers: [
    FirestoreService,
    VertexAIService,
    WeaviateService,
    GcsService,
    JobQueueService,
  ],
  exports: [
    FirestoreService,
    VertexAIService,
    WeaviateService,
    GcsService,
    JobQueueService,
  ],
})
export class SharedModule {}
EOF

# Create service stubs
touch apps/skill-sense-api/src/shared/services/firestore.service.ts
touch apps/skill-sense-api/src/shared/services/vertex-ai.service.ts
touch apps/skill-sense-api/src/shared/services/weaviate.service.ts
touch apps/skill-sense-api/src/shared/services/gcs.service.ts
touch apps/skill-sense-api/src/shared/services/job-queue.service.ts
```

### Step 4: Create Feature Modules (10 min)

```bash
# Profile Module
cat > apps/skill-sense-api/src/modules/profile/profile.module.ts << 'EOF'
import { Module } from '@nestjs/common';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';

@Module({
  controllers: [ProfileController],
  providers: [ProfileService],
  exports: [ProfileService],
})
export class ProfileModule {}
EOF

touch apps/skill-sense-api/src/modules/profile/profile.controller.ts
touch apps/skill-sense-api/src/modules/profile/profile.service.ts

# Extraction Module
cat > apps/skill-sense-api/src/modules/extraction/extraction.module.ts << 'EOF'
import { Module } from '@nestjs/common';
import { ExtractionController } from './extraction.controller';
import { ExtractionService } from './extraction.service';
import { ConnectorsModule } from '../connectors/connectors.module';

@Module({
  imports: [ConnectorsModule],
  controllers: [ExtractionController],
  providers: [ExtractionService],
})
export class ExtractionModule {}
EOF

touch apps/skill-sense-api/src/modules/extraction/extraction.controller.ts
touch apps/skill-sense-api/src/modules/extraction/extraction.service.ts

# Connectors Module
cat > apps/skill-sense-api/src/modules/connectors/connectors.module.ts << 'EOF'
import { Module } from '@nestjs/common';
import { CvParserService } from './cv/cv-parser.service';
import { GithubConnectorService } from './github/github-connector.service';
import { WebSearchService } from './web/web-search.service';

@Module({
  providers: [CvParserService, GithubConnectorService, WebSearchService],
  exports: [CvParserService, GithubConnectorService, WebSearchService],
})
export class ConnectorsModule {}
EOF

touch apps/skill-sense-api/src/modules/connectors/cv/cv-parser.service.ts
touch apps/skill-sense-api/src/modules/connectors/github/github-connector.service.ts
touch apps/skill-sense-api/src/modules/connectors/web/web-search.service.ts

# Search Module
cat > apps/skill-sense-api/src/modules/search/search.module.ts << 'EOF'
import { Module } from '@nestjs/common';
import { SearchController } from './search.controller';
import { VectorSearchService } from './vector-search.service';

@Module({
  controllers: [SearchController],
  providers: [VectorSearchService],
})
export class SearchModule {}
EOF

touch apps/skill-sense-api/src/modules/search/search.controller.ts
touch apps/skill-sense-api/src/modules/search/vector-search.service.ts

# Health Module
cat > apps/skill-sense-api/src/modules/health/health.module.ts << 'EOF'
import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';

@Module({
  controllers: [HealthController],
})
export class HealthModule {}
EOF

touch apps/skill-sense-api/src/modules/health/health.controller.ts
```

### Step 5: Update App Module (5 min)

```bash
cat > apps/skill-sense-api/src/app.module.ts << 'EOF'
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SharedModule } from './shared/shared.module';
import { ProfileModule } from './modules/profile/profile.module';
import { ExtractionModule } from './modules/extraction/extraction.module';
import { ConnectorsModule } from './modules/connectors/connectors.module';
import { SearchModule } from './modules/search/search.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    SharedModule,
    ProfileModule,
    ExtractionModule,
    ConnectorsModule,
    SearchModule,
    HealthModule,
  ],
})
export class AppModule {}
EOF
```

### Step 6: Configure TypeScript (5 min)

```bash
# Update tsconfig.json for strict mode
cat > apps/skill-sense-api/tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2021",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strict": true,
    "strictNullChecks": true,
    "noImplicitAny": true,
    "strictBindCallApply": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
EOF
```

### Step 7: Scaffold Angular Frontend (15 min)

```bash
# Initialize Angular workspace (if not exists)
ng new skill-sense-shell --directory . --skip-git --routing --style scss

# Create Angular libraries
ng generate library skill-sense-core --project-root projects/skill-sense-core
ng generate library skill-sense-ui --project-root projects/skill-sense-ui
ng generate library skill-sense-profile --project-root projects/skill-sense-profile
ng generate library skill-sense-sources --project-root projects/skill-sense-sources

# Install Angular dependencies
npm install --save \
  @angular/material \
  @angular/fire \
  @ngrx/signals \
  @ngrx/store

# Create public APIs
cat > projects/skill-sense-core/src/public-api.ts << 'EOF'
// Models
export * from './lib/models/profile.model';
export * from './lib/models/skill.model';
export * from './lib/models/evidence.model';

// Services
export * from './lib/services/api.service';
export * from './lib/services/skill.service';

// Stores
export * from './lib/stores/skill.store';
EOF

cat > projects/skill-sense-ui/src/public-api.ts << 'EOF'
// Components
export * from './lib/skill-card/skill-card.component';
export * from './lib/evidence-viewer/evidence-viewer.component';
export * from './lib/confidence-badge/confidence-badge.component';
export * from './lib/loading-spinner/loading-spinner.component';
EOF

cat > projects/skill-sense-profile/src/public-api.ts << 'EOF'
// Components
export * from './lib/profile-view/profile-view.component';
export * from './lib/skill-list/skill-list.component';
export * from './lib/skill-detail/skill-detail.component';
EOF

cat > projects/skill-sense-sources/src/public-api.ts << 'EOF'
// Components
export * from './lib/cv-upload/cv-upload.component';
export * from './lib/github-connect/github-connect.component';
export * from './lib/web-analyze/web-analyze.component';
EOF
```

### Step 8: Create Directory Structure for Angular (5 min)

```bash
# Create model directories
mkdir -p projects/skill-sense-core/src/lib/models
mkdir -p projects/skill-sense-core/src/lib/services
mkdir -p projects/skill-sense-core/src/lib/stores

# Create component directories
mkdir -p projects/skill-sense-ui/src/lib/skill-card
mkdir -p projects/skill-sense-ui/src/lib/evidence-viewer
mkdir -p projects/skill-sense-ui/src/lib/confidence-badge
mkdir -p projects/skill-sense-ui/src/lib/loading-spinner

mkdir -p projects/skill-sense-profile/src/lib/profile-view
mkdir -p projects/skill-sense-profile/src/lib/skill-list
mkdir -p projects/skill-sense-profile/src/lib/skill-detail

mkdir -p projects/skill-sense-sources/src/lib/cv-upload
mkdir -p projects/skill-sense-sources/src/lib/github-connect
mkdir -p projects/skill-sense-sources/src/lib/web-analyze

# Create model stubs
touch projects/skill-sense-core/src/lib/models/profile.model.ts
touch projects/skill-sense-core/src/lib/models/skill.model.ts
touch projects/skill-sense-core/src/lib/models/evidence.model.ts

# Create service stubs
touch projects/skill-sense-core/src/lib/services/api.service.ts
touch projects/skill-sense-core/src/lib/services/skill.service.ts

# Create store stub
touch projects/skill-sense-core/src/lib/stores/skill.store.ts
```

### Step 9: Configure Firebase (5 min)

```bash
# Initialize Firebase
firebase init

# Select:
# - Hosting
# - Use existing project or create new one
# - Public directory: dist/skill-sense-shell/browser
# - Configure as SPA: Yes
# - Set up automatic builds: No

# Create firebase.json
cat > firebase.json << 'EOF'
{
  "hosting": {
    "public": "dist/skill-sense-shell/browser",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "no-cache, no-store, must-revalidate"
          }
        ]
      },
      {
        "source": "**/*.@(jpg|jpeg|gif|png|svg|webp|js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      }
    ]
  }
}
EOF
```

### Step 10: Environment Configuration (5 min)

```bash
# Backend .env
cat > apps/skill-sense-api/.env << 'EOF'
# GCP
GCP_PROJECT_ID=your-project-id
GCP_LOCATION=us-central1
GCS_BUCKET_NAME=skillsense-uploads

# Weaviate
WEAVIATE_HOST=your-cluster.weaviate.network
WEAVIATE_API_KEY=your-api-key

# GitHub
GITHUB_TOKEN=your-github-token

# Port
PORT=3000
EOF

# Frontend environment
mkdir -p projects/skill-sense-shell/src/environments

cat > projects/skill-sense-shell/src/environments/environment.ts << 'EOF'
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
EOF

cat > projects/skill-sense-shell/src/environments/environment.prod.ts << 'EOF'
export const environment = {
  production: true,
  apiUrl: 'https://skill-sense-api-xyz.run.app',
  firebase: {
    apiKey: 'your-api-key',
    authDomain: 'your-project.firebaseapp.com',
    projectId: 'your-project-id',
    storageBucket: 'your-project.appspot.com',
    messagingSenderId: 'your-sender-id',
    appId: 'your-app-id'
  }
};
EOF
```

### Step 11: Create .gitignore (2 min)

```bash
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
dist/
.angular/

# Environment
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Firebase
.firebase/
firebase-debug.log

# Build
*.log
*.tsbuildinfo
EOF
```

### Step 12: Create README (3 min)

```bash
cat > README.md << 'EOF'
# SkillSense

AI-powered skill discovery platform.

## Quick Start

\`\`\`bash
# Install dependencies
npm run install:all

# Start backend
npm run start:api

# Start frontend (in another terminal)
npm run start:web
\`\`\`

## Deployment

\`\`\`bash
# Deploy backend to Cloud Run
npm run deploy:api

# Deploy frontend to Firebase Hosting
npm run deploy:web
\`\`\`

## Documentation

- [Architecture](./plans/01-ARCHITECTURE.md)
- [Implementation Guide](./plans/02-IMPLEMENTATION.md)
- [Scaffolding Guide](./plans/03-SCAFFOLDING.md)
- [Deployment Guide](./plans/04-DEPLOYMENT.md)
EOF
```

---

## Automated Scaffolding Script

Create `scaffold.sh`:

```bash
cat > scaffold.sh << 'SCRIPT'
#!/bin/bash
set -e

echo "🚀 SkillSense - Project Scaffolding"
echo "===================================="

# Step 1: Initialize workspace
echo "📦 Step 1/12: Initializing workspace..."
npm init -y > /dev/null 2>&1

# Step 2: Scaffold NestJS backend
echo "🏗️  Step 2/12: Creating NestJS backend..."
mkdir -p apps
npx @nestjs/cli new skill-sense-api --directory apps/skill-sense-api --package-manager npm --skip-git --skip-install > /dev/null 2>&1

# Step 3: Install backend dependencies
echo "📚 Step 3/12: Installing backend dependencies..."
cd apps/skill-sense-api
npm install --save @google-cloud/vertexai @google-cloud/firestore @google-cloud/storage @nestjs/config class-validator class-transformer weaviate-ts-client @octokit/rest uuid > /dev/null 2>&1
npm install --save-dev @types/uuid > /dev/null 2>&1
cd ../..

# Step 4: Create backend structure
echo "📁 Step 4/12: Creating backend directory structure..."
mkdir -p apps/skill-sense-api/src/shared/services
mkdir -p apps/skill-sense-api/src/modules/{profile,extraction,connectors/{cv,github,web},search,health}

# Step 5: Scaffold Angular frontend
echo "🎨 Step 5/12: Creating Angular frontend..."
npx @angular/cli new skill-sense-shell --directory . --skip-git --routing --style scss --skip-install > /dev/null 2>&1

# Step 6: Create Angular libraries
echo "📚 Step 6/12: Creating Angular libraries..."
npx @angular/cli generate library skill-sense-core --project-root projects/skill-sense-core --skip-install > /dev/null 2>&1
npx @angular/cli generate library skill-sense-ui --project-root projects/skill-sense-ui --skip-install > /dev/null 2>&1
npx @angular/cli generate library skill-sense-profile --project-root projects/skill-sense-profile --skip-install > /dev/null 2>&1
npx @angular/cli generate library skill-sense-sources --project-root projects/skill-sense-sources --skip-install > /dev/null 2>&1

# Step 7: Install frontend dependencies
echo "📦 Step 7/12: Installing frontend dependencies..."
npm install --save @angular/material @angular/fire @ngrx/signals @ngrx/store > /dev/null 2>&1

# Step 8: Create frontend structure
echo "📁 Step 8/12: Creating frontend directory structure..."
mkdir -p projects/skill-sense-core/src/lib/{models,services,stores}
mkdir -p projects/skill-sense-ui/src/lib/{skill-card,evidence-viewer,confidence-badge,loading-spinner}
mkdir -p projects/skill-sense-profile/src/lib/{profile-view,skill-list,skill-detail}
mkdir -p projects/skill-sense-sources/src/lib/{cv-upload,github-connect,web-analyze}

# Step 9: Create environment files
echo "⚙️  Step 9/12: Creating environment files..."
mkdir -p projects/skill-sense-shell/src/environments
touch apps/skill-sense-api/.env
touch projects/skill-sense-shell/src/environments/environment.ts
touch projects/skill-sense-shell/src/environments/environment.prod.ts

# Step 10: Initialize Firebase
echo "🔥 Step 10/12: Initializing Firebase..."
firebase init hosting --project default > /dev/null 2>&1 || true

# Step 11: Create .gitignore
echo "🙈 Step 11/12: Creating .gitignore..."
cat > .gitignore << 'EOF'
node_modules/
dist/
.env
.angular/
.firebase/
EOF

# Step 12: Create README
echo "📝 Step 12/12: Creating README..."
cat > README.md << 'EOF'
# SkillSense
AI-powered skill discovery platform.
See plans/ directory for documentation.
EOF

echo "✅ Scaffolding complete!"
echo ""
echo "Next steps:"
echo "1. Configure .env files"
echo "2. Follow 02-IMPLEMENTATION.md for implementation"
echo "3. Deploy with 04-DEPLOYMENT.md"
SCRIPT

chmod +x scaffold.sh
```

---

## Verification

After scaffolding, verify the structure:

```bash
tree -L 3 -I 'node_modules'
```

Expected output:
```
skill-sense/
├── apps/
│   └── skill-sense-api/
│       ├── src/
│       │   ├── shared/
│       │   ├── modules/
│       │   └── main.ts
│       ├── package.json
│       └── .env
├── projects/
│   ├── skill-sense-shell/
│   ├── skill-sense-core/
│   ├── skill-sense-ui/
│   ├── skill-sense-profile/
│   └── skill-sense-sources/
├── package.json
├── firebase.json
├── README.md
└── plans/
    ├── 01-ARCHITECTURE.md
    ├── 02-IMPLEMENTATION.md
    ├── 03-SCAFFOLDING.md
    └── 04-DEPLOYMENT.md
```

---

## Next Steps

1. ✅ Scaffolding complete
2. ⏭️ Configure environment variables (`.env` files)
3. ⏭️ Follow [02-IMPLEMENTATION.md](./02-IMPLEMENTATION.md) to implement features
4. ⏭️ Deploy with [04-DEPLOYMENT.md](./04-DEPLOYMENT.md)

---

**Scaffolding Guide Complete** ✅

Run `./scaffold.sh` or follow manual steps to create the complete project structure.
