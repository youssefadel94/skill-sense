import { Controller, Post, Body, Param, Get } from '@nestjs/common';
import { ExtractionService } from './extraction.service';
import { ExtractFromCvDto, ExtractFromGitHubDto, ExtractFromLinkedInDto } from './dto/extraction.dto';

@Controller('extraction')
export class ExtractionController {
  constructor(private readonly extractionService: ExtractionService) {}

  @Post('cv')
  async extractFromCV(@Body() dto: ExtractFromCvDto) {
    return this.extractionService.extractFromCV(dto.userId, dto.fileUrl);
  }

  @Post('github')
  async extractFromGitHub(@Body() dto: ExtractFromGitHubDto) {
    return this.extractionService.extractFromGitHub(dto.userId, dto.username);
  }

  @Post('linkedin')
  async extractFromLinkedIn(@Body() dto: ExtractFromLinkedInDto) {
    return this.extractionService.extractFromLinkedIn(dto.userId, dto.profileUrl);
  }

  @Get('job/:jobId')
  async getExtractionJob(@Param('jobId') jobId: string) {
    return this.extractionService.getJobStatus(jobId);
  }
}
