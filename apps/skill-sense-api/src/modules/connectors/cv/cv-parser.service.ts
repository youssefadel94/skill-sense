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
    this.logger.log(`Parsing CV file: ${file.originalname} for user: ${userId}`);
    
    // Upload to GCS with content type
    const gcsPath = `cvs/${userId}/${Date.now()}-${file.originalname}`;
    const gcsUri = await this.gcs.uploadFile(file.buffer, gcsPath, file.mimetype);
    
    this.logger.log(`Uploaded CV to GCS: ${gcsUri}`);
    
    // Extract skills using Vertex AI (directly from GCS URI)
    const skills = await this.vertexAI.extractSkillsFromDocument(gcsUri);
    
    return {
      source: 'cv',
      gcsUri,
      fileName: file.originalname,
      fileType: file.mimetype,
      skills,
    };
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
