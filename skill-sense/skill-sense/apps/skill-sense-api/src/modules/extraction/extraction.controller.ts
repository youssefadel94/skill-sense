import { Controller, Post, Body, Param, Get, UseInterceptors, UploadedFile, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody, ApiParam } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { ExtractionService } from './extraction.service';
import { ExtractFromCvDto, ExtractFromGitHubDto, ExtractFromLinkedInDto } from './dto/extraction.dto';

@ApiTags('extraction')
@Controller('extraction')
export class ExtractionController {
  private readonly logger = new Logger(ExtractionController.name);

  constructor(private readonly extractionService: ExtractionService) {}

  @Post('cv')
  @ApiOperation({ summary: 'Extract skills from CV/Resume (PDF, DOCX, TXT)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary', description: 'CV file (PDF, DOCX, or TXT)' },
        userId: { type: 'string', description: 'User ID' },
        fileUrl: { type: 'string', description: 'Alternative: URL to CV file' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Skills extracted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file or missing parameters' })
  @UseInterceptors(FileInterceptor('file'))
  async extractFromCV(
    @UploadedFile() file: any,
    @Body() dto: ExtractFromCvDto,
  ) {
    this.logger.log(`[CV UPLOAD] Received CV extraction request for user: ${dto.userId}`);
    
    if (file) {
      this.logger.debug(`[CV UPLOAD] File details - Name: ${file.originalname}, Size: ${file.size} bytes, Type: ${file.mimetype}`);
      const result = await this.extractionService.extractFromCVFile(dto.userId, file);
      this.logger.log(`[CV UPLOAD] Extraction completed - Skills found: ${result.skillsFound}`);
      return result;
    } else if (dto.fileUrl) {
      this.logger.debug(`[CV UPLOAD] Processing from URL: ${dto.fileUrl}`);
      const result = await this.extractionService.extractFromCV(dto.userId, dto.fileUrl);
      this.logger.log(`[CV UPLOAD] URL extraction completed`);
      return result;
    }
    
    this.logger.error(`[CV UPLOAD] No file or URL provided for user: ${dto.userId}`);
    throw new Error('Either file or fileUrl must be provided');
  }

  @Post('github')
  @ApiOperation({ summary: 'Extract skills from GitHub profile' })
  @ApiResponse({ status: 201, description: 'Skills extracted from GitHub successfully' })
  @ApiResponse({ status: 400, description: 'Invalid GitHub username' })
  async extractFromGitHub(@Body() dto: ExtractFromGitHubDto) {
    this.logger.log(`[GITHUB] Extracting skills for user: ${dto.userId}, GitHub username: ${dto.username}`);
    const result = await this.extractionService.extractFromGitHub(dto.userId, dto.username);
    this.logger.log(`[GITHUB] Extraction queued with job ID: ${result.jobId}`);
    return result;
  }

  @Post('linkedin')
  @ApiOperation({ summary: 'Extract skills from LinkedIn profile' })
  @ApiResponse({ status: 201, description: 'Skills extracted from LinkedIn successfully' })
  @ApiResponse({ status: 400, description: 'Invalid LinkedIn profile URL' })
  async extractFromLinkedIn(@Body() dto: ExtractFromLinkedInDto) {
    this.logger.log(`[LINKEDIN] Extracting skills for user: ${dto.userId}, LinkedIn URL: ${dto.profileUrl}`);
    const result = await this.extractionService.extractFromLinkedIn(dto.userId, dto.profileUrl);
    this.logger.log(`[LINKEDIN] Extraction queued with job ID: ${result.jobId}`);
    return result;
  }

  @Get('job/:jobId')
  @ApiOperation({ summary: 'Get extraction job status' })
  @ApiParam({ name: 'jobId', description: 'Extraction job ID' })
  @ApiResponse({ status: 200, description: 'Returns job status' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async getExtractionJob(@Param('jobId') jobId: string) {
    this.logger.debug(`[JOB STATUS] Checking status for job: ${jobId}`);
    const result = await this.extractionService.getJobStatus(jobId);
    this.logger.debug(`[JOB STATUS] Job ${jobId} status: ${JSON.stringify(result)}`);
    return result;
  }
}
