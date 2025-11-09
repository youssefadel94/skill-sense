import { Injectable, Logger } from '@nestjs/common';
import { VertexAI, HarmCategory, HarmBlockThreshold } from '@google-cloud/vertexai';

interface ExtractedSkill {
  name: string;
  category: string;
  proficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  evidence: string;
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

For each skill, provide:
1. name: The specific skill name
2. category: One of: "programming_language", "framework", "tool", "soft_skill", "domain_knowledge", "certification", "methodology"
3. proficiency: Estimate based on context: "beginner", "intermediate", "advanced", or "expert"
4. evidence: A brief quote from the document
5. confidence: A score from 0.0 to 1.0

Return ONLY a valid JSON array of skill objects.`;

      const response = await this.generateContentWithFile(prompt, gcsUri);
      const skills = this.parseSkillsResponse(response);

      return {
        skills,
        metadata: {
          model: this.model,
          timestamp: new Date().toISOString(),
          textLength: 0,
        },
      };
    } catch (error) {
      this.logger.error(`Document extraction failed: ${error.message}`, error.stack);
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
      this.logger.error(`Gemini document generation failed: ${error.message}`);
      throw error;
    }
  }

  private buildSkillExtractionPrompt(text: string): string {
    return `You are an expert career analyst and skill extractor. Analyze the following professional text and extract all technical and professional skills.

For each skill, provide:
1. name: The specific skill name (e.g., "Python", "Project Management", "AWS")
2. category: One of: "programming_language", "framework", "tool", "soft_skill", "domain_knowledge", "certification", "methodology"
3. proficiency: Estimate based on context: "beginner", "intermediate", "advanced", or "expert"
4. evidence: A brief quote from the text that demonstrates this skill
5. confidence: A score from 0.0 to 1.0 indicating how confident you are this is a genuine skill

Return ONLY a valid JSON array of skill objects. No markdown, no explanations, just the JSON array.

Example format:
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

JSON response:`;
  }

  private parseSkillsResponse(response: string): ExtractedSkill[] {
    try {
      // Clean up response - remove markdown code blocks if present
      let cleanedResponse = response.trim();
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/```\s*/g, '');
      }

      const parsed = JSON.parse(cleanedResponse);
      
      if (Array.isArray(parsed)) {
        return parsed.map(skill => ({
          name: skill.name || 'Unknown',
          category: skill.category || 'other',
          proficiency: skill.proficiency || 'intermediate',
          evidence: skill.evidence || '',
          confidence: skill.confidence || 0.5,
        }));
      }

      this.logger.warn('Parsed response is not an array, returning empty skills');
      return [];
    } catch (error) {
      this.logger.error(`Failed to parse skills response: ${error.message}`);
      this.logger.debug(`Response was: ${response}`);
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
          evidence: `Mentioned in text: "${text.substring(0, 100)}..."`,
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
      const response = await this.generateContent(prompt);
      const parsed = this.parseJSON(response);
      return parsed;
    } catch (error) {
      this.logger.error(`Skill gap analysis failed: ${error.message}`);
      return {
        gaps: [],
        summary: 'Analysis failed. Please try again or check your configuration.',
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
