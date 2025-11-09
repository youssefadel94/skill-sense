import { Injectable, Logger } from '@nestjs/common';
import { FirestoreService } from '../../shared/services/firestore.service';
import { VertexAIService } from '../../shared/services/vertex-ai.service';
import { WeaviateService } from '../../shared/services/weaviate.service';
import { GcsService } from '../../shared/services/gcs.service';
import { GenerateCVDto, MatchRolesDto, GenerateLearningPathDto } from './dto/advanced.dto';

@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);
  private readonly collection = 'profiles';

  constructor(
    private readonly firestore: FirestoreService,
    private readonly vertexAI: VertexAIService,
    private readonly weaviate: WeaviateService,
    private readonly gcs: GcsService,
  ) {
    // Initialize Weaviate schema on startup
    this.initializeVectorStore();
  }

  private async initializeVectorStore() {
    try {
      const isReady = await this.weaviate.isReady();
      if (isReady) {
        await this.weaviate.createSchema();
        this.logger.log('✓ Vector store initialized successfully');
      } else {
        this.logger.warn('⚠️ Weaviate vector store not available. Skill search will be limited.');
      }
    } catch (error) {
      this.logger.error(`Vector store initialization failed: ${error.message}`);
    }
  }

  async createProfile(data: any) {
    this.logger.log('Creating profile');
    
    // Use userId as the document ID to ensure one profile per user
    const userId = data.userId;
    if (!userId) {
      throw new Error('userId is required to create a profile');
    }
    
    // Check if profile already exists to prevent duplicates
    const existingProfile = await this.getProfile(userId);
    if (existingProfile) {
      this.logger.warn(`Profile already exists for user ${userId}, returning existing profile`);
      return existingProfile;
    }
    
    return this.firestore.createDocument(
      this.collection,
      {
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      userId // Use userId as document ID
    );
  }

  async getProfile(id: string) {
    this.logger.log(`Fetching profile: ${id}`);
    return this.firestore.getDocument(this.collection, id);
  }

  async updateProfile(id: string, data: any) {
    this.logger.log(`Updating profile: ${id}`);
    return this.firestore.updateDocument(this.collection, id, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * Sync skills to Weaviate vector database for semantic search
   */
  async syncSkillsToVectorStore(userId: string, skills: any[]) {
    try {
      const isReady = await this.weaviate.isReady();
      if (!isReady) {
        this.logger.warn('[VECTOR SYNC] Weaviate not available, skipping sync');
        return;
      }

      this.logger.log(`[VECTOR SYNC] Syncing ${skills.length} skills to vector store for user ${userId}`);

      // Add each skill to Weaviate
      let syncedCount = 0;
      for (const skill of skills) {
        try {
          await this.weaviate.addSkill({
            name: skill.name,
            category: skill.category || 'uncategorized',
            proficiency: skill.proficiency || 'intermediate',
            evidence: skill.evidence || '',
            source: skill.sources?.[0] || 'unknown',
            userId: userId,
            confidence: skill.confidence || 0.5,
          });
          syncedCount++;
        } catch (error) {
          this.logger.warn(`[VECTOR SYNC] Failed to sync skill "${skill.name}": ${error.message}`);
        }
      }

      this.logger.log(`[VECTOR SYNC] ✓ Successfully synced ${syncedCount}/${skills.length} skills to vector store`);
    } catch (error) {
      this.logger.error(`[VECTOR SYNC] ✗ Vector sync failed: ${error.message}`);
      // Don't throw error - vector sync is not critical
    }
  }

  /**
   * Search skills using semantic/vector search
   */
  async searchSkillsSemantic(query: string, userId?: string, limit: number = 10) {
    try {
      const isReady = await this.weaviate.isReady();
      if (!isReady) {
        this.logger.warn('[VECTOR SEARCH] Weaviate not available, returning empty results');
        return [];
      }

      this.logger.log(`[VECTOR SEARCH] Searching for: "${query}" (user: ${userId || 'all'})`);
      const results = await this.weaviate.searchSkills(query, userId, limit);
      this.logger.log(`[VECTOR SEARCH] ✓ Found ${results.length} results`);
      return results;
    } catch (error) {
      this.logger.error(`[VECTOR SEARCH] ✗ Search failed: ${error.message}`);
      return [];
    }
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

    try {
      // Get user's profile
      const profile: any = await this.getProfile(userId);
      if (!profile) {
        this.logger.error(`Profile not found for user: ${userId}`);
        throw new Error('Profile not found');
      }

      this.logger.debug(`Profile found: ${profile.name || 'Unknown'}`);

      // Extract skill names from profile
      const currentSkills = profile.skills?.map(s => s.name || s) || [];
      this.logger.debug(`Current skills count: ${currentSkills.length}`);

      if (currentSkills.length === 0) {
        this.logger.warn('No skills found in profile, returning empty analysis');
        return {
          userId,
          targetRole,
          currentSkills: [],
          gaps: [],
          summary: 'No skills found in your profile. Please upload a CV first.'
        };
      }

      // Analyze using Vertex AI
      this.logger.debug('Calling Vertex AI for analysis...');
      const analysis = await this.vertexAI.analyzeSkillGaps(currentSkills, targetRole);
      this.logger.log(`✓ Analysis complete: ${analysis.gaps?.length || 0} gaps found`);

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
    } catch (error) {
      this.logger.error(`Skill gap analysis failed: ${error.message}`);
      this.logger.error(`Error stack: ${error.stack}`);
      throw error;
    }
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

    // Save recommendations (filter out undefined values for Firestore)
    const recommendationData: any = {
      userId,
      ...recommendations,
      createdAt: new Date().toISOString(),
    };
    if (targetRole !== undefined) {
      recommendationData.targetRole = targetRole;
    }
    await this.firestore.createDocument('skill-recommendations', recommendationData);

    const returnData: any = {
      userId,
      currentSkills,
      ...recommendations,
    };
    if (targetRole !== undefined) {
      returnData.targetRole = targetRole;
    }
    return returnData;
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

  // ==================== CV GENERATION ====================

  async generateCV(userId: string, dto: GenerateCVDto) {
    this.logger.log(`Generating CV for user ${userId} with template ${dto.template}`);

    const profile: any = await this.getProfile(userId);
    if (!profile) {
      throw new Error('Profile not found');
    }

    const cvId = `cv-${userId}-${Date.now()}`;
    const cv = {
      id: cvId,
      userId,
      template: dto.template,
      format: dto.format,
      sections: dto.includeSections,
      customization: dto.customization || {},
      generatedAt: new Date().toISOString(),
      profile: {
        name: profile.name || 'User',
        email: profile.email || '',
        skills: profile.skills || [],
      },
    };

    await this.firestore.createDocument('cvs', cv);

    return cv;
  }

  async getRecentCVs(userId: string, limit: number = 10) {
    this.logger.log(`Fetching recent CVs for user ${userId}`);

    try {
      const snapshot = await this.firestore.getCollection('cvs')
        .where('userId', '==', userId)
        .orderBy('generatedAt', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      this.logger.error(`Error fetching CVs (missing index?): ${error.message}`);
      
      // Fallback: fetch all CVs for user and sort in memory
      try {
        const allDocs = await this.firestore.getCollection('cvs')
          .where('userId', '==', userId)
          .get();
        
        const cvs = allDocs.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .sort((a: any, b: any) => {
            const dateA = new Date(a.generatedAt || 0).getTime();
            const dateB = new Date(b.generatedAt || 0).getTime();
            return dateB - dateA;
          })
          .slice(0, limit);
        
        this.logger.log(`Returned ${cvs.length} CVs using fallback method`);
        return cvs;
      } catch (fallbackError) {
        this.logger.error(`Fallback query also failed: ${fallbackError.message}`);
        return [];
      }
    }
  }

  async getCVById(cvId: string) {
    return this.firestore.getDocument('cvs', cvId);
  }

  // ==================== ROLE MATCHING ====================

  async matchRoles(userId: string, dto: MatchRolesDto) {
    this.logger.log(`Matching roles for user ${userId}`);

    const profile: any = await this.getProfile(userId);
    if (!profile) {
      throw new Error('Profile not found');
    }

    // Mock job matches - in production, this would call a job API or database
    const mockJobs = [
      {
        id: 'job-1',
        title: 'Senior Full Stack Developer',
        company: 'Tech Corp',
        location: 'Remote',
        salary: '$120k - $180k',
        matchScore: 92,
        requiredSkills: ['React', 'Node.js', 'TypeScript', 'AWS'],
        matchedSkills: profile.skills?.slice(0, 8).map(s => s.name || s) || [],
        missingSkills: ['Kubernetes', 'GraphQL'],
        postedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'job-2',
        title: 'Frontend Engineer',
        company: 'StartupXYZ',
        location: 'San Francisco, CA',
        salary: '$100k - $150k',
        matchScore: 88,
        requiredSkills: ['Angular', 'TypeScript', 'RxJS', 'CSS'],
        matchedSkills: profile.skills?.slice(0, 6).map(s => s.name || s) || [],
        missingSkills: ['NgRx', 'Cypress'],
        postedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'job-3',
        title: 'Cloud Solutions Architect',
        company: 'Enterprise Inc',
        location: 'New York, NY',
        salary: '$140k - $200k',
        matchScore: 75,
        requiredSkills: ['AWS', 'Azure', 'Terraform', 'Docker'],
        matchedSkills: profile.skills?.slice(0, 4).map(s => s.name || s) || [],
        missingSkills: ['Azure', 'Terraform', 'Kubernetes'],
        postedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    // Filter based on query
    let results = mockJobs;
    if (dto.query) {
      const queryLower = dto.query.toLowerCase();
      results = results.filter(job =>
        job.title.toLowerCase().includes(queryLower) ||
        job.company.toLowerCase().includes(queryLower)
      );
    }

    // Filter by location
    if (dto.location) {
      const locationLower = dto.location.toLowerCase();
      results = results.filter(job =>
        job.location.toLowerCase().includes(locationLower)
      );
    }

    // Filter by minimum score
    if (dto.minScore) {
      results = results.filter(job => job.matchScore >= dto.minScore);
    }

    // Sort results
    if (dto.sortBy === 'salary') {
      results.sort((a, b) => {
        const aMax = parseInt(a.salary.match(/\d+/g)?.[1] || '0');
        const bMax = parseInt(b.salary.match(/\d+/g)?.[1] || '0');
        return bMax - aMax;
      });
    } else if (dto.sortBy === 'date') {
      results.sort((a, b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime());
    } else {
      // Default: sort by score
      results.sort((a, b) => b.matchScore - a.matchScore);
    }

    return results;
  }

  async getJobMatchAnalysis(userId: string, jobId: string) {
    this.logger.log(`Getting job match analysis for user ${userId} and job ${jobId}`);

    const profile: any = await this.getProfile(userId);
    if (!profile) {
      throw new Error('Profile not found');
    }

    // Mock detailed analysis
    return {
      jobId,
      overallScore: 85,
      breakdown: {
        technicalSkills: {
          score: 90,
          details: 'Strong match with 8/10 required technical skills',
        },
        experience: {
          score: 85,
          details: 'Experience level aligns well with role requirements',
        },
        education: {
          score: 80,
          details: 'Educational background meets minimum requirements',
        },
      },
      strengths: [
        'Expert in React and TypeScript',
        'Strong backend experience with Node.js',
        'Cloud deployment experience',
      ],
      gaps: [
        'Limited Kubernetes experience',
        'No GraphQL background',
      ],
      recommendations: [
        'Complete a Kubernetes certification course',
        'Build a project using GraphQL',
      ],
    };
  }

  // ==================== LEARNING PATHS ====================

  async getLearningPaths(userId: string) {
    this.logger.log(`Fetching learning paths for user ${userId}`);

    try {
      const snapshot = await this.firestore.getCollection('learning-paths')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();

      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error: any) {
      const needsIndex = error?.code === 9 && typeof error?.details === 'string'
        && error.details.includes('requires an index');

      if (!needsIndex) {
        throw error;
      }

      this.logger.warn('Firestore index missing for learning paths. Falling back to in-memory sort.');

      const snapshot = await this.firestore.getCollection('learning-paths')
        .where('userId', '==', userId)
        .get();

      return snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a: any, b: any) => {
          const getTime = (value: any) => {
            if (!value) {
              return 0;
            }

            // Firestore timestamps expose toDate(); ISO strings can be parsed directly.
            if (typeof value?.toDate === 'function') {
              return value.toDate().getTime();
            }

            return new Date(value).getTime() || 0;
          };

          return getTime(b.createdAt) - getTime(a.createdAt);
        });
    }
  }

  async generateLearningPath(userId: string, dto: GenerateLearningPathDto) {
    this.logger.log(`Generating learning path for user ${userId}`);

    const profile: any = await this.getProfile(userId);
    if (!profile) {
      throw new Error('Profile not found');
    }

    const pathId = `path-${userId}-${Date.now()}`;
    const targetGoal = dto.targetGoal || 'Professional Development';
    const learningStyle = dto.learningStyle || 'balanced';
    const timeCommitment = dto.timeCommitment || 5;

    // Mock path generation - in production, use AI
    const path: any = {
      id: pathId,
      userId,
      title: `Path to ${targetGoal}`,
      targetGoal,
      learningStyle,
      timeCommitment,
      progress: 0,
      createdAt: new Date().toISOString(),
      steps: [
        {
          id: 'step-1',
          title: 'Foundation Concepts',
          description: `Learn the basics of ${targetGoal}`,
          duration: '8 hours',
          completed: false,
          resources: [
            { title: 'Official Documentation', url: '#', type: 'docs' },
            { title: 'Introduction Course', url: '#', type: 'video' },
          ],
        },
        {
          id: 'step-2',
          title: 'Hands-on Practice',
          description: 'Build your first project',
          duration: '12 hours',
          completed: false,
          resources: [
            { title: 'Tutorial Project', url: '#', type: 'tutorial' },
            { title: 'Practice Exercises', url: '#', type: 'exercise' },
          ],
        },
        {
          id: 'step-3',
          title: 'Advanced Techniques',
          description: 'Master advanced concepts',
          duration: '16 hours',
          completed: false,
          resources: [
            { title: 'Advanced Guide', url: '#', type: 'article' },
            { title: 'Expert Workshop', url: '#', type: 'video' },
          ],
        },
      ],
    };

    await this.firestore.createDocument('learning-paths', path);

    return path;
  }

  async updateLearningPathProgress(userId: string, pathId: string, stepId: string, completed: boolean) {
    this.logger.log(`Updating step ${stepId} in path ${pathId} for user ${userId}`);

    const path: any = await this.firestore.getDocument('learning-paths', pathId);
    if (!path || path.userId !== userId) {
      throw new Error('Learning path not found or access denied');
    }

    // Update step completion
    const steps = path.steps.map(step =>
      step.id === stepId ? { ...step, completed } : step
    );

    // Recalculate overall progress
    const completedSteps = steps.filter(s => s.completed).length;
    const progress = Math.round((completedSteps / steps.length) * 100);

    await this.firestore.updateDocument('learning-paths', pathId, {
      steps,
      progress,
      updatedAt: new Date().toISOString(),
    });

    return { success: true, progress };
  }

  async deleteCV(userId: string, cvIdentifier: string) {
    this.logger.log(`Deleting CV for user ${userId}: ${cvIdentifier}`);

    const profile: any = await this.getProfile(userId);
    if (!profile) {
      throw new Error('Profile not found');
    }

    if (!profile.cvs || profile.cvs.length === 0) {
      throw new Error('No CVs found in profile');
    }

    // Find CV by gcsUri (decode URI component in case it's encoded)
    const decodedIdentifier = decodeURIComponent(cvIdentifier);
    const cvIndex = profile.cvs.findIndex((cv: any) => 
      cv.gcsUri === decodedIdentifier || cv.gcsUri === cvIdentifier
    );

    if (cvIndex === -1) {
      this.logger.error(`CV not found: ${cvIdentifier}`);
      throw new Error('CV not found');
    }

    // Remove CV from array
    const deletedCv = profile.cvs[cvIndex];
    profile.cvs.splice(cvIndex, 1);

    // Update profile
    await this.updateProfile(userId, {
      cvs: profile.cvs,
    });

    this.logger.log(`✓ CV deleted successfully: ${deletedCv.fileName}`);

    return { 
      success: true, 
      deletedCv: deletedCv.fileName,
      remainingCvs: profile.cvs.length 
    };
  }

  async getCVDownloadUrl(userId: string, cvIdentifier: string) {
    this.logger.log(`Getting download URL for CV - User: ${userId}, CV: ${cvIdentifier}`);

    const profile: any = await this.getProfile(userId);
    if (!profile) {
      throw new Error('Profile not found');
    }

    if (!profile.cvs || profile.cvs.length === 0) {
      throw new Error('No CVs found in profile');
    }

    // Find CV by gcsUri (decode URI component in case it's encoded)
    const decodedIdentifier = decodeURIComponent(cvIdentifier);
    const cv = profile.cvs.find((c: any) => 
      c.gcsUri === decodedIdentifier || c.gcsUri === cvIdentifier
    );

    if (!cv) {
      this.logger.error(`CV not found: ${cvIdentifier}`);
      throw new Error('CV not found');
    }

    // Extract filename from GCS URI (gs://bucket/path/to/file.pdf)
    const gcsUri = cv.gcsUri;
    const filename = gcsUri.replace(/^gs:\/\/[^\/]+\//, '');

    this.logger.debug(`Generating signed URL for file: ${filename}`);

    // Generate signed URL (valid for 1 hour)
    const signedUrl = await this.gcs.getSignedUrl(filename, 3600);

    this.logger.log(`✓ Signed URL generated for: ${cv.fileName}`);

    return {
      success: true,
      fileName: cv.fileName,
      downloadUrl: signedUrl,
      expiresIn: 3600,
    };
  }

  async deleteLearningPath(userId: string, pathId: string) {
    this.logger.log(`Deleting learning path ${pathId} for user ${userId}`);

    const path: any = await this.firestore.getDocument('learning-paths', pathId);
    if (!path || path.userId !== userId) {
      throw new Error('Learning path not found or access denied');
    }

    await this.firestore.deleteDocument('learning-paths', pathId);

    return { success: true };
  }
}
