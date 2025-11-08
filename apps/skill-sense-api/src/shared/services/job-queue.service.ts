import { Injectable, Logger } from '@nestjs/common';

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

    // Simulate processing delay
    setTimeout(() => {
      job.status = 'completed';
      job.updatedAt = new Date();
      job.result = { processed: true };
      this.logger.log(`Job completed: ${jobId}`);
    }, 2000);
  }

  async deleteJob(jobId: string): Promise<void> {
    this.jobs.delete(jobId);
    this.logger.log(`Job deleted: ${jobId}`);
  }
}
