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

  async findSimilarProfiles(userId: string, limit: number = 10): Promise<any[]> {
    this.logger.log(`Finding similar profiles for user: ${userId}`);

    try {
      // Get user's profile
      const userProfile: any = await this.firestore.getDocument('profiles', userId);
      if (!userProfile || !userProfile.skills || userProfile.skills.length === 0) {
        this.logger.warn(`No skills found for user ${userId}`);
        return [];
      }

      const userSkills = userProfile.skills.map((s: any) => s.name || s);
      this.logger.log(`User has ${userSkills.length} skills: ${userSkills.slice(0, 5).join(', ')}...`);

      // Check if Weaviate is available
      const isReady = await this.weaviate.isReady();
      if (!isReady) {
        this.logger.warn('Weaviate not available, falling back to Firestore-based matching');
        return this.findSimilarProfilesFirestore(userId, userSkills, limit);
      }

      // For now, use Firestore-based matching until Weaviate text vectorization is configured
      this.logger.log('Using Firestore-based skill matching (Weaviate text vectorization not configured)');
      return this.findSimilarProfilesFirestore(userId, userSkills, limit);

    } catch (error) {
      this.logger.error(`Error finding similar profiles: ${error.message}`, error.stack);
      // Fallback to simple Firestore matching
      try {
        const userProfile: any = await this.firestore.getDocument('profiles', userId);
        const userSkills = userProfile?.skills?.map((s: any) => s.name || s) || [];
        return this.findSimilarProfilesFirestore(userId, userSkills, limit);
      } catch (fallbackError) {
        this.logger.error(`Fallback also failed: ${fallbackError.message}`);
        return [];
      }
    }
  }

  /**
   * Fallback method to find similar profiles using Firestore when Weaviate is unavailable
   */
  private async findSimilarProfilesFirestore(userId: string, userSkills: string[], limit: number): Promise<any[]> {
    this.logger.log('Using Firestore-based skill matching');
    
    try {
      // Get all profiles
      const allProfiles = await this.firestore.listDocuments('profiles', 1000);
      
      const similarProfiles: any[] = [];
      
      for (const profile of allProfiles) {
        // Skip the current user
        if (profile.id === userId) {
          continue;
        }

        const profileData = profile as any;
        const profileSkills = profileData.skills?.map((s: any) => s.name || s) || [];
        
        if (profileSkills.length === 0) {
          continue;
        }

        // Calculate overlap
        const matchingSkills = userSkills.filter(skill => 
          profileSkills.some(ps => ps.toLowerCase() === skill.toLowerCase())
        );

        if (matchingSkills.length > 0) {
          const similarityScore = Math.round((matchingSkills.length / Math.max(userSkills.length, profileSkills.length)) * 100);
          
          similarProfiles.push({
            userId: profile.id,
            name: profileData.name || 'Anonymous User',
            title: profileData.title || 'Professional',
            location: profileData.location || null,
            profilePicture: profileData.profilePicture || null,
            similarityScore,
            matchingSkills,
            email: profileData.email,
          });
        }
      }

      // Sort by similarity and limit
      const sortedProfiles = similarProfiles
        .sort((a, b) => b.similarityScore - a.similarityScore)
        .slice(0, limit);

      this.logger.log(`✓ Firestore matching found ${sortedProfiles.length} similar profiles`);
      return sortedProfiles;
      
    } catch (error) {
      this.logger.error(`Firestore matching failed: ${error.message}`);
      return [];
    }
  }
}
