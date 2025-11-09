import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';

export interface Job {
  id: string;
  type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  data: any;
  result?: any;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class JobQueueService {
  private readonly logger = new Logger(JobQueueService.name);
  private jobs: Map<string, Job> = new Map();
  private jobProcessor: any; // Will be injected later to avoid circular dependency

  setJobProcessor(processor: any) {
    this.jobProcessor = processor;
    this.logger.log('Job processor registered');
  }

  async createJob(type: string, data: any): Promise<string> {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const job: Job = {
      id: jobId,
      type,
      status: 'pending',
      data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.jobs.set(jobId, job);
    this.logger.log(`Job created: ${jobId} (${type})`);
    
    // Simulate async processing
    this.processJob(jobId);
    
    return jobId;
  }

  async getJob(jobId: string): Promise<Job | null> {
    return this.jobs.get(jobId) || null;
  }

  private async processJob(jobId: string) {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.status = 'processing';
    job.updatedAt = new Date();
    this.logger.log(`Processing job: ${jobId} (${job.type})`);

    try {
      // Call the registered job processor if available
      if (this.jobProcessor && typeof this.jobProcessor.processJob === 'function') {
        this.logger.debug(`Calling job processor for: ${job.type}`);
        const result = await this.jobProcessor.processJob(job);
        job.status = 'completed';
        job.result = result;
        job.updatedAt = new Date();
        this.logger.log(`Job completed successfully: ${jobId}`);
      } else {
        // Fallback: just mark as completed (for backward compatibility)
        setTimeout(() => {
          job.status = 'completed';
          job.updatedAt = new Date();
          job.result = { processed: true, message: 'Job queued for background processing' };
          this.logger.log(`Job marked as queued: ${jobId}`);
        }, 1000);
      }
    } catch (error: any) {
      job.status = 'failed';
      job.error = error.message || 'Unknown error';
      job.updatedAt = new Date();
      this.logger.error(`Job failed: ${jobId} - ${error.message}`, error.stack);
    }
  }

  async deleteJob(jobId: string): Promise<void> {
    this.jobs.delete(jobId);
    this.logger.log(`Job deleted: ${jobId}`);
  }
}
