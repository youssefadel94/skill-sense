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
    this.logger.log(`[EXTRACTION] Starting CV file extraction for user: ${userId}, file: ${file.originalname}`);
    this.logger.debug(`[EXTRACTION] File details - Size: ${file.size} bytes, Type: ${file.mimetype}`);
    
    try {
      // Process file directly
      const result = await this.cvParser.parseCVFromFile(file, userId);
      this.logger.debug(`[EXTRACTION] CV parsing completed. Skills data: ${JSON.stringify(result.skills?.metadata || {})}`);
      
      // Update profile with extracted skills and CV info
      await this.updateProfileWithExtraction(userId, result);
      
      const skillsFound = result.skills?.skills?.length || result.skills?.length || 0;
      this.logger.log(`[EXTRACTION] ✓ CV extraction completed for user ${userId} - ${skillsFound} skills found`);
      
      return {
        status: 'completed',
        skillsFound,
        result,
      };
    } catch (error: any) {
      this.logger.error(`[EXTRACTION] ✗ Failed to extract from CV file: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Update user profile with extraction results
   */
  private async updateProfileWithExtraction(userId: string, extractionResult: any) {
    try {
      this.logger.debug(`[PROFILE UPDATE] Starting profile update for user: ${userId}`);
      
      const profile: any = await this.profileService.getProfile(userId);
      
      if (!profile) {
        this.logger.error(`[PROFILE UPDATE] Profile not found for user ${userId}`);
        throw new Error('Profile not found');
      }

      this.logger.debug(`[PROFILE UPDATE] Current profile has ${profile.skills?.length || 0} existing skills`);

      // Merge skills with existing ones
      const existingSkills = profile.skills || [];
      const newSkills = Array.isArray(extractionResult.skills?.skills) 
        ? extractionResult.skills.skills 
        : Array.isArray(extractionResult.skills) 
          ? extractionResult.skills 
          : (extractionResult.skills ? [extractionResult.skills] : []);
      
      this.logger.debug(`[PROFILE UPDATE] Processing ${newSkills.length} new skills for merging`);
      
      // Create a map of existing skills by name (case-insensitive)
      const skillMap = new Map();
      existingSkills.forEach((skill: any) => {
        const skillName = typeof skill === 'string' 
          ? skill.toLowerCase() 
          : (skill.name || '').toString().toLowerCase();
        if (skillName) {
          skillMap.set(skillName, skill);
        }
      });
      
      this.logger.debug(`[PROFILE UPDATE] Existing skills map created with ${skillMap.size} entries`);
      
      // Add new skills or update existing ones
      let newCount = 0;
      let updatedCount = 0;
      
      newSkills.forEach((skill: any) => {
        const skillName = typeof skill === 'string' 
          ? skill.toLowerCase() 
          : (skill.name || '').toString().toLowerCase();
        
        if (!skillName) {
          this.logger.warn(`[PROFILE UPDATE] Skipping invalid skill: ${JSON.stringify(skill)}`);
          return;
        }
        
        // Calculate evidence count from evidence array
        const evidenceArray = Array.isArray(skill.evidence) ? skill.evidence : (skill.evidence ? [skill.evidence] : []);
        const evidenceCount = evidenceArray.length;
        
        if (!skillMap.has(skillName)) {
          skillMap.set(skillName, {
            name: typeof skill === 'string' ? skill : skill.name,
            category: skill.category || 'Uncategorized',
            confidence: skill.confidence || 0.8,
            verified: false,
            sources: [extractionResult.source || 'cv'],
            evidence: evidenceArray,  // Store evidence array
            evidenceCount: evidenceCount,
            occurrences: 1,
            createdAt: new Date().toISOString(),
          });
          newCount++;
        } else {
          // Update existing skill
          const existing = skillMap.get(skillName);
          existing.confidence = Math.max(existing.confidence || 0, skill.confidence || 0.8);
          existing.occurrences = (existing.occurrences || 1) + 1;
          
          // Merge evidence arrays
          if (!existing.evidence) {
            existing.evidence = [];
          }
          existing.evidence = [...existing.evidence, ...evidenceArray];
          existing.evidenceCount = existing.evidence.length;
          
          if (!existing.sources.includes(extractionResult.source || 'cv')) {
            existing.sources.push(extractionResult.source || 'cv');
          }
          updatedCount++;
        }
      });
      
      this.logger.log(`[PROFILE UPDATE] Skill merging completed - New: ${newCount}, Updated: ${updatedCount}`);
      
      // Convert map back to array
      const mergedSkills = Array.from(skillMap.values());
      
      this.logger.debug(`[PROFILE UPDATE] Total merged skills: ${mergedSkills.length}`);
      
      // Store CV information
      const cvs = profile.cvs || [];
      cvs.push({
        fileName: extractionResult.fileName,
        fileType: extractionResult.fileType,
        gcsUri: extractionResult.gcsUri,
        uploadedAt: new Date().toISOString(),
        skillsExtracted: newSkills.length,
      });
      
      this.logger.debug(`[PROFILE UPDATE] CV info added. Total CVs: ${cvs.length}`);
      
      // Update profile
      await this.profileService.updateProfile(userId, {
        skills: mergedSkills,
        cvs,
        skillCount: mergedSkills.length,
        sourcesConnected: this.countUniqueSources(mergedSkills),
        updatedAt: new Date().toISOString(),
      });
      
      this.logger.log(`[PROFILE UPDATE] ✓ Profile updated successfully for user ${userId} - Total skills: ${mergedSkills.length}`);
    } catch (error: any) {
      this.logger.error(`[PROFILE UPDATE] ✗ Failed to update profile: ${error.message}`, error.stack);
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
