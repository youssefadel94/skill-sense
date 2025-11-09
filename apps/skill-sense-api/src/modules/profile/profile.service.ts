import { Injectable, Logger } from '@nestjs/common';
import { FirestoreService } from '../../shared/services/firestore.service';
import { VertexAIService } from '../../shared/services/vertex-ai.service';

@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);
  private readonly collection = 'profiles';

  constructor(
    private readonly firestore: FirestoreService,
    private readonly vertexAI: VertexAIService,
  ) {}

  async createProfile(data: any) {
    this.logger.log('Creating profile');
    return this.firestore.createDocument(this.collection, {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  async getProfile(id: string) {
    this.logger.log(`Fetching profile: ${id}`);
    return this.firestore.getDocument(this.collection, id);
  }

  async listProfiles() {
    this.logger.log('Listing all profiles');
    const snapshot = await this.firestore.getCollection(this.collection).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async deleteProfile(id: string) {
    this.logger.log(`Deleting profile: ${id}`);
    await this.firestore.deleteDocument(this.collection, id);
    return { success: true };
  }

  async analyzeSkillGaps(userId: string, targetRole: string) {
    this.logger.log(`Analyzing skill gaps for ${userId} targeting ${targetRole}`);

    // Get user's profile
    const profile: any = await this.getProfile(userId);
    if (!profile) {
      throw new Error('Profile not found');
    }

    // Extract skill names from profile
    const currentSkills = profile.skills?.map(s => s.name || s) || [];

    // Analyze using Vertex AI
    const analysis = await this.vertexAI.analyzeSkillGaps(currentSkills, targetRole);

    // Save analysis for future reference
    await this.firestore.createDocument('skill-gap-analyses', {
      userId,
      targetRole,
      ...analysis,
      createdAt: new Date().toISOString(),
    });

    return {
      userId,
      targetRole,
      currentSkills,
      ...analysis,
    };
  }

  async getSkillRecommendations(userId: string, targetRole?: string) {
    this.logger.log(`Getting skill recommendations for ${userId}`);

    // Get user's profile
    const profile: any = await this.getProfile(userId);
    if (!profile) {
      throw new Error('Profile not found');
    }

    // Extract skill names
    const currentSkills = profile.skills?.map(s => s.name || s) || [];

    // Get recommendations from Vertex AI
    const recommendations = await this.vertexAI.recommendSkills(currentSkills, targetRole);

    // Save recommendations
    await this.firestore.createDocument('skill-recommendations', {
      userId,
      targetRole,
      ...recommendations,
      createdAt: new Date().toISOString(),
    });

    return {
      userId,
      targetRole,
      currentSkills,
      ...recommendations,
    };
  }

  async getSkillTrends() {
    this.logger.log('Fetching skill trends');

    try {
      // Get all profiles
      const profiles = await this.firestore.listDocuments(this.collection, 1000);

      if (!profiles || profiles.length === 0) {
        return {
          trending: [],
          topCategories: [],
          totalProfiles: 0,
          message: 'No profiles found',
        };
      }

      // Count skills
      const skillCounts = new Map<string, number>();
      const categoryCounts = new Map<string, number>();

      profiles.forEach((profile: any) => {
        profile.skills?.forEach((skill: any) => {
          const name = skill.name || skill;
          const category = skill.category || 'uncategorized';

          skillCounts.set(name, (skillCounts.get(name) || 0) + 1);
          categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
        });
      });

      // Sort by popularity
      const trending = Array.from(skillCounts.entries())
        .map(([skill, count]) => ({
          skill,
          count,
          percentage: ((count / profiles.length) * 100).toFixed(1),
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20);

      const topCategories = Array.from(categoryCounts.entries())
        .map(([category, count]) => ({
          category,
          count,
          percentage: ((count / profiles.length) * 100).toFixed(1),
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return {
        trending,
        topCategories,
        totalProfiles: profiles.length,
        totalUniqueSkills: skillCounts.size,
      };
    } catch (error) {
      this.logger.error(`Error fetching skill trends: ${error.message}`);
      return {
        trending: [],
        topCategories: [],
        error: error.message,
      };
    }
  }
}
