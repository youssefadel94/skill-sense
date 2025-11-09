import { Injectable, Logger } from '@nestjs/common';
import { VertexAI, HarmCategory, HarmBlockThreshold } from '@google-cloud/vertexai';

interface ExtractedSkill {
  name: string;
  category: string;
  proficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  evidence: string | string[];
  confidence: number;
}

interface SkillExtractionResult {
  skills: ExtractedSkill[];
  metadata: {
    model: string;
    timestamp: string;
    textLength: number;
  };
}

@Injectable()
export class VertexAIService {
  private readonly logger = new Logger(VertexAIService.name);
  private readonly vertexAI: VertexAI;
  private readonly project: string;
  private readonly location: string;
  private readonly model: string = 'gemini-2.0-flash-lite-001';

  constructor() {
    this.project = process.env.GCP_PROJECT_ID || '';
    this.location = process.env.GCP_LOCATION || 'us-central1';
    
    this.vertexAI = new VertexAI({
      project: this.project,
      location: this.location,
    });
    
    this.logger.log(`Vertex AI service initialized for project: ${this.project}`);
  }

  async extractSkills(text: string): Promise<SkillExtractionResult> {
    this.logger.debug(`Extracting skills from text (${text.length} chars)`);
    
    if (!this.project) {
      this.logger.warn('GCP_PROJECT_ID not set, using mock data');
      return this.getMockSkills(text);
    }

    try {
      const prompt = this.buildSkillExtractionPrompt(text);
      const response = await this.generateContent(prompt);
      const skills = this.parseSkillsResponse(response);

      return {
        skills,
        metadata: {
          model: this.model,
          timestamp: new Date().toISOString(),
          textLength: text.length,
        },
      };
    } catch (error) {
      this.logger.error(`Vertex AI extraction failed: ${error.message}`, error.stack);
      return this.getMockSkills(text);
    }
  }

  /**
   * Extract skills from PDF/DOCX file stored in GCS
   */
  async extractSkillsFromDocument(gcsUri: string): Promise<SkillExtractionResult> {
    this.logger.debug(`Extracting skills from document: ${gcsUri}`);
    
    if (!this.project) {
      this.logger.warn('GCP_PROJECT_ID not set, using mock data');
      return this.getMockSkills('Document upload (mock mode)');
    }

    try {
      const prompt = `You are an expert career analyst. Extract all technical and professional skills from the attached CV/Resume document.

IMPORTANT: Return ONLY a JSON array. No explanations, no markdown, no additional text. Just the raw JSON array.

For each skill found in the document, create an object with:
- name: The specific skill name (e.g., "Python", "React", "Project Management")
- category: Must be one of: "programming_language", "framework", "tool", "soft_skill", "domain_knowledge", "certification", "methodology"
- proficiency: Estimate based on context: "beginner", "intermediate", "advanced", or "expert"
- evidence: A brief quote from the document showing this skill (max 100 chars)
- confidence: A score from 0.0 to 1.0 (how confident you are this is a real skill)

Example format (return ONLY this format, nothing else):
[
  {
    "name": "Python",
    "category": "programming_language",
    "proficiency": "advanced",
    "evidence": "5 years Python development",
    "confidence": 0.95
  },
  {
    "name": "Leadership",
    "category": "soft_skill",
    "proficiency": "expert",
    "evidence": "Led team of 10 developers",
    "confidence": 0.9
  }
]

Extract ALL skills you can find. Return the JSON array now:`;

      const response = await this.generateContentWithFile(prompt, gcsUri);
      this.logger.debug(`Raw Gemini response length: ${response.length} chars`);
      
      const skills = this.parseSkillsResponse(response);

      return {
        skills,
        metadata: {
          model: this.model,
          timestamp: new Date().toISOString(),
          textLength: 0,
        },
      };
    } catch (error: any) {
      // Check if this is a service agent provisioning error
      if (error.message?.includes('Service agents are being provisioned') || 
          error.message?.includes('FAILED_PRECONDITION')) {
        this.logger.warn('Vertex AI service agents are being provisioned. This is a one-time setup. Using fallback for now.');
        this.logger.warn('Please wait a few minutes and try again, or check: https://cloud.google.com/vertex-ai/docs/general/access-control#service-agents');
      }
      
      this.logger.error(`Document extraction failed: ${error.message}`, error.stack);
      
      // Return mock skills as fallback
      return this.getMockSkills('Document upload (error fallback)');
    }
  }

  /**
   * Generate content using Gemini with text prompt only
   */
  private async generateContent(prompt: string): Promise<string> {
    try {
      const generativeModel = this.vertexAI.preview.getGenerativeModel({
        model: this.model,
        generationConfig: {
          maxOutputTokens: 8192,
          temperature: 0.2,
          topP: 0.8,
        },
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
        ],
      });

      const request = {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      };

      const streamingResp = await generativeModel.generateContentStream(request);
      
      let completeText = '';
      for await (const item of streamingResp.stream) {
        if (item?.candidates && item.candidates.length > 0) {
          const parts = item.candidates[0]?.content?.parts;
          if (parts && parts.length > 0 && parts[0]?.text) {
            completeText += parts[0].text;
          }
        }
      }

      return completeText;
    } catch (error: any) {
      this.logger.error(`Gemini content generation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate content with file from GCS
   */
  private async generateContentWithFile(prompt: string, gcsUri: string): Promise<string> {
    try {
      // Format GCS URI properly
      const formattedUri = gcsUri.startsWith('gs://') 
        ? gcsUri 
        : `gs://${gcsUri.replace(/^https?:\/\/storage\.googleapis\.com\//, '')}`;

      this.logger.debug(`Using GCS URI: ${formattedUri}`);

      const generativeModel = this.vertexAI.preview.getGenerativeModel({
        model: this.model,
        generationConfig: {
          maxOutputTokens: 8192,
          temperature: 0.2,
          topP: 0.8,
        },
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
        ],
      });

      const request = {
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              {
                fileData: {
                  fileUri: formattedUri,
                  mimeType: 'application/pdf',
                },
              },
            ],
          },
        ],
      } as any; // Type assertion for fileData compatibility

      const streamingResp = await generativeModel.generateContentStream(request);
      
      let completeText = '';
      for await (const item of streamingResp.stream) {
        if (item?.candidates && item.candidates.length > 0) {
          const parts = item.candidates[0]?.content?.parts;
          if (parts && parts.length > 0 && parts[0]?.text) {
            completeText += parts[0].text;
          }
        }
      }

      return completeText;
    } catch (error: any) {
      this.logger.error(`Gemini document generation failed: ${error.message}`);
      throw error;
    }
  }

  private buildSkillExtractionPrompt(text: string): string {
    return `You are an expert career analyst and skill extractor. Analyze the following professional text and extract all technical and professional skills.

IMPORTANT: Return ONLY a JSON array. No explanations, no markdown, no additional text. Just the raw JSON array.

For each skill found, create an object with:
- name: The specific skill name (e.g., "Python", "React", "Project Management")
- category: Must be one of: "programming_language", "framework", "tool", "soft_skill", "domain_knowledge", "certification", "methodology"
- proficiency: Estimate based on context: "beginner", "intermediate", "advanced", or "expert"
- evidence: A brief quote from the text showing this skill (max 100 chars)
- confidence: A score from 0.0 to 1.0 (how confident you are this is a real skill)

Example format (return ONLY this format, nothing else):
[
  {
    "name": "Python",
    "category": "programming_language",
    "proficiency": "advanced",
    "evidence": "Developed scalable applications using Python",
    "confidence": 0.95
  }
]

Text to analyze:
${text}

Extract ALL skills you can find. Return the JSON array now:`;
  }

  private parseSkillsResponse(response: string): ExtractedSkill[] {
    try {
      this.logger.debug(`Parsing skills response (${response.length} chars)`);
      
      // Clean up response - remove markdown code blocks if present
      let cleanedResponse = response.trim();
      
      // Try to extract JSON from code blocks first
      const jsonBlockMatch = cleanedResponse.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonBlockMatch) {
        cleanedResponse = jsonBlockMatch[1].trim();
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/```[a-z]*\s*/g, '').replace(/```\s*$/g, '');
      }
      
      // Try to find JSON array in the response
      const jsonArrayMatch = cleanedResponse.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (jsonArrayMatch) {
        cleanedResponse = jsonArrayMatch[0];
      }

      this.logger.debug(`Cleaned response: ${cleanedResponse.substring(0, 200)}...`);

      const parsed = JSON.parse(cleanedResponse);
      
      if (Array.isArray(parsed)) {
        const skills = parsed.map(skill => ({
          name: skill.name || 'Unknown',
          category: skill.category || 'other',
          proficiency: skill.proficiency || 'intermediate',
          evidence: skill.evidence ? [skill.evidence] : [],  // Convert string to array
          confidence: skill.confidence || 0.5,
        }));
        
        this.logger.log(`Successfully parsed ${skills.length} skills from response`);
        return skills;
      }

      this.logger.warn('Parsed response is not an array, returning empty skills');
      this.logger.debug(`Parsed value: ${JSON.stringify(parsed)}`);
      return [];
    } catch (error) {
      this.logger.error(`Failed to parse skills response: ${error.message}`);
      this.logger.debug(`Raw response (first 500 chars): ${response.substring(0, 500)}`);
      return [];
    }
  }

  private getMockSkills(text: string): SkillExtractionResult {
    // Extract some basic skills from text for demo purposes
    const mockSkills: ExtractedSkill[] = [];
    
    const skillPatterns = {
      'Python': 'programming_language',
      'JavaScript': 'programming_language',
      'TypeScript': 'programming_language',
      'Java': 'programming_language',
      'React': 'framework',
      'Angular': 'framework',
      'Node.js': 'framework',
      'Docker': 'tool',
      'Kubernetes': 'tool',
      'AWS': 'tool',
      'GCP': 'tool',
      'Azure': 'tool',
      'Leadership': 'soft_skill',
      'Communication': 'soft_skill',
      'Project Management': 'soft_skill',
    };

    for (const [skill, category] of Object.entries(skillPatterns)) {
      if (text.toLowerCase().includes(skill.toLowerCase())) {
        mockSkills.push({
          name: skill,
          category,
          proficiency: 'intermediate',
          evidence: [`Mentioned in text: "${text.substring(0, 100)}..."`],  // Return as array
          confidence: 0.7,
        });
      }
    }

    return {
      skills: mockSkills,
      metadata: {
        model: 'mock',
        timestamp: new Date().toISOString(),
        textLength: text.length,
      },
    };
  }

  /**
   * Analyze skill gaps for a target role
   */
  async analyzeSkillGaps(
    currentSkills: string[],
    targetRole: string,
  ): Promise<any> {
    this.logger.debug(`Analyzing skill gaps for ${targetRole}`);
    this.logger.debug(`Current skills: ${currentSkills.join(', ')}`);

    const prompt = `You are a career development expert. Analyze skill gaps for someone targeting this role.

Target Role: ${targetRole}
Current Skills: ${currentSkills.join(', ')}

Provide a comprehensive skill gap analysis including:
1. Missing critical skills
2. Skills that need improvement
3. Priority levels (critical, high, medium, low)
4. Estimated time to acquire each skill
5. Recommended learning resources

Return ONLY a valid JSON object with this structure:
{
  "gaps": [
    {
      "skill": "skill name",
      "category": "programming_language|framework|tool|soft_skill|domain_knowledge",
      "currentLevel": "none|beginner|intermediate|advanced|expert",
      "requiredLevel": "beginner|intermediate|advanced|expert",
      "priority": "critical|high|medium|low",
      "timeToAcquire": "e.g., 2-3 months",
      "resources": ["resource 1", "resource 2"]
    }
  ],
  "summary": "overall assessment summary in 2-3 sentences"
}

Return JSON only, no markdown formatting.`;

    try {
      this.logger.debug('Calling Gemini API for skill gap analysis...');
      const response = await this.generateContent(prompt);
      this.logger.debug(`Gemini response received, length: ${response.length}`);
      this.logger.debug(`Raw response preview: ${response.substring(0, 200)}...`);
      
      const parsed = this.parseJSON(response);
      this.logger.log(`Skill gap analysis complete: ${parsed.gaps?.length || 0} gaps found`);
      
      return parsed;
    } catch (error) {
      this.logger.error(`Skill gap analysis failed: ${error.message}`);
      this.logger.error(`Error stack: ${error.stack}`);
      
      // Return a more helpful error response
      return {
        gaps: [],
        summary: `Analysis failed: ${error.message}. Please try again or check your configuration.`,
        error: error.message
      };
    }
  }

  /**
   * Recommend next skills to learn
   */
  async recommendSkills(
    currentSkills: string[],
    targetRole?: string,
  ): Promise<any> {
    this.logger.debug(`Recommending skills based on: ${currentSkills.join(', ')}`);

    const prompt = `You are a career development advisor. Based on these current skills, recommend complementary skills to learn next.

Current Skills: ${currentSkills.join(', ')}
${targetRole ? `Target Role: ${targetRole}` : ''}

Recommend 5-10 high-value skills that would complement the current skill set.

Return ONLY a valid JSON object:
{
  "recommendations": [
    {
      "skill": "skill name",
      "reason": "why this skill complements current skills",
      "relevance": 0.95,
      "demandScore": 0.9,
      "difficulty": "beginner|intermediate|advanced",
      "estimatedLearningTime": "e.g., 2-3 months"
    }
  ],
  "summary": "overall recommendation strategy in 2-3 sentences"
}

Return JSON only, no markdown formatting.`;

    try {
      const response = await this.generateContent(prompt);
      const parsed = this.parseJSON(response);
      return parsed;
    } catch (error) {
      this.logger.error(`Skill recommendations failed: ${error.message}`);
      return {
        recommendations: [],
        summary: 'Recommendations failed. Please try again.',
      };
    }
  }

  /**
   * Generate market intelligence for skills
   */
  async generateMarketIntelligence(skills: string[]): Promise<any> {
    this.logger.debug(`Generating market intelligence for ${skills.length} skills`);

    if (!this.project) {
      this.logger.warn('GCP_PROJECT_ID not set, using mock market data');
      return this.getMockMarketData(skills);
    }

    try {
      const prompt = `You are a tech market analyst. For each of the following skills, provide current market intelligence.

Skills: ${skills.join(', ')}

For each skill, provide:
- demandChange: percentage change in demand over last year (-100 to +100)
- currentDemand: current market demand level (0-100, where 100 is highest)
- salaryRange: typical salary range in USD (be realistic based on skill)
- growthRate: 'rising' (>15% growth), 'stable' (-15% to +15%), or 'declining' (<-15%)
- jobOpenings: estimated number of current job openings (realistic numbers)

Return ONLY a JSON object with skill names as keys. Example:
{
  "React": {
    "demandChange": 25,
    "currentDemand": 85,
    "salaryRange": { "min": 80000, "max": 150000 },
    "growthRate": "rising",
    "jobOpenings": 15000
  }
}`;

      const response = await this.generateContent(prompt);
      return this.parseJSON(response);
    } catch (error) {
      this.logger.error(`Market intelligence generation failed: ${error.message}`);
      return this.getMockMarketData(skills);
    }
  }

  /**
   * Generate mock market data for development/fallback
   */
  private getMockMarketData(skills: string[]): any {
    const result: any = {};
    
    skills.forEach((skill, index) => {
      // Create varied but realistic mock data
      const baseChange = (Math.random() * 60) - 20; // -20 to +40
      const baseDemand = 50 + (Math.random() * 40); // 50-90
      
      result[skill] = {
        demandChange: Math.round(baseChange),
        currentDemand: Math.round(baseDemand),
        salaryRange: {
          min: 60000 + Math.floor(Math.random() * 40000),
          max: 100000 + Math.floor(Math.random() * 80000)
        },
        growthRate: baseChange > 15 ? 'rising' : baseChange < -15 ? 'declining' : 'stable',
        jobOpenings: Math.floor(1000 + Math.random() * 20000)
      };
    });

    return result;
  }

  /**
   * Generate professional CV content based on user's profile and skills
   */
  async generateCVContent(profile: any, options: {
    template: string;
    targetRole?: string;
    emphasisCategories?: string[];
  }): Promise<string> {
    this.logger.debug(`Generating CV content for ${profile.name || 'user'} with template ${options.template}`);

    if (!this.project) {
      this.logger.warn('GCP_PROJECT_ID not set, using mock CV content');
      return this.getMockCVContent(profile, options);
    }

    try {
      const skills = profile.skills || [];
      const skillsByCategory = this.groupSkillsByCategory(skills);
      
      const prompt = `You are a professional CV writer. Generate a compelling CV/Resume content in HTML format.

Profile Information:
- Name: ${profile.name || 'Professional'}
- Email: ${profile.email || ''}
- Target Role: ${options.targetRole || 'Software Engineer'}
${options.emphasisCategories?.length ? `- Emphasize these skill categories: ${options.emphasisCategories.join(', ')}` : ''}

Skills (extracted from GitHub, LinkedIn, and uploaded CVs):
${JSON.stringify(skillsByCategory, null, 2)}

Template Style: ${options.template} (modern, classic, creative, or minimal)

Generate a professional CV with these sections:
1. Professional Summary (2-3 sentences highlighting key strengths and experience)
2. Key Skills (organized by category, emphasizing requested categories if provided)
3. Technical Competencies (detailed skill breakdown with proficiency levels)
4. Notable Achievements (inferred from skill levels and categories)

IMPORTANT REQUIREMENTS:
- Use semantic HTML5 tags
- Include inline CSS for styling that matches the ${options.template} template
- Make it print-ready and professional
- Highlight skills in ${options.emphasisCategories?.join(', ') || 'all categories'} prominently
- Keep professional tone appropriate for ${options.targetRole || 'software engineering'}
- Use color scheme appropriate for ${options.template} style:
  - modern: Purple/blue gradient (#667eea to #764ba2)
  - classic: Navy and gray (#1e3a8a, #64748b)
  - creative: Vibrant colors (#f59e0b, #10b981, #6366f1)
  - minimal: Black and white with subtle gray (#000, #666, #f5f5f5)

Return ONLY the HTML content, no explanations.`;

      const response = await this.generateContent(prompt);
      return this.cleanHTMLResponse(response);
    } catch (error) {
      this.logger.error(`CV content generation failed: ${error.message}`);
      return this.getMockCVContent(profile, options);
    }
  }

  /**
   * Group skills by category for better organization
   */
  private groupSkillsByCategory(skills: any[]): any {
    const grouped: any = {};
    
    skills.forEach((skill: any) => {
      const category = skill.category || 'Other';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push({
        name: skill.name,
        proficiency: skill.proficiency || 'intermediate',
        evidence: skill.evidence || ''
      });
    });
    
    return grouped;
  }

  /**
   * Clean HTML response from AI (remove markdown code blocks if present)
   */
  private cleanHTMLResponse(response: string): string {
    let cleaned = response.trim();
    
    // Remove markdown code blocks
    if (cleaned.startsWith('```html')) {
      cleaned = cleaned.replace(/```html\s*/g, '').replace(/```\s*$/g, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/```\s*/g, '');
    }
    
    return cleaned.trim();
  }

  /**
   * Generate mock CV content for development/fallback
   */
  private getMockCVContent(profile: any, options: any): string {
    const skills = profile.skills || [];
    const topSkills = skills.slice(0, 12).map((s: any) => s.name).join(', ');
    
    const colorSchemes: any = {
      modern: { primary: '#667eea', secondary: '#764ba2', bg: '#f0f4ff' },
      classic: { primary: '#1e3a8a', secondary: '#64748b', bg: '#f8fafc' },
      creative: { primary: '#f59e0b', secondary: '#10b981', bg: '#fef3c7' },
      minimal: { primary: '#000', secondary: '#666', bg: '#f5f5f5' }
    };
    
    const colors = colorSchemes[options.template] || colorSchemes.modern;
    
    return `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; background: white;">
        <header style="border-bottom: 3px solid ${colors.primary}; padding-bottom: 20px; margin-bottom: 30px;">
          <h1 style="color: ${colors.primary}; margin: 0 0 5px 0; font-size: 36px;">${profile.name || 'Professional'}</h1>
          <p style="color: ${colors.secondary}; margin: 0; font-size: 18px;">${options.targetRole || 'Software Engineer'}</p>
          ${profile.email ? `<p style="color: #666; margin: 10px 0 0 0;">${profile.email}</p>` : ''}
        </header>

        <section style="margin-bottom: 30px;">
          <h2 style="color: ${colors.primary}; border-bottom: 2px solid ${colors.bg}; padding-bottom: 10px; font-size: 24px;">Professional Summary</h2>
          <p style="color: #333; line-height: 1.7; margin-top: 15px;">
            Experienced professional with expertise in ${topSkills || 'modern technologies'}. 
            Proven track record of delivering high-quality solutions and driving technical excellence. 
            Passionate about continuous learning and staying current with industry trends.
          </p>
        </section>

        <section style="margin-bottom: 30px;">
          <h2 style="color: ${colors.primary}; border-bottom: 2px solid ${colors.bg}; padding-bottom: 10px; font-size: 24px;">Key Skills</h2>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 15px;">
            ${skills.slice(0, 15).map((skill: any) => `
              <div style="padding: 12px; background: ${colors.bg}; border-radius: 6px; border-left: 3px solid ${colors.primary};">
                <div style="font-weight: 600; color: #333; margin-bottom: 4px;">${skill.name}</div>
                <div style="font-size: 12px; color: ${colors.secondary}; text-transform: capitalize;">${skill.proficiency || 'Intermediate'}</div>
              </div>
            `).join('')}
          </div>
        </section>

        <section style="margin-bottom: 30px;">
          <h2 style="color: ${colors.primary}; border-bottom: 2px solid ${colors.bg}; padding-bottom: 10px; font-size: 24px;">Technical Competencies</h2>
          ${this.generateSkillCategoryHTML(skills, colors)}
        </section>

        <section style="margin-bottom: 30px;">
          <h2 style="color: ${colors.primary}; border-bottom: 2px solid ${colors.bg}; padding-bottom: 10px; font-size: 24px;">Notable Achievements</h2>
          <ul style="color: #333; line-height: 1.8; margin-top: 15px;">
            <li>Demonstrated proficiency in ${skills.length} technical and professional skills</li>
            <li>Successfully integrated multiple skill sources (GitHub, LinkedIn, CV uploads)</li>
            <li>Continuous professional development through various learning platforms</li>
            <li>Applied modern development practices and industry standards</li>
          </ul>
        </section>

        <footer style="text-align: center; margin-top: 50px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #999; font-size: 12px;">
          Generated by SkillSense AI • ${new Date().toLocaleDateString()}
        </footer>
      </div>
    `;
  }

  /**
   * Generate HTML for skill categories
   */
  private generateSkillCategoryHTML(skills: any[], colors: any): string {
    const grouped = this.groupSkillsByCategory(skills);
    const categories = Object.keys(grouped);
    
    if (categories.length === 0) {
      return '<p style="color: #666; margin-top: 15px;">No skills extracted yet.</p>';
    }
    
    return categories.map(category => `
      <div style="margin-top: 20px;">
        <h3 style="color: ${colors.secondary}; font-size: 16px; margin-bottom: 10px; text-transform: capitalize;">
          ${category.replace(/_/g, ' ')}
        </h3>
        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
          ${grouped[category].map((skill: any) => `
            <span style="padding: 6px 12px; background: ${colors.bg}; color: ${colors.primary}; border-radius: 20px; font-size: 14px;">
              ${skill.name}
            </span>
          `).join('')}
        </div>
      </div>
    `).join('');
  }

  /**
   * Parse JSON response, handling markdown code blocks
   */
  private parseJSON(response: string): any {
    try {
      let cleaned = response.trim();
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/```\s*/g, '');
      }
      return JSON.parse(cleaned);
    } catch (error) {
      this.logger.error(`Failed to parse JSON: ${error.message}`);
      this.logger.debug(`Response was: ${response}`);
      throw error;
    }
  }
}
