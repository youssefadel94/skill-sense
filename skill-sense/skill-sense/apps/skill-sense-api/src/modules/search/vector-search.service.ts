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

      // Search for similar skill profiles in Weaviate
      const userSkillsText = userSkills.join(', ');
      const client = this.weaviate.getClient();
      
      const result = await client.graphql
        .get()
        .withClassName('Skill')
        .withNearText({ concepts: [userSkillsText] })
        .withWhere({
          path: ['userId'],
          operator: 'NotEqual',
          valueString: userId, // Exclude self
        })
        .withFields('userId name category proficiency _additional { distance }')
        .withLimit(limit * 10) // Get more results to find unique profiles
        .do();

      const skills = result?.data?.Get?.Skill || [];
      this.logger.log(`Found ${skills.length} similar skills from vector search`);

      if (skills.length === 0) {
        this.logger.warn('No similar skills found in Weaviate, falling back to Firestore');
        return this.findSimilarProfilesFirestore(userId, userSkills, limit);
      }

      // Group by userId to get unique profiles
      const profileMap = new Map<string, any>();
      skills.forEach((skill: any) => {
        const uid = skill.userId;
        if (!profileMap.has(uid)) {
          profileMap.set(uid, {
            userId: uid,
            skills: [],
            distances: [],
          });
        }
        const profileData = profileMap.get(uid);
        profileData.skills.push(skill.name);
        profileData.distances.push(skill._additional?.distance || 1);
      });

      // Fetch full profile data and calculate similarity
      const similarProfiles: any[] = [];
      for (const [uid, data] of profileMap.entries()) {
        try {
          const profile: any = await this.firestore.getDocument('profiles', uid);
          if (profile) {
            const averageDistance = data.distances.reduce((a: number, b: number) => a + b, 0) / data.distances.length;
            const similarityScore = Math.round((1 - averageDistance) * 100);

            similarProfiles.push({
              userId: uid,
              name: profile.name || 'Anonymous User',
              title: profile.title || 'Professional',
              location: profile.location || null,
              profilePicture: profile.profilePicture || null,
              similarityScore,
              matchingSkills: data.skills,
              email: profile.email,
            });
          }
        } catch (error) {
          this.logger.warn(`Failed to fetch profile ${uid}: ${error.message}`);
        }
      }

      // Sort by similarity score and limit results
      const sortedProfiles = similarProfiles
        .sort((a, b) => b.similarityScore - a.similarityScore)
        .slice(0, limit);

      this.logger.log(`✓ Found ${sortedProfiles.length} similar profiles`);
      return sortedProfiles;

    } catch (error) {
      this.logger.error(`Error finding similar profiles: ${error.message}`);
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
