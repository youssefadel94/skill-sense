import { Injectable, Logger } from '@nestjs/common';
import weaviate, { WeaviateClient } from 'weaviate-ts-client';

@Injectable()
export class WeaviateService {
  private readonly logger = new Logger(WeaviateService.name);
  private client: WeaviateClient;

  constructor() {
    this.initializeClient();
  }

  private initializeClient() {
    this.client = weaviate.client({
      scheme: process.env.WEAVIATE_SCHEME || 'https',
      host: process.env.WEAVIATE_HOST || 'localhost:8080',
      apiKey: new weaviate.ApiKey(process.env.WEAVIATE_API_KEY || ''),
    });
    this.logger.log('Weaviate client initialized');
  }

  async createSchema() {
    const schema = {
      class: 'Skill',
      description: 'Professional skill with metadata',
      vectorizer: 'text2vec-transformers',
      properties: [
        { name: 'name', dataType: ['string'], description: 'Skill name' },
        { name: 'category', dataType: ['string'], description: 'Skill category' },
        { name: 'proficiency', dataType: ['string'], description: 'Proficiency level' },
        { name: 'evidence', dataType: ['text'], description: 'Evidence quote' },
        { name: 'source', dataType: ['string'], description: 'Source of skill' },
        { name: 'userId', dataType: ['string'], description: 'User ID' },
        { name: 'confidence', dataType: ['number'], description: 'Confidence score' },
      ],
    };

    try {
      await this.client.schema.classCreator().withClass(schema).do();
      this.logger.log('Weaviate schema created');
    } catch (error) {
      this.logger.warn('Schema may already exist', error.message);
    }
  }

  async addSkill(skillData: any) {
    return this.client.data
      .creator()
      .withClassName('Skill')
      .withProperties(skillData)
      .do();
  }

  async searchSkills(query: string, userId?: string, limit: number = 10) {
    let queryBuilder = this.client.graphql
      .get()
      .withClassName('Skill')
      .withFields('name category proficiency evidence source confidence')
      .withNearText({ concepts: [query] })
      .withLimit(limit);

    if (userId) {
      queryBuilder = queryBuilder.withWhere({
        path: ['userId'],
        operator: 'Equal',
        valueString: userId,
      });
    }

    const result = await queryBuilder.do();
    return result.data.Get.Skill || [];
  }
}
