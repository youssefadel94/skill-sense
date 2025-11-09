import { Injectable, Logger } from '@nestjs/common';
import { FirestoreService } from '../../shared/services/firestore.service';
import { VertexAIService } from '../../shared/services/vertex-ai.service';
import { GenerateCVDto, MatchRolesDto, GenerateLearningPathDto } from './dto/advanced.dto';

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

    const snapshot = await this.firestore.getCollection('cvs')
      .where('userId', '==', userId)
      .orderBy('generatedAt', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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

    const snapshot = await this.firestore.getCollection('learning-paths')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async generateLearningPath(userId: string, dto: GenerateLearningPathDto) {
    this.logger.log(`Generating learning path for user ${userId}`);

    const profile: any = await this.getProfile(userId);
    if (!profile) {
      throw new Error('Profile not found');
    }

    const pathId = `path-${userId}-${Date.now()}`;

    // Mock path generation - in production, use AI
    const path = {
      id: pathId,
      userId,
      title: `Path to ${dto.targetGoal}`,
      targetGoal: dto.targetGoal,
      learningStyle: dto.learningStyle,
      timeCommitment: dto.timeCommitment,
      progress: 0,
      createdAt: new Date().toISOString(),
      steps: [
        {
          id: 'step-1',
          title: 'Foundation Concepts',
          description: `Learn the basics of ${dto.targetGoal}`,
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
