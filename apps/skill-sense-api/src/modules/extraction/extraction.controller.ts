import { Controller, Post, Body, Param, Get, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody, ApiParam } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { ExtractionService } from './extraction.service';
import { ExtractFromCvDto, ExtractFromGitHubDto, ExtractFromLinkedInDto } from './dto/extraction.dto';

@ApiTags('extraction')
@Controller('extraction')
export class ExtractionController {
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
    if (file) {
      // File upload - process directly
      return this.extractionService.extractFromCVFile(dto.userId, file);
    } else if (dto.fileUrl) {
      // URL provided - process from URL
      return this.extractionService.extractFromCV(dto.userId, dto.fileUrl);
    }
    throw new Error('Either file or fileUrl must be provided');
  }

  @Post('github')
  @ApiOperation({ summary: 'Extract skills from GitHub profile' })
  @ApiResponse({ status: 201, description: 'Skills extracted from GitHub successfully' })
  @ApiResponse({ status: 400, description: 'Invalid GitHub username' })
  async extractFromGitHub(@Body() dto: ExtractFromGitHubDto) {
    return this.extractionService.extractFromGitHub(dto.userId, dto.username);
  }

  @Post('linkedin')
  @ApiOperation({ summary: 'Extract skills from LinkedIn profile' })
  @ApiResponse({ status: 201, description: 'Skills extracted from LinkedIn successfully' })
  @ApiResponse({ status: 400, description: 'Invalid LinkedIn profile URL' })
  async extractFromLinkedIn(@Body() dto: ExtractFromLinkedInDto) {
    return this.extractionService.extractFromLinkedIn(dto.userId, dto.profileUrl);
  }

  @Get('job/:jobId')
  @ApiOperation({ summary: 'Get extraction job status' })
  @ApiParam({ name: 'jobId', description: 'Extraction job ID' })
  @ApiResponse({ status: 200, description: 'Returns job status' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async getExtractionJob(@Param('jobId') jobId: string) {
    return this.extractionService.getJobStatus(jobId);
  }
}
