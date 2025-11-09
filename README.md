# SkillSense

AI-powered skill discovery platform using Vertex AI and Weaviate.

## Quick Start

### Prerequisites

- Node.js 18+
- Google Cloud Project with Vertex AI, Firestore, and Cloud Storage enabled
- Weaviate Cloud account
- Firebase project

### Setup

1. **Install dependencies**:

   ```bash
   npm run setup
   ```

2. **Configure environment variables**:

   ```bash
   cp apps/skill-sense-api/.env.template apps/skill-sense-api/.env
   # Edit .env with your actual credentials
   ```

3. **Start backend**:

   ```bash
   npm run start:api
   ```

4. **Start frontend** (in another terminal):

   ```bash
   npm run start:web
   ```

### Development

- **Backend**: NestJS API in `apps/skill-sense-api/`
- **Frontend**: Angular app in `apps/skill-sense-shell/`
- **Shared Libraries**: Angular libraries in `projects/` (optional for modular architecture)

### Common Commands

```bash
# Setup all dependencies
npm run setup

# Build everything
npm run build

# Run tests
npm run test

# Start both frontend and backend concurrently
npm run start:all

# Deploy to cloud
npm run deploy
```

### Deployment

#### Backend (Cloud Run)

```bash
npm run deploy:api
```

#### Frontend (Firebase Hosting)

```bash
npm run deploy:web
```

## Architecture

- **Backend**: NestJS + Vertex AI + Firestore + Weaviate
- **Frontend**: Angular 20+ with standalone components
- **Deployment**: Cloud Run + Firebase Hosting

## Features

- 📄 CV/Resume skill extraction
- 🔗 GitHub profile analysis
- 🔍 Semantic skill search
- 💼 Evidence-based skill profiles
- 📊 Confidence scoring

## Documentation

See `plans/` directory for detailed architecture and implementation guides.

## License

MIT
