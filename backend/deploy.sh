#!/usr/bin/env bash
# deploy.sh — Build and deploy VoteFlow backend to Cloud Run
# Usage: ./deploy.sh <GCP_PROJECT_ID> [REGION]
# Example: ./deploy.sh my-gcp-project asia-south1

set -euo pipefail

PROJECT_ID="${1:?Usage: ./deploy.sh <GCP_PROJECT_ID> [REGION]}"
REGION="${2:-asia-south1}"
SERVICE_NAME="voteflow-backend"
IMAGE="gcr.io/${PROJECT_ID}/${SERVICE_NAME}:latest"

echo "🚀 Deploying VoteFlow backend"
echo "   Project : ${PROJECT_ID}"
echo "   Region  : ${REGION}"
echo "   Image   : ${IMAGE}"
echo ""

# 1. Enable required APIs
gcloud services enable \
  run.googleapis.com \
  containerregistry.googleapis.com \
  secretmanager.googleapis.com \
  --project="${PROJECT_ID}"

# 2. Configure Docker to use gcloud credentials
gcloud auth configure-docker --quiet

# 3. Build image
echo "📦 Building Docker image..."
docker build -t "${IMAGE}" ../

# 4. Push to GCR
echo "📤 Pushing to Container Registry..."
docker push "${IMAGE}"

# 5. Deploy to Cloud Run
echo "☁️  Deploying to Cloud Run..."
gcloud run deploy "${SERVICE_NAME}" \
  --image="${IMAGE}" \
  --platform=managed \
  --region="${REGION}" \
  --port=8080 \
  --allow-unauthenticated \
  --set-env-vars="FIREBASE_PROJECT_ID=${PROJECT_ID}" \
  --set-secrets="FIREBASE_SERVICE_ACCOUNT_JSON=voteflow-sa-key:latest" \
  --min-instances=0 \
  --max-instances=10 \
  --memory=256Mi \
  --cpu=1 \
  --project="${PROJECT_ID}"

# 6. Get URL
echo ""
SERVICE_URL=$(gcloud run services describe "${SERVICE_NAME}" \
  --region="${REGION}" \
  --format="value(status.url)" \
  --project="${PROJECT_ID}")

echo "✅ Deployed successfully!"
echo "   Service URL: ${SERVICE_URL}"
echo "   Health check: ${SERVICE_URL}/health"
echo ""
echo "📝 Next: Set VITE_BACKEND_URL=${SERVICE_URL} in your frontend .env"
