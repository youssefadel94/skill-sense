# 🔐 GCP Authentication Setup

## Problem

You're getting this error when calling the API:
```
Error: Could not load the default credentials. Browse to https://cloud.google.com/docs/authentication/getting-started for more information.
```

This happens because the Google Cloud client libraries can't find your credentials.

---

## Quick Solutions

### Option 1: Use Service Account Key (Recommended for Local Development)

#### Step 1: Create Service Account Key

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project: `ai-agents-repository-dmxd`
3. Navigate to **IAM & Admin** → **Service Accounts**
4. Find or create a service account
5. Click on the service account
6. Go to **Keys** tab
7. Click **Add Key** → **Create new key**
8. Choose **JSON** format
9. Download the key file (e.g., `service-account-key.json`)

#### Step 2: Set Environment Variable

**Windows CMD:**
```cmd
set GOOGLE_APPLICATION_CREDENTIALS=E:\work\projects\bianca\skill-sense\service-account-key.json
```

**Windows PowerShell:**
```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS="E:\work\projects\bianca\skill-sense\service-account-key.json"
```

**Add to .env file:**
```env
GOOGLE_APPLICATION_CREDENTIALS=E:\work\projects\bianca\skill-sense\service-account-key.json
```

#### Step 3: Update NestJS to Load Credentials

Add to your service constructors or create a config module.

---

### Option 2: Use gcloud CLI (Easiest)

#### Step 1: Install gcloud CLI

Download from: https://cloud.google.com/sdk/docs/install

#### Step 2: Authenticate

```cmd
gcloud auth application-default login
```

This will:
- Open a browser
- Ask you to sign in with your Google account
- Save credentials to default location
- Automatically work with all Google Cloud client libraries

#### Step 3: Set Project

```cmd
gcloud config set project ai-agents-repository-dmxd
```

#### Step 4: Restart Your API

```cmd
cd apps\skill-sense-api
npm run start:dev
```

---

### Option 3: Mock Mode (For Testing Without GCP)

If you just want to test the API without connecting to real GCP services, you can use mock mode.

#### Update Services to Skip GCP

The services already have fallback logic! Just make sure these are **NOT** set in `.env`:

```env
# Comment out or remove these for mock mode
# GCP_PROJECT_ID=
# GCS_BUCKET_NAME=
```

**What will work in mock mode:**
- ✅ Profile creation (in-memory)
- ✅ Skill extraction (mock data)
- ✅ All API endpoints
- ⚠️ Data won't persist
- ⚠️ Vector search won't work

---

## Detailed Setup for Service Account

### Required Permissions

Your service account needs these roles:

```
Cloud Datastore User          (for Firestore)
Storage Object Admin          (for Cloud Storage)
Vertex AI User                (for Vertex AI/Gemini)
```

### Create Service Account with Permissions

```cmd
# Set your project
gcloud config set project ai-agents-repository-dmxd

# Create service account
gcloud iam service-accounts create skill-sense-api ^
  --display-name="Skill Sense API Service Account"

# Grant permissions
gcloud projects add-iam-policy-binding ai-agents-repository-dmxd ^
  --member="serviceAccount:skill-sense-api@ai-agents-repository-dmxd.iam.gserviceaccount.com" ^
  --role="roles/datastore.user"

gcloud projects add-iam-policy-binding ai-agents-repository-dmxd ^
  --member="serviceAccount:skill-sense-api@ai-agents-repository-dmxd.iam.gserviceaccount.com" ^
  --role="roles/storage.objectAdmin"

gcloud projects add-iam-policy-binding ai-agents-repository-dmxd ^
  --member="serviceAccount:skill-sense-api@ai-agents-repository-dmxd.iam.gserviceaccount.com" ^
  --role="roles/aiplatform.user"

# Create key
gcloud iam service-accounts keys create service-account-key.json ^
  --iam-account=skill-sense-api@ai-agents-repository-dmxd.iam.gserviceaccount.com
```

---

## Update .env File

Add this line to your `.env`:

```env
# GCP Authentication
GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json
```

Full `.env` example:

```env
# Server
PORT=3000
NODE_ENV=development

# GCP Authentication
GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json

# GCP Configuration
GCP_PROJECT_ID=ai-agents-repository-dmxd
GCP_LOCATION=us-central1

# Google Cloud Storage
GCS_BUCKET_NAME=ai-agents-repository-dmxd

# Weaviate
WEAVIATE_SCHEME=https
WEAVIATE_HOST=c0.us-west3.gcp.weaviate.cloud
WEAVIATE_API_KEY=your-weaviate-api-key

# LinkedIn OAuth
LINKEDIN_CLIENT_ID=771y9ye42vwquy
LINKEDIN_CLIENT_SECRET=your-linkedin-secret

# GitHub (optional)
GITHUB_TOKEN=
```

---

## Update NestJS Services (Optional)

If the environment variable doesn't work automatically, update the service constructors:

### firestore.service.ts

```typescript
import { Firestore } from '@google-cloud/firestore';

constructor() {
  this.firestore = new Firestore({
    projectId: process.env.GCP_PROJECT_ID,
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  });
}
```

### gcs.service.ts

```typescript
import { Storage } from '@google-cloud/storage';

constructor() {
  this.storage = new Storage({
    projectId: process.env.GCP_PROJECT_ID,
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  });
}
```

### vertex-ai.service.ts



---

## Testing

### 1. Verify Credentials

```cmd
gcloud auth application-default print-access-token
```

Should print an access token.

### 2. Test API

```cmd
curl -X POST http://localhost:3000/profiles ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Youssef Adel\",\"email\":\"Youssefadel94@hotmail.com\"}"
```

Should return success!

### 3. Check Firestore

Go to: https://console.cloud.google.com/firestore/data

You should see a `profiles` collection with your profile.

---

## Troubleshooting

### Error: "Permission denied"

**Solution:** Add required IAM roles to service account

### Error: "Project not found"

**Solution:** Verify `GCP_PROJECT_ID` is correct:
```cmd
gcloud projects list
```

### Error: "API not enabled"

**Solution:** Enable required APIs:
```cmd
gcloud services enable firestore.googleapis.com
gcloud services enable storage.googleapis.com
gcloud services enable aiplatform.googleapis.com
```

### Error: "Key file not found"

**Solution:** Use absolute path:
```env
GOOGLE_APPLICATION_CREDENTIALS=E:\work\projects\bianca\skill-sense\service-account-key.json
```

---

## Security Notes

### ⚠️ IMPORTANT

1. **Never commit service account keys to git!**

   Add to `.gitignore`:
   ```
   service-account-key.json
   *.json
   !package.json
   !tsconfig.json
   ```

2. **Use different keys for dev/prod**

3. **Rotate keys regularly**

4. **Use minimum required permissions**

---

## Production Deployment

For Cloud Run deployment, you don't need a service account key!

Cloud Run automatically uses the default service account:

```
{project-number}-compute@developer.gserviceaccount.com
```

Just make sure it has the required permissions.

---

## Recommended Solution

**For your case (local development), I recommend:**

1. **Option 2** (gcloud CLI) - Easiest setup
   ```cmd
   gcloud auth application-default login
   gcloud config set project ai-agents-repository-dmxd
   ```

2. Then restart your API:
   ```cmd
   npm run start:dev
   ```

3. Test again:
   ```cmd
   curl -X POST http://localhost:3000/profiles ^
     -H "Content-Type: application/json" ^
     -d "{\"name\":\"Youssef Adel\",\"email\":\"Youssefadel94@hotmail.com\"}"
   ```

That's it! No key files, no extra setup. ✅

---

## Quick Commands Summary

```cmd
# Install gcloud CLI first, then:

# 1. Authenticate
gcloud auth application-default login

# 2. Set project
gcloud config set project ai-agents-repository-dmxd

# 3. Enable APIs
gcloud services enable firestore.googleapis.com
gcloud services enable storage.googleapis.com
gcloud services enable aiplatform.googleapis.com

# 4. Restart API
cd apps\skill-sense-api
npm run start:dev

# 5. Test
curl -X POST http://localhost:3000/profiles -H "Content-Type: application/json" -d "{\"name\":\"Test User\",\"email\":\"test@example.com\"}"
```

Done! 🎉
