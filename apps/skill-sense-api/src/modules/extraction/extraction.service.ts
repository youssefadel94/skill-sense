import { Injectable, Logger } from '@nestjs/common';
import { JobQueueService, Job } from '../../shared/services/job-queue.service';
import { CvParserService } from '../connectors/cv/cv-parser.service';
import { GithubConnectorService } from '../connectors/github/github-connector.service';
import { LinkedInConnectorService } from '../connectors/linkedin/linkedin-connector.service';
import { ProfileService } from '../profile/profile.service';

@Injectable()
export class ExtractionService {
  private readonly logger = new Logger(ExtractionService.name);

  constructor(
    private readonly jobQueue: JobQueueService,
    private readonly cvParser: CvParserService,
    private readonly githubConnector: GithubConnectorService,
    private readonly linkedinConnector: LinkedInConnectorService,
    private readonly profileService: ProfileService,
  ) {}

  async extractFromCV(userId: string, fileUrl: string) {
    this.logger.log(`Starting CV extraction for user: ${userId}`);
    const jobId = await this.jobQueue.createJob('cv-extraction', {
      userId,
      fileUrl,
    });
    return { jobId, status: 'queued' };
  }

  async extractFromCVFile(userId: string, file: any) {
    this.logger.log(`Starting CV file extraction for user: ${userId}, file: ${file.originalname}`);
    
    // Process file directly
    const result = await this.cvParser.parseCVFromFile(file, userId);
    
    // Update profile with extracted skills and CV info
    await this.updateProfileWithExtraction(userId, result);
    
    return {
      status: 'completed',
      skillsFound: result.skills?.length || 0,
      result,
    };
  }

  /**
   * Update user profile with extraction results
   */
  private async updateProfileWithExtraction(userId: string, extractionResult: any) {
    try {
      const profile: any = await this.profileService.getProfile(userId);
      
      if (!profile) {
        this.logger.error(`Profile not found for user ${userId}`);
        throw new Error('Profile not found');
      }

      // Merge skills with existing ones
      const existingSkills = profile.skills || [];
      const newSkills = extractionResult.skills || [];
      
      // Create a map of existing skills by name (case-insensitive)
      const skillMap = new Map();
      existingSkills.forEach((skill: any) => {
        const skillName = (skill.name || skill).toLowerCase();
        skillMap.set(skillName, skill);
      });
      
      // Add new skills or update existing ones
      newSkills.forEach((skill: any) => {
        const skillName = (skill.name || skill).toLowerCase();
        if (!skillMap.has(skillName)) {
          skillMap.set(skillName, {
            name: skill.name || skill,
            category: skill.category || 'Uncategorized',
            confidence: skill.confidence || 0.8,
            verified: false,
            sources: [extractionResult.source || 'cv'],
            evidenceCount: skill.evidenceCount || 1,
            occurrences: 1,
            createdAt: new Date().toISOString(),
          });
        } else {
          // Update existing skill
          const existing = skillMap.get(skillName);
          existing.confidence = Math.max(existing.confidence || 0, skill.confidence || 0.8);
          existing.occurrences = (existing.occurrences || 1) + 1;
          existing.evidenceCount = (existing.evidenceCount || 0) + (skill.evidenceCount || 1);
          if (!existing.sources.includes(extractionResult.source || 'cv')) {
            existing.sources.push(extractionResult.source || 'cv');
          }
        }
      });
      
      // Convert map back to array
      const mergedSkills = Array.from(skillMap.values());
      
      // Store CV information
      const cvs = profile.cvs || [];
      cvs.push({
        fileName: extractionResult.fileName,
        fileType: extractionResult.fileType,
        gcsUri: extractionResult.gcsUri,
        uploadedAt: new Date().toISOString(),
        skillsExtracted: newSkills.length,
      });
      
      // Update profile
      await this.profileService.updateProfile(userId, {
        skills: mergedSkills,
        cvs,
        skillCount: mergedSkills.length,
        sourcesConnected: this.countUniqueSources(mergedSkills),
        updatedAt: new Date().toISOString(),
      });
      
      this.logger.log(`Updated profile for user ${userId} with ${newSkills.length} new skills`);
    } catch (error: any) {
      this.logger.error(`Failed to update profile: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Count unique data sources from skills
   */
  private countUniqueSources(skills: any[]): number {
    const sources = new Set();
    skills.forEach((skill: any) => {
      if (skill.sources && Array.isArray(skill.sources)) {
        skill.sources.forEach(source => sources.add(source));
      }
    });
    return sources.size;
  }

  async extractFromGitHub(userId: string, username: string) {
    this.logger.log(`Starting GitHub extraction for user: ${userId}`);
    const jobId = await this.jobQueue.createJob('github-extraction', {
      userId,
      username,
    });
    return { jobId, status: 'queued' };
  }

  async extractFromLinkedIn(userId: string, profileUrl: string) {
    this.logger.log(`Starting LinkedIn extraction for user: ${userId}`);
    
    // Validate LinkedIn URL
    if (!this.linkedinConnector.validateLinkedInUrl(profileUrl)) {
      throw new Error('Invalid LinkedIn profile URL');
    }

    const jobId = await this.jobQueue.createJob('linkedin-extraction', {
      userId,
      profileUrl,
    });
    return { jobId, status: 'queued' };
  }

  async getJobStatus(jobId: string): Promise<Job | { error: string }> {
    const job = await this.jobQueue.getJob(jobId);
    if (!job) {
      return { error: 'Job not found' };
    }
    return job;
  }
}
