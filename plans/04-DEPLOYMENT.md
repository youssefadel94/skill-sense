# SkillSense - Deployment Guide

**Version:** 1.0  
**Date:** November 8, 2025

This guide provides step-by-step deployment instructions for SkillSense to production.

---

## Pre-Deployment Checklist

### Backend
- [ ] All services implemented and tested
- [ ] Environment variables configured
- [ ] Error handling implemented
- [ ] Logging configured
- [ ] TypeScript compiles without errors
- [ ] Unit tests passing

### Frontend
- [ ] All components implemented
- [ ] Production build successful
- [ ] Environment variables set for production
- [ ] Error boundaries implemented
- [ ] Loading states added
- [ ] Responsive design verified

###Infrastructure
- [ ] GCP project created
- [ ] APIs enabled
- [ ] Service account created with permissions
- [ ] Firestore database initialized
- [ ] Weaviate Cloud Service cluster created
- [ ] Cloud Storage bucket created
- [ ] Firebase project configured

---

## Step 1: Configure GCP (15 min)

### Enable APIs

```bash
# Set project
export PROJECT_ID=your-project-id
gcloud config set project $PROJECT_ID

# Enable required APIs
gcloud services enable \
  run.googleapis.com \
  aiplatform.googleapis.com \
  storage.googleapis.com \
  firestore.googleapis.com \
  cloudbuild.googleapis.com

# Verify
gcloud services list --enabled
```

### Create Service Account

```bash
# Create service account
gcloud iam service-accounts create skillsense-api \
  --display-name="SkillSense API" \
  --description="Service account for SkillSense Cloud Run API"

# Grant permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:skillsense-api@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:skillsense-api@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/datastore.user"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:skillsense-api@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

# Generate key (optional - Cloud Run uses Workload Identity by default)
gcloud iam service-accounts keys create key.json \
  --iam-account=skillsense-api@$PROJECT_ID.iam.gserviceaccount.com
```

### Initialize Firestore

```bash
# Create Firestore database (if not exists)
gcloud firestore databases create \
  --location=us-central1 \
  --type=firestore-native

# Set indexes (optional - Firestore auto-creates simple indexes)
cat > firestore.indexes.json << 'EOF'
{
  "indexes": [
    {
      "collectionGroup": "skills",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "profileId", "order": "ASCENDING" },
        { "fieldPath": "confidence", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "jobs",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "profileId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
EOF

gcloud firestore indexes create firestore.indexes.json
```

### Create Storage Bucket

```bash
# Create bucket
export BUCKET_NAME=skillsense-uploads-$PROJECT_ID
gsutil mb -l us-central1 gs://$BUCKET_NAME

# Set CORS for file uploads
cat > cors.json << 'EOF'
[
  {
    "origin": ["https://your-app.web.app", "http://localhost:4200"],
    "method": ["GET", "POST", "PUT"],
    "responseHeader": ["Content-Type"],
    "maxAgeSeconds": 3600
  }
]
EOF

gsutil cors set cors.json gs://$BUCKET_NAME

# Set lifecycle (optional - delete old CVs after 90 days)
cat > lifecycle.json << 'EOF'
{
  "lifecycle": {
    "rule": [
      {
        "action": {"type": "Delete"},
        "condition": {"age": 90}
      }
    ]
  }
}
EOF

gsutil lifecycle set lifecycle.json gs://$BUCKET_NAME
```

---

## Step 2: Deploy Backend to Cloud Run (10 min)

### Prepare Backend

```bash
cd apps/skill-sense-api

# Update .env.production
cat > .env.production << EOF
GCP_PROJECT_ID=$PROJECT_ID
GCP_LOCATION=us-central1
GCS_BUCKET_NAME=$BUCKET_NAME
WEAVIATE_HOST=your-cluster.weaviate.network
WEAVIATE_API_KEY=your-weaviate-key
GITHUB_TOKEN=your-github-token
PORT=8080
NODE_ENV=production
EOF

# Build
npm run build
```

### Create Dockerfile

```bash
cat > Dockerfile << 'EOF'
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["node", "dist/main"]
EOF
```

### Deploy to Cloud Run

```bash
# Build and deploy (Cloud Run automatically builds from Dockerfile)
gcloud run deploy skillsense-api \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --service-account skillsense-api@$PROJECT_ID.iam.gserviceaccount.com \
  --memory 1Gi \
  --cpu 1 \
  --timeout 300 \
  --max-instances 10 \
  --min-instances 0 \
  --set-env-vars GCP_PROJECT_ID=$PROJECT_ID,GCP_LOCATION=us-central1,GCS_BUCKET_NAME=$BUCKET_NAME \
  --set-secrets WEAVIATE_API_KEY=weaviate-api-key:latest,GITHUB_TOKEN=github-token:latest

# Get URL
export API_URL=$(gcloud run services describe skillsense-api --region us-central1 --format 'value(status.url)')
echo "API deployed at: $API_URL"
```

### Store Secrets (Recommended)

```bash
# Store secrets in Secret Manager (instead of env vars)
echo -n "your-weaviate-key" | gcloud secrets create weaviate-api-key --data-file=-
echo -n "your-github-token" | gcloud secrets create github-token --data-file=-

# Grant access to service account
gcloud secrets add-iam-policy-binding weaviate-api-key \
  --member="serviceAccount:skillsense-api@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding github-token \
  --member="serviceAccount:skillsense-api@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### Verify Backend Deployment

```bash
# Health check
curl $API_URL/health

# Expected: {"status":"ok"}
```

---

## Step 3: Deploy Frontend to Firebase Hosting (10 min)

### Configure Firebase

```bash
cd ../..  # Back to root

# Login to Firebase
firebase login

# Use existing project or create new
firebase use --add

# Select project and set alias 'default'
```

### Update Environment

```bash
# Update production environment with deployed API URL
cat > projects/skill-sense-shell/src/environments/environment.prod.ts << EOF
export const environment = {
  production: true,
  apiUrl: '$API_URL',
  firebase: {
    apiKey: 'YOUR_API_KEY',
    authDomain: 'your-project.firebaseapp.com',
    projectId: '$PROJECT_ID',
    storageBucket: 'your-project.appspot.com',
    messagingSenderId: 'YOUR_SENDER_ID',
    appId: 'YOUR_APP_ID'
  }
};
EOF
```

### Build Frontend

```bash
# Build for production
ng build skill-sense-shell --configuration production

# Verify build
ls -lh dist/skill-sense-shell/browser
```

### Deploy to Firebase Hosting

```bash
# Deploy
firebase deploy --only hosting

# Get URL
firebase hosting:channel:list

# Expected output includes your site URL
```

### Verify Frontend Deployment

```bash
# Open in browser
open https://your-project.web.app

# Test flows:
# 1. Upload CV
# 2. Connect GitHub
# 3. View extracted skills
# 4. Verify/reject skills
```

---

## Step 4: Configure CORS (5 min)

### Update Backend CORS

```typescript
// apps/skill-sense-api/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: [
      'https://your-project.web.app',
      'https://your-project.firebaseapp.com',
      'http://localhost:4200', // For development
    ],
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT || 8080;
  await app.listen(port);
  console.log(`API running on port ${port}`);
}
bootstrap();
```

### Redeploy Backend

```bash
cd apps/skill-sense-api
gcloud run deploy skillsense-api --source . --region us-central1
```

---

## Step 5: Set Up Monitoring (10 min)

### Cloud Run Metrics

```bash
# View logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=skillsense-api" \
  --limit 50 \
  --format json

# Set up log-based metrics
gcloud logging metrics create extraction_errors \
  --description="Count of extraction errors" \
  --log-filter='resource.type="cloud_run_revision"
    resource.labels.service_name="skillsense-api"
    severity>=ERROR'
```

### Create Alerts

```bash
# Create alert policy for error rate
gcloud alpha monitoring policies create \
  --notification-channels=YOUR_NOTIFICATION_CHANNEL \
  --display-name="SkillSense API Error Rate" \
  --condition-display-name="Error rate > 5%" \
  --condition-threshold-value=0.05 \
  --condition-threshold-duration=60s
```

### Firebase Analytics

```bash
# Enable Google Analytics in Firebase Console
# Analytics > Enable Google Analytics

# Add to Angular app
ng add @angular/fire
```

---

## Step 6: Performance Optimization (15 min)

### Backend Optimizations

```typescript
// Enable caching
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    CacheModule.register({
      ttl: 300, // 5 minutes
      max: 100, // max items
    }),
  ],
})
export class AppModule {}

// Use in service
@Injectable()
export class ProfileService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async getProfile(id: string) {
    const cached = await this.cacheManager.get(`profile:${id}`);
    if (cached) return cached;

    const profile = await this.fetchProfile(id);
    await this.cacheManager.set(`profile:${id}`, profile);
    return profile;
  }
}
```

### Frontend Optimizations

```typescript
// Enable service worker
ng add @angular/pwa --project skill-sense-shell

// Lazy load routes
const routes: Routes = [
  {
    path: 'profile',
    loadComponent: () => import('./profile/profile.component')
      .then(m => m.ProfileComponent),
  },
];

// Optimize images
// Use WebP format, add loading="lazy"
```

### Cloud Run Scaling

```bash
# Update min instances for faster cold starts
gcloud run services update skillsense-api \
  --region us-central1 \
  --min-instances 1 \
  --max-instances 20 \
  --cpu-throttling \
  --concurrency 80
```

---

## Step 7: Security Hardening (10 min)

### API Security

```typescript
// Add rate limiting
import * as rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // max 100 requests per window
});

app.use(limiter);

// Add helmet for security headers
import helmet from 'helmet';
app.use(helmet());
```

### Firebase Security Rules

```bash
# Firestore security rules
cat > firestore.rules << 'EOF'
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Profiles - users can only read/write their own
    match /profiles/{profileId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }

    // Skills - users can only access their profile's skills
    match /skills/{skillId} {
      allow read, write: if request.auth != null &&
        exists(/databases/$(database)/documents/profiles/$(resource.data.profileId)) &&
        get(/databases/$(database)/documents/profiles/$(resource.data.profileId)).data.userId == request.auth.uid;
    }

    // Jobs - users can only access their jobs
    match /jobs/{jobId} {
      allow read: if request.auth != null &&
        exists(/databases/$(database)/documents/profiles/$(resource.data.profileId)) &&
        get(/databases/$(database)/documents/profiles/$(resource.data.profileId)).data.userId == request.auth.uid;
    }
  }
}
EOF

# Deploy rules
firebase deploy --only firestore:rules

# Storage security rules
cat > storage.rules << 'EOF'
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /cvs/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
EOF

firebase deploy --only storage
```

---

## Step 8: Testing in Production (15 min)

### Smoke Tests

```bash
# Test API endpoints
export API_URL=https://skillsense-api-xyz.run.app

# Health check
curl $API_URL/health

# Create profile (with auth token)
curl -X POST $API_URL/api/profiles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"email":"test@example.com","name":"Test User"}'

# Upload CV
curl -X POST $API_URL/api/extract/cv \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "profileId=YOUR_PROFILE_ID" \
  -F "file=@test-cv.pdf"
```

### E2E Tests

```typescript
// e2e/app.e2e-spec.ts
describe('SkillSense E2E', () => {
  it('should upload CV and extract skills', async () => {
    await page.goto('https://your-project.web.app');
    await page.click('[data-test="login"]');
    // ... test flow
  });
});
```

### Load Testing

```bash
# Install Apache Bench
brew install apache-bench  # macOS
# or
sudo apt-get install apache2-utils  # Linux

# Load test
ab -n 1000 -c 10 $API_URL/health

# Expected:
# - Requests per second > 100
# - 99th percentile < 500ms
# - 0 failed requests
```

---

## Step 9: Documentation & Handoff (10 min)

### API Documentation

```bash
# Add Swagger/OpenAPI
npm install --save @nestjs/swagger

# In main.ts
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

const config = new DocumentBuilder()
  .setTitle('SkillSense API')
  .setDescription('AI-powered skill discovery platform')
  .setVersion('1.0')
  .addBearerAuth()
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api/docs', app, document);

// Access at: https://your-api.run.app/api/docs
```

### Create Runbook

```markdown
# SkillSense Production Runbook

## Deployment
- Backend: `gcloud run deploy skillsense-api --source apps/skill-sense-api`
- Frontend: `firebase deploy --only hosting`

## Monitoring
- Logs: Cloud Logging (Cloud Run > skillsense-api > Logs)
- Metrics: Cloud Monitoring (Metrics Explorer)
- Errors: Error Reporting

## Common Issues
1. **High error rate**: Check Vertex AI quota
2. **Slow extraction**: Check Cloud Run instances
3. **CORS errors**: Verify allowed origins in main.ts

## Rollback
- Backend: `gcloud run services update-traffic skillsense-api --to-revisions=PREVIOUS_REVISION=100`
- Frontend: `firebase hosting:channel:deploy previous`
```

---

## Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Security rules deployed
- [ ] CORS configured
- [ ] Monitoring set up

### Deployment
- [ ] Backend deployed to Cloud Run
- [ ] Frontend deployed to Firebase Hosting
- [ ] API URL updated in frontend
- [ ] Secrets configured
- [ ] Health checks passing

### Post-Deployment
- [ ] Smoke tests completed
- [ ] Load tests passing
- [ ] Monitoring verified
- [ ] Alerts configured
- [ ] Documentation updated
- [ ] Team notified

---

## Production URLs

After successful deployment:

- **Frontend**: https://your-project.web.app
- **Backend API**: https://skillsense-api-xyz.run.app
- **API Docs**: https://skillsense-api-xyz.run.app/api/docs
- **Cloud Console**: https://console.cloud.google.com/run?project=your-project
- **Firebase Console**: https://console.firebase.google.com/project/your-project

---

## Maintenance

### Regular Tasks

**Daily:**
- Check error logs
- Monitor API latency
- Review extraction success rates

**Weekly:**
- Review costs
- Update dependencies
- Check security alerts

**Monthly:**
- Performance optimization
- Cost analysis
- Feature roadmap review

### Scaling

**If traffic increases:**

```bash
# Increase max instances
gcloud run services update skillsense-api \
  --max-instances 50

# Consider upgrading Weaviate cluster
# Consider adding read replicas to Firestore
```

---

**Deployment Complete** ✅

Your SkillSense platform is now live and production-ready!

## Support

- **Issues**: Check runbook first
- **Logs**: Cloud Logging
- **Metrics**: Cloud Monitoring
- **Community**: GitHub Discussions

**Good luck with the hackathon! 🚀**
