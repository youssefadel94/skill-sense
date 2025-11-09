import { Injectable, Logger } from '@nestjs/common';
import { VertexAIService } from '../../../shared/services/vertex-ai.service';
import { GcsService } from '../../../shared/services/gcs.service';

@Injectable()
export class CvParserService {
  private readonly logger = new Logger(CvParserService.name);

  constructor(
    private readonly vertexAI: VertexAIService,
    private readonly gcs: GcsService,
  ) {}

  /**
   * Upload CV file to GCS and extract skills using Vertex AI
   * Supports PDF, DOCX, and text files
   */
  async parseCVFromFile(file: any, userId: string): Promise<any> {
    this.logger.log(`[CV PARSER] Starting CV parsing - File: ${file.originalname}, User: ${userId}`);
    this.logger.debug(`[CV PARSER] File metadata - Size: ${(file.size / 1024).toFixed(2)} KB, Type: ${file.mimetype}`);
    
    try {
      // Upload to GCS with content type
      const gcsPath = `cvs/${userId}/${Date.now()}-${file.originalname}`;
      this.logger.debug(`[CV PARSER] Uploading to GCS path: ${gcsPath}`);
      
      const gcsUri = await this.gcs.uploadFile(file.buffer, gcsPath, file.mimetype);
      
      this.logger.log(`[CV PARSER] ✓ File uploaded to GCS: ${gcsUri}`);
      
      // Extract skills using Vertex AI (directly from GCS URI)
      this.logger.debug(`[CV PARSER] Initiating Vertex AI skill extraction...`);
      const skills = await this.vertexAI.extractSkillsFromDocument(gcsUri);
      
      const skillCount = skills.skills?.length || 0;
      this.logger.log(`[CV PARSER] ✓ Vertex AI extraction complete - ${skillCount} skills extracted`);
      this.logger.debug(`[CV PARSER] Extraction metadata: ${JSON.stringify(skills.metadata)}`);
      
      return {
        source: 'cv',
        gcsUri,
        fileName: file.originalname,
        fileType: file.mimetype,
        skills,
      };
    } catch (error: any) {
      this.logger.error(`[CV PARSER] ✗ Failed to parse CV: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Parse CV from existing GCS URL
   */
  async parseCVFromUrl(fileUrl: string): Promise<any> {
    this.logger.log(`Parsing CV from URL: ${fileUrl}`);
    
    // Extract skills using Vertex AI
    const skills = await this.vertexAI.extractSkillsFromDocument(fileUrl);
    
    return {
      source: 'cv',
      fileUrl,
      skills,
    };
  }
}
