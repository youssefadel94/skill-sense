import { Injectable, Logger } from '@nestjs/common';
import { WeaviateService } from '../../shared/services/weaviate.service';
import { FirestoreService } from '../../shared/services/firestore.service';

@Injectable()
export class VectorSearchService {
  private readonly logger = new Logger(VectorSearchService.name);

  constructor(
    private readonly weaviate: WeaviateService,
    private readonly firestore: FirestoreService,
  ) {}

  async searchSkills(query: string, userId?: string, limit: number = 10) {
    this.logger.log(`Searching skills: ${query}`);
    return this.weaviate.searchSkills(query, userId, limit);
  }

  async addSkill(skillData: any) {
    this.logger.log(`Adding skill to vector store: ${skillData.name}`);
    return this.weaviate.addSkill(skillData);
  }

  async findSimilarProfiles(userId: string, limit: number = 10): Promise<any> {
    this.logger.log(`Finding similar profiles for user: ${userId}`);

    try {
      // Get user's skills
      const profile: any = await this.firestore.getDocument('profiles', userId);
      if (!profile || !profile.skills) {
        return { similarProfiles: [], message: 'No skills found for user' };
      }

      const userSkills = profile.skills.map((s: any) => s.name || s).join(', ');

      // Search for similar skill profiles in Weaviate
      const client = this.weaviate.getClient();
      const result = await client.graphql
        .get()
        .withClassName('Skill')
        .withNearText({ concepts: [userSkills] })
        .withWhere({
          path: ['userId'],
          operator: 'NotEqual',
          valueString: userId, // Exclude self
        })
        .withFields('userId name category proficiency _additional { distance }')
        .withLimit(limit)
        .do();

      const skills = result?.data?.Get?.Skill || [];

      // Group by userId to get unique profiles
      const profileMap = new Map<string, any>();
      skills.forEach((skill: any) => {
        const uid = skill.userId;
        if (!profileMap.has(uid)) {
          profileMap.set(uid, {
            userId: uid,
            skills: [],
            averageDistance: 0,
          });
        }
        profileMap.get(uid).skills.push({
          name: skill.name,
          category: skill.category,
          proficiency: skill.proficiency,
          distance: skill._additional?.distance,
        });
      });

      // Calculate average distance and sort
      const similarProfiles = Array.from(profileMap.values())
        .map((profile) => {
          const distances = profile.skills.map((s: any) => s.distance || 1);
          profile.averageDistance =
            distances.reduce((a: number, b: number) => a + b, 0) / distances.length;
          profile.similarity = (1 - profile.averageDistance) * 100;
          return profile;
        })
        .sort((a, b) => a.averageDistance - b.averageDistance);

      return {
        userId,
        similarProfiles,
        count: similarProfiles.length,
      };
    } catch (error) {
      this.logger.error(`Error finding similar profiles: ${error.message}`);
      return {
        userId,
        similarProfiles: [],
        error: error.message,
      };
    }
  }
}
