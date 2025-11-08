import { Controller, Post, Body, Param, Get } from '@nestjs/common';
import { ExtractionService } from './extraction.service';

@Controller('extraction')
export class ExtractionController {
  constructor(private readonly extractionService: ExtractionService) {}

  @Post('cv')
  async extractFromCV(@Body() data: { userId: string; fileUrl: string }) {
    return this.extractionService.extractFromCV(data.userId, data.fileUrl);
  }

  @Post('github')
  async extractFromGitHub(@Body() data: { userId: string; username: string }) {
    return this.extractionService.extractFromGitHub(data.userId, data.username);
  }

  @Post('linkedin')
  async extractFromLinkedIn(@Body() data: { userId: string; profileUrl: string }) {
    return this.extractionService.extractFromLinkedIn(data.userId, data.profileUrl);
  }

  @Get('job/:jobId')
  async getExtractionJob(@Param('jobId') jobId: string) {
    return this.extractionService.getJobStatus(jobId);
  }
}
