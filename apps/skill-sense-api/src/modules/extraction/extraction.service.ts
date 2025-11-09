import { Injectable, Logger } from '@nestjs/common';
import { JobQueueService, Job } from '../../shared/services/job-queue.service';
import { CvParserService } from '../connectors/cv/cv-parser.service';
import { GithubConnectorService } from '../connectors/github/github-connector.service';
import { LinkedInConnectorService } from '../connectors/linkedin/linkedin-connector.service';

@Injectable()
export class ExtractionService {
  private readonly logger = new Logger(ExtractionService.name);

  constructor(
    private readonly jobQueue: JobQueueService,
    private readonly cvParser: CvParserService,
    private readonly githubConnector: GithubConnectorService,
    private readonly linkedinConnector: LinkedInConnectorService,
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
    
    return {
      status: 'completed',
      result,
    };
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
