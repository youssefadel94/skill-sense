@echo off
REM SkillSense Backend Deployment Script for Cloud Run (Windows)

set PROJECT_ID=%GCP_PROJECT_ID%
if "%PROJECT_ID%"=="" set PROJECT_ID=your-project-id

set REGION=%GCP_REGION%
if "%REGION%"=="" set REGION=us-central1

set SERVICE_NAME=skill-sense-api
set IMAGE_NAME=gcr.io/%PROJECT_ID%/%SERVICE_NAME%

echo 🚀 Deploying SkillSense API to Cloud Run...
echo Project: %PROJECT_ID%
echo Region: %REGION%

REM Build the container image
echo 📦 Building container image...
gcloud builds submit --tag %IMAGE_NAME% --project %PROJECT_ID% apps\skill-sense-api

REM Deploy to Cloud Run
echo 🚢 Deploying to Cloud Run...
gcloud run deploy %SERVICE_NAME% ^
  --image %IMAGE_NAME% ^
  --platform managed ^
  --region %REGION% ^
  --allow-unauthenticated ^
  --set-env-vars "GCP_PROJECT_ID=%PROJECT_ID%" ^
  --max-instances 10 ^
  --memory 512Mi ^
  --timeout 60 ^
  --project %PROJECT_ID%

echo ✅ Deployment complete!
