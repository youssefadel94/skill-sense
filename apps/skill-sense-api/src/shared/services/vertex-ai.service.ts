import { Injectable, Logger } from '@nestjs/common';
import { PredictionServiceClient } from '@google-cloud/aiplatform';
import { protos } from '@google-cloud/aiplatform';

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
  private readonly client: PredictionServiceClient;
  private readonly project: string;
  private readonly location: string;
  private readonly model: string = 'gemini-1.5-flash';

  constructor() {
    this.client = new PredictionServiceClient({
      apiEndpoint: `${process.env.GCP_LOCATION || 'us-central1'}-aiplatform.googleapis.com`,
    });
    this.project = process.env.GCP_PROJECT_ID || '';
    this.location = process.env.GCP_LOCATION || 'us-central1';
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
      const response = await this.callGemini(prompt);
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
      // Fallback to mock data on error
      return this.getMockSkills(text);
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    this.logger.debug(`Generating embedding for text (${text.length} chars)`);
    
    if (!this.project) {
      this.logger.warn('GCP_PROJECT_ID not set, using mock embedding');
      return this.getMockEmbedding();
    }

    try {
      const endpoint = `projects/${this.project}/locations/${this.location}/publishers/google/models/textembedding-gecko@003`;
      
      const instance = {
        content: text.substring(0, 3072), // Max 3072 tokens for text-embedding-gecko
      };

      const request = {
        endpoint,
        instances: [instance],
      };

      const [response] = await this.client.predict(request as any);
      const predictions = response.predictions as any[];
      
      if (predictions && predictions[0] && predictions[0].embeddings) {
        return predictions[0].embeddings.values;
      }

      return this.getMockEmbedding();
    } catch (error) {
      this.logger.error(`Embedding generation failed: ${error.message}`);
      return this.getMockEmbedding();
    }
  }

  private async callGemini(prompt: string): Promise<string> {
    const endpoint = `projects/${this.project}/locations/${this.location}/publishers/google/models/${this.model}`;
    
    const instanceValue = {
      content: prompt,
    };

    const parameters = {
      temperature: 0.2,
      maxOutputTokens: 2048,
      topP: 0.8,
      topK: 40,
    };

    const request = {
      endpoint,
      instances: [{ content: prompt }],
      parameters,
    };

    try {
      const [response] = await this.client.predict(request as any);
      const predictions = response.predictions as any[];
      
      if (predictions && predictions.length > 0) {
        return predictions[0].content || predictions[0].text || JSON.stringify(predictions[0]);
      }

      throw new Error('No predictions returned from Gemini');
    } catch (error) {
      this.logger.error(`Gemini API call failed: ${error.message}`);
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

  private getMockEmbedding(): number[] {
    // Return a mock 768-dimensional embedding (typical for text-embedding-gecko)
    return Array.from({ length: 768 }, () => Math.random() * 2 - 1);
  }
}
