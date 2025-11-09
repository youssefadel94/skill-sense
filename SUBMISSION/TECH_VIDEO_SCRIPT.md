# SkillSense - Tech Video Script (60 seconds)

## 🔧 Technical Architecture Video Script

**Duration:** 60 seconds  
**Style:** Architecture diagrams + code snippets  
**Focus:** How it works technically

---

### Timeline & Script

**[0:00 - 0:10] Architecture Overview (10s)**
> "SkillSense is built with a modern microservices architecture. Angular 17 frontend, NestJS backend, powered by Google Cloud Platform."

*Visual: Architecture diagram showing:*

```
┌─────────────┐      ┌──────────────┐      ┌────────────────┐
│   Angular   │─────▶│   NestJS     │─────▶│  Vertex AI     │
│  Frontend   │      │   Backend    │      │  (Gemini 2.0)  │
└─────────────┘      └──────────────┘      └────────────────┘
                            │
                     ┌──────┴──────┐
                     │             │
              ┌──────▼─────┐ ┌────▼─────┐
              │  Firestore │ │ Weaviate  │
              │  Database  │ │  Vector   │
              └────────────┘ └───────────┘
```

---

**[0:10 - 0:25] AI Skill Extraction (15s)**
> "When you connect GitHub, we fetch repository metadata via Octokit API, then send it to Vertex AI's Gemini 2.0 Flash model with a specialized prompt. The AI extracts skills with category, proficiency level, and confidence score - all structured as JSON."

*Visual: Code snippet of Vertex AI integration:*

```typescript
async extractSkills(text: string) {
  const model = this.vertexAI.getGenerativeModel({
    model: 'gemini-2.0-flash-lite-001'
  });
  
  const prompt = `Extract technical skills from: ${text}
  Return JSON array with: name, category, proficiency, evidence`;
  
  const result = await model.generateContent(prompt);
  return this.parseSkills(result.response.text());
}
```

---

**[0:25 - 0:40] Vector Search & Intelligence (15s)**
> "Each skill is embedded into Weaviate vector database for semantic search. We use cosine similarity to find related skills and similar professionals. For skill gaps, we query Vertex AI again to compare your profile against job requirements."

*Visual: Split screen showing:*

```typescript
// Vector embedding in Weaviate
await this.weaviate.addSkill({
  name: skill.name,
  category: skill.category,
  userId: userId,
  vector: embedding
});

// Semantic search
const similar = await this.weaviate.searchSkills(
  query, 
  { limit: 10 }
);
```

---

**[0:40 - 0:55] CV Generation Pipeline (15s)**
> "CV generation combines user skills with AI content creation. We send the skill profile to Gemini with template-specific styling instructions. It generates semantic HTML with inline CSS, dynamically highlighting requested skill categories."

*Visual: Flow diagram:*

```
User Skills → Vertex AI Prompt → Gemini 2.0 → HTML Generation
     ↓              ↓                  ↓             ↓
  Firebase    Template Style    Professional   PDF/DOCX
              + Target Role       Summary        Export
```

*Show code:*

```typescript
const htmlContent = await this.vertexAI.generateCVContent(
  profile, 
  { template, targetRole, emphasisCategories }
);
```

---

**[0:55 - 0:60] Closing (5s)**
> "Production-ready with Firebase Auth, Cloud Storage, and fully scalable. All powered by Google Cloud and Vertex AI."

*Visual: Tech stack badges*

```
Angular 17 | NestJS | TypeScript | Vertex AI | 
Firestore | Weaviate | Firebase | GCP
```

---

## 📹 Recording Tips

1. **Use dark theme IDE** for better visual contrast
2. **Show actual code** from the repository
3. **Animate architecture diagrams** (optional)
4. **Highlight API calls** in the code
5. **Use syntax highlighting** for code snippets
6. **Keep diagrams simple** and easy to read

## 🎯 Key Technical Points

✅ Vertex AI Gemini 2.0 Flash integration  
✅ NestJS dependency injection architecture  
✅ Weaviate vector database for semantic search  
✅ Firebase/Firestore for data persistence  
✅ TypeScript end-to-end type safety  
✅ Scalable microservices design

---

**Upload to:** YouTube (Unlisted) or Vimeo  
**Title:** SkillSense - Technical Architecture & AI Implementation  
**Tags:** Vertex AI, Gemini, NestJS, Angular, Architecture, Vector Database
