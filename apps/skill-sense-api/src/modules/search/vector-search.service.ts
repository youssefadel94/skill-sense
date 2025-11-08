import { Injectable, Logger } from '@nestjs/common';
import { WeaviateService } from '../../shared/services/weaviate.service';

@Injectable()
export class VectorSearchService {
  private readonly logger = new Logger(VectorSearchService.name);

  constructor(private readonly weaviate: WeaviateService) {}

  async searchSkills(query: string, userId?: string, limit: number = 10) {
    this.logger.log(`Searching skills: ${query}`);
    return this.weaviate.searchSkills(query, userId, limit);
  }

  async addSkill(skillData: any) {
    this.logger.log(`Adding skill to vector store: ${skillData.name}`);
    return this.weaviate.addSkill(skillData);
  }
}
