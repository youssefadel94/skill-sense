# SkillSense - AI-Powered Skill Discovery Platform

**Hackathon Challenge Submission**  
**Date:** November 8, 2025

## 🎯 Vision

SkillSense uses AI agents to automatically discover, extract, and verify professional skills from multiple sources (CVs, GitHub, web presence), creating evidence-based skill profiles with confidence scores and anti-hallucination features.

## 📁 Documentation Structure

### Core Plans

**🚀 START HERE:** [NEXT-ACTIONS.md](./NEXT-ACTIONS.md) - What to do next (choose your path)

**For Judges:** [HACKATHON-SUBMISSION.md](./HACKATHON-SUBMISSION.md) - Executive summary

**Technical Docs:**
1. **[01-ARCHITECTURE.md](./01-ARCHITECTURE.md)** - System architecture and tech stack
2. **[02-IMPLEMENTATION.md](./02-IMPLEMENTATION.md)** - Implementation guide with code
3. **[03-SCAFFOLDING.md](./03-SCAFFOLDING.md)** - Automated project setup
4. **[04-DEPLOYMENT.md](./04-DEPLOYMENT.md)** - Production deployment guide
5. **[EXECUTION-CHECKLIST.md](./EXECUTION-CHECKLIST.md)** - Step-by-step checklist

**Planning Docs:**
- **[COMPLETE-PACKAGE-SUMMARY.md](./COMPLETE-PACKAGE-SUMMARY.md)** - Complete overview
- **[FUTURE-ROADMAP.md](./FUTURE-ROADMAP.md)** - Phase 2-5 features
- **[EXTRACTION-ROADMAP.md](./EXTRACTION-ROADMAP.md)** - Pattern extraction plan
- **[guides-scaffolds/INDEX.md](./guides-scaffolds/INDEX.md)** - 59 extractable patterns

### Quick Start

```bash
# 1. Review architecture
cat 01-ARCHITECTURE.md

# 2. Scaffold project
./scaffold.sh  # or follow 03-SCAFFOLDING.md

# 3. Implement features
# Follow 02-IMPLEMENTATION.md

# 4. Deploy
# Follow 04-DEPLOYMENT.md
```

## 🚀 Key Features

- **Multi-Source Skill Extraction**: CV (PDF/DOCX), GitHub repos, web presence
- **AI Agent Orchestration**: Parallel extraction with Vertex AI (Gemini Pro Vision)
- **Evidence-Based Profiles**: Every skill linked to source evidence with confidence scores
- **Anti-Hallucination**: Human verification workflow for AI-extracted skills
- **Vector Search**: Semantic skill matching with Weaviate
- **Production-Ready**: TypeScript, modular architecture, comprehensive error handling

## 🏗️ Tech Stack

- **Backend**: NestJS on Cloud Run
- **Frontend**: Angular 17+ on Firebase Hosting
- **AI/ML**: Vertex AI (Gemini Pro Vision, text-embedding-gecko)
- **Vector DB**: Weaviate Cloud Service
- **Database**: Firestore
- **Monorepo**: npm workspaces

## ⏱️ Timeline

- **Day 0** (2h): Project scaffolding and setup
- **Day 1** (8h): Backend implementation (API, connectors, AI integration)
- **Day 2** (8h): Frontend implementation (UI components, state management)
- **Day 3** (8h): Integration, testing, deployment

## 🎓 Target Audience

This documentation is designed for:
- Hackathon judges reviewing the technical approach
- AI agents implementing the system
- Developers extending the platform

## 📊 Success Metrics

- ✅ Working MVP in 2-3 days
- ✅ Production-ready code quality
- ✅ Scalable architecture
- ✅ Comprehensive documentation
- ✅ Live demo deployment

---

**Let's build something amazing! 🚀**
