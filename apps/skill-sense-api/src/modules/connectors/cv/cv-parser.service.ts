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

  async parseCV(fileUrl: string): Promise<any> {
    this.logger.log(`Parsing CV from: ${fileUrl}`);
    
    // Download CV from GCS
    const filename = this.extractFilename(fileUrl);
    const fileBuffer = await this.gcs.downloadFile(filename);
    
    // Convert to text (placeholder)
    const text = fileBuffer.toString('utf-8');
    
    // Extract skills using Vertex AI
    const skills = await this.vertexAI.extractSkills(text);
    
    return {
      source: 'cv',
      skills,
      rawText: text.substring(0, 500), // First 500 chars
    };
  }

  private extractFilename(url: string): string {
    return url.split('/').pop() || '';
  }
}
