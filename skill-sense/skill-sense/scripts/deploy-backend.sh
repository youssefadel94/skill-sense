#!/bin/bash

# SkillSense Backend Deployment Script for Cloud Run

set -e

# Configuration
PROJECT_ID="${GCP_PROJECT_ID:-your-project-id}"
REGION="${GCP_REGION:-us-central1}"
SERVICE_NAME="skill-sense-api"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

echo "🚀 Deploying SkillSense API to Cloud Run..."
echo "Project: $PROJECT_ID"
echo "Region: $REGION"

# Build the container image
echo "📦 Building container image..."
gcloud builds submit \
  --tag ${IMAGE_NAME} \
  --project ${PROJECT_ID} \
  apps/skill-sense-api

# Deploy to Cloud Run
echo "🚢 Deploying to Cloud Run..."
gcloud run deploy ${SERVICE_NAME} \
  --image ${IMAGE_NAME} \
  --platform managed \
  --region ${REGION} \
  --allow-unauthenticated \
  --set-env-vars "GCP_PROJECT_ID=${PROJECT_ID}" \
  --max-instances 10 \
  --memory 512Mi \
  --timeout 60 \
  --project ${PROJECT_ID}

# Get the service URL
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} \
  --platform managed \
  --region ${REGION} \
  --format 'value(status.url)' \
  --project ${PROJECT_ID})

echo "✅ Deployment complete!"
echo "🌐 Service URL: ${SERVICE_URL}"
echo "💚 Health check: ${SERVICE_URL}/health"
