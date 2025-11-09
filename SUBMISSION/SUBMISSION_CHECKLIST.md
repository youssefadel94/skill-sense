# Hack Nation 2025 - Submission Checklist

## ✅ SkillSense Submission Status

| Item | Format / Example | Status | Link / File |
|------|------------------|--------|-------------|
| **Project Summary** | 150-300 words | ✅ Complete | `SUBMISSION/PROJECT_SUMMARY.md` |
| **Demo Video** | YouTube/Vimeo ≤60s | ⏳ Pending | [Upload to YouTube](https://youtube.com/upload) |
| **Tech Video** | YouTube/Vimeo ≤60s | ⏳ Pending | [Upload to YouTube](https://youtube.com/upload) |
| **1-Page Report** | PDF | ⏳ To Convert | `SUBMISSION/TECHNICAL_REPORT.md` → PDF |
| **GitHub Repository** | Public link | ⏳ Pending | Push to GitHub |
| **Zipped Code** | .zip file | ⏳ Pending | Create `SkillSense_Code.zip` |
| **Dataset** | Link or N/A | ✅ N/A | No external dataset used |

---

## 📋 Pre-Submission Tasks

### 1. Create Demo Video (60 seconds)
- [ ] Record screen using OBS Studio or Loom
- [ ] Follow script in `SUBMISSION/DEMO_VIDEO_SCRIPT.md`
- [ ] Show: Dashboard → GitHub Connect → Skill Extraction → Gap Analysis → CV Generation
- [ ] Add voiceover explaining key features
- [ ] Export as MP4 (1920x1080, 30fps)
- [ ] Upload to YouTube as **Unlisted**
- [ ] Add to submission form

**YouTube Upload Settings:**
```
Title: SkillSense - AI Career Intelligence Platform Demo
Description: AI-powered skill extraction, gap analysis, and CV generation using Google Vertex AI (Gemini 2.0). Built for Hack Nation 2025.
Tags: AI, Vertex AI, Gemini 2.0, Career Tech, NestJS, Angular, Google Cloud
Visibility: Unlisted
```

---

### 2. Create Tech Video (60 seconds)
- [ ] Create architecture diagrams (use Excalidraw or draw.io)
- [ ] Record IDE showing key code sections
- [ ] Follow script in `SUBMISSION/TECH_VIDEO_SCRIPT.md`
- [ ] Show: Architecture → Vertex AI Integration → Vector Search → CV Generation Code
- [ ] Export as MP4
- [ ] Upload to YouTube as **Unlisted**
- [ ] Add to submission form

**YouTube Upload Settings:**
```
Title: SkillSense - Technical Architecture & AI Implementation
Description: Deep dive into the technical stack: Angular 17, NestJS, Vertex AI (Gemini 2.0), Weaviate, Firebase. Microservices architecture explained.
Tags: Architecture, Vertex AI, Gemini, NestJS, Angular, Weaviate, Microservices
Visibility: Unlisted
```

---

### 3. Convert Technical Report to PDF
```bash
# Option 1: Use online converter
# Go to: https://www.markdowntopdf.com/
# Upload: SUBMISSION/TECHNICAL_REPORT.md
# Download as: SkillSense_Technical_Report.pdf

# Option 2: Use pandoc (if installed)
pandoc SUBMISSION/TECHNICAL_REPORT.md -o SUBMISSION/SkillSense_Technical_Report.pdf

# Option 3: Use VS Code extension
# Install: Markdown PDF extension
# Right-click TECHNICAL_REPORT.md → Markdown PDF: Export (pdf)
```

---

### 4. Push to GitHub

```bash
# Navigate to project root
cd e:\work\projects\bianca\skill-sense\skill-sense

# Initialize git (if not already)
git init
git add .
git commit -m "Initial commit: SkillSense - AI Career Intelligence Platform"

# Create repository on GitHub
# Go to: https://github.com/new
# Name: skillsense
# Description: AI-powered skill extraction and career intelligence using Google Vertex AI (Gemini 2.0)
# Visibility: Public
# Do NOT initialize with README (already have one)

# Add remote and push
git remote add origin https://github.com/YOUR_USERNAME/skillsense.git
git branch -M main
git push -u origin main
```

**Repository Settings:**
- [ ] Set repository to **Public**
- [ ] Add topics: `vertex-ai`, `gemini`, `nestjs`, `angular`, `career-tech`, `ai`, `google-cloud`
- [ ] Add description: "AI-powered skill extraction and career intelligence platform"
- [ ] Enable Issues
- [ ] Add License: MIT

---

### 5. Create Code ZIP File

```bash
# Windows PowerShell
cd e:\work\projects\bianca\skill-sense\skill-sense

# Create clean version (exclude node_modules, build files)
# Create .zipignore or manually exclude:
# - node_modules/
# - dist/
# - .angular/
# - coverage/
# - *.log

# Option 1: Using 7-Zip (if installed)
7z a -tzip SkillSense_Code.zip . -xr!node_modules -xr!dist -xr!.angular -xr!coverage

# Option 2: Manual
# 1. Copy project to new folder
# 2. Delete node_modules, dist, .angular, coverage folders
# 3. Right-click → Send to → Compressed (zipped) folder
# 4. Rename to: SkillSense_Code.zip
```

**ZIP File Checklist:**
- [ ] Named: `SkillSense_Code.zip`
- [ ] Size: < 100MB (without node_modules)
- [ ] Includes: Source code, README.md, package.json, configuration files
- [ ] Excludes: node_modules, dist, build artifacts, .git

---

### 6. Verify All Links Work

Before submitting, test these:

- [ ] GitHub repository is public and accessible
- [ ] Demo video plays (not private)
- [ ] Tech video plays (not private)
- [ ] README.md displays correctly on GitHub
- [ ] No broken links in documentation

---

## 📤 Submission Steps

### Step 1: Upload to projects.hack-nation.ai
1. Go to: https://projects.hack-nation.ai
2. Click "Submit Project"
3. Fill in:
   - **Project Name:** SkillSense
   - **Summary:** (Copy from `SUBMISSION/PROJECT_SUMMARY.md`)
   - **Demo Video:** [YouTube link]
   - **Tech Video:** [YouTube link]
   - **GitHub:** [Repository URL]
4. Upload files:
   - Technical Report PDF
   - Code ZIP
5. Add cover image (optional - create screenshot of dashboard)
6. Submit

### Step 2: Fill Google Form
1. Go to: https://tinyurl.com/HN-Submission
2. Enter all details:
   - Team name
   - Project name: **SkillSense**
   - Category: **AI/ML** or **Developer Tools**
   - All links from above
3. Double-check all URLs
4. Submit

---

## 📝 Quick Copy-Paste Summary

**For submission forms:**

```
Project Name: SkillSense

Tagline: AI-powered skill extraction and career intelligence platform

Description: SkillSense automatically extracts professional skills from GitHub, LinkedIn, and CVs using Google Vertex AI (Gemini 2.0). It provides skill gap analysis, personalized learning paths, and generates AI-powered CVs dynamically.

Tech Stack: Angular 17, NestJS, Google Vertex AI (Gemini 2.0 Flash), Firebase, Weaviate Vector Database, TypeScript

Key Features:
- Multi-source skill extraction (GitHub, LinkedIn, CV)
- AI-powered skill gap analysis
- Dynamic CV generation with Gemini 2.0
- Semantic skill search using vector embeddings
- Market trend analysis and salary insights

Demo Video: [YOUR_YOUTUBE_LINK]
Tech Video: [YOUR_YOUTUBE_LINK]
GitHub: [YOUR_GITHUB_LINK]
```

---

## ✅ Final Checklist

Before hitting submit:

- [ ] All videos uploaded and set to Unlisted (not Private)
- [ ] GitHub repository is Public
- [ ] README.md has setup instructions
- [ ] PDF report generated and named correctly
- [ ] ZIP file created and < 100MB
- [ ] All links tested and working
- [ ] Project summary proofread
- [ ] Team member names added
- [ ] Contact email included
- [ ] Screenshots/images added to README
- [ ] License file added (MIT recommended)

---

## 🎯 Submission Deadline

**Hack Nation 2025 Deadline:** [INSERT DEADLINE]

**Recommended Timeline:**
- **Day 1:** Record and upload videos
- **Day 2:** Convert PDF, create ZIP, push to GitHub
- **Day 3:** Submit on both platforms
- **Buffer:** Test all links and make final adjustments

---

## 📞 Support

If you encounter issues:
- **Hack Nation Discord:** [Link if available]
- **Email:** support@hack-nation.ai
- **FAQ:** https://hack-nation.ai/faq

---

**Good luck! 🚀**
