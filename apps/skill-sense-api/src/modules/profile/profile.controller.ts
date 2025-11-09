import { Controller, Get, Post, Put, Body, Param, Delete, Query, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { ProfileService } from './profile.service';
import { CreateProfileDto } from './dto/profile.dto';
import { GenerateCVDto, MatchRolesDto, GenerateLearningPathDto, UpdateLearningPathProgressDto } from './dto/advanced.dto';

@ApiTags('profiles')
@Controller('profiles')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user profile' })
  @ApiResponse({ status: 201, description: 'Profile created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async createProfile(@Body() createProfileDto: CreateProfileDto) {
    return this.profileService.createProfile(createProfileDto);
  }

  @Get('trends')
  @ApiOperation({ summary: 'Get skill trends across all users' })
  @ApiResponse({ status: 200, description: 'Returns trending skills and categories' })
  async getSkillTrends() {
    return this.profileService.getSkillTrends();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user profile by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Profile found' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  async getProfile(@Param('id') id: string) {
    return this.profileService.getProfile(id);
  }

  @Get()
  @ApiOperation({ summary: 'List all user profiles' })
  @ApiResponse({ status: 200, description: 'Returns all profiles' })
  async listProfiles() {
    return this.profileService.listProfiles();
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a user profile' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Profile deleted successfully' })
  async deleteProfile(@Param('id') id: string) {
    return this.profileService.deleteProfile(id);
  }

  @Get(':id/skill-gaps')
  @ApiOperation({ summary: 'Analyze skill gaps for target role' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiQuery({ name: 'targetRole', required: false, description: 'Target job role (default: Software Engineer)' })
  @ApiResponse({ status: 200, description: 'Returns skill gap analysis' })
  async analyzeSkillGaps(
    @Param('id') userId: string,
    @Query('targetRole') targetRole: string = 'Software Engineer',
  ) {
    return this.profileService.analyzeSkillGaps(userId, targetRole);
  }

  @Get(':id/recommendations')
  @ApiOperation({ summary: 'Get AI-powered skill recommendations' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiQuery({ name: 'targetRole', required: false, description: 'Target job role (optional)' })
  @ApiResponse({ status: 200, description: 'Returns skill recommendations' })
  async getSkillRecommendations(
    @Param('id') userId: string,
    @Query('targetRole') targetRole?: string,
  ) {
    return this.profileService.getSkillRecommendations(userId, targetRole);
  }

  @Get(':id/export')
  @ApiOperation({ summary: 'Export user skills as JSON or CSV' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiQuery({ name: 'format', required: false, enum: ['json', 'csv'], description: 'Export format (default: json)' })
  @ApiResponse({ status: 200, description: 'Returns skills in requested format' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  async exportSkills(
    @Param('id') userId: string,
    @Query('format') format: 'json' | 'csv' = 'json',
    @Res() res: Response,
  ) {
    const profile: any = await this.profileService.getProfile(userId);

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const skills = profile.skills || [];

    if (format === 'csv') {
      const csv = this.convertToCSV(skills);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="skills-${userId}.csv"`);
      return res.send(csv);
    }

    res.json({ userId, skills });
  }

  private convertToCSV(skills: any[]): string {
    const headers = 'Skill,Category,Proficiency,Evidence,Confidence\n';
    const rows = skills
      .map(
        (s: any) =>
          `"${s.name || ''}","${s.category || ''}","${s.proficiency || ''}","${(s.evidence || '').replace(/"/g, '""')}",${s.confidence || 0}`,
      )
      .join('\n');
    return headers + rows;
  }

  // ==================== CV GENERATION ====================
  
  @Post(':id/cv/generate')
  @ApiOperation({ summary: 'Generate AI-powered CV/Resume' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 201, description: 'CV generated successfully' })
  async generateCV(@Param('id') userId: string, @Body() dto: GenerateCVDto) {
    return this.profileService.generateCV(userId, dto);
  }

  @Get(':id/cv/recent')
  @ApiOperation({ summary: 'Get recently generated CVs' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiQuery({ name: 'limit', required: false, description: 'Maximum results (default: 10)' })
  @ApiResponse({ status: 200, description: 'Returns recent CVs' })
  async getRecentCVs(@Param('id') userId: string, @Query('limit') limit: number = 10) {
    return this.profileService.getRecentCVs(userId, limit);
  }

  @Get('cv/:cvId/download')
  @ApiOperation({ summary: 'Download generated CV' })
  @ApiParam({ name: 'cvId', description: 'CV ID' })
  @ApiResponse({ status: 200, description: 'Returns CV file' })
  async downloadCV(@Param('cvId') cvId: string, @Res() res: Response) {
    const cv = await this.profileService.getCVById(cvId);
    
    if (!cv) {
      return res.status(404).json({ error: 'CV not found' });
    }

    // Mock file download - in production, this would return the actual file
    const content = `# CV - ${cv.template}\n\nGenerated on ${cv.generatedAt}\n\n...CV Content...`;
    
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="cv-${cvId}.${cv.format}"`);
    return res.send(Buffer.from(content));
  }

  // ==================== ROLE MATCHING ====================
  
  @Post(':id/roles/match')
  @ApiOperation({ summary: 'Match job roles based on skills' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Returns matched roles' })
  async matchRoles(@Param('id') userId: string, @Body() dto: MatchRolesDto) {
    return this.profileService.matchRoles(userId, dto);
  }

  @Get(':id/roles/:jobId/analysis')
  @ApiOperation({ summary: 'Get detailed job match analysis' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiParam({ name: 'jobId', description: 'Job ID' })
  @ApiResponse({ status: 200, description: 'Returns match analysis' })
  async getJobMatchAnalysis(@Param('id') userId: string, @Param('jobId') jobId: string) {
    return this.profileService.getJobMatchAnalysis(userId, jobId);
  }

  // ==================== LEARNING PATHS ====================
  
  @Get(':id/learning-paths')
  @ApiOperation({ summary: 'Get user learning paths' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Returns learning paths' })
  async getLearningPaths(@Param('id') userId: string) {
    return this.profileService.getLearningPaths(userId);
  }

  @Post(':id/learning-paths/generate')
  @ApiOperation({ summary: 'Generate personalized learning path' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 201, description: 'Learning path generated' })
  async generateLearningPath(@Param('id') userId: string, @Body() dto: GenerateLearningPathDto) {
    return this.profileService.generateLearningPath(userId, dto);
  }

  @Put(':id/learning-paths/:pathId/progress/:stepId')
  @ApiOperation({ summary: 'Update learning path step progress' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiParam({ name: 'pathId', description: 'Learning path ID' })
  @ApiParam({ name: 'stepId', description: 'Step ID' })
  @ApiResponse({ status: 200, description: 'Progress updated' })
  async updateLearningPathProgress(
    @Param('id') userId: string,
    @Param('pathId') pathId: string,
    @Param('stepId') stepId: string,
    @Body() dto: UpdateLearningPathProgressDto,
  ) {
    return this.profileService.updateLearningPathProgress(userId, pathId, stepId, dto.completed);
  }

  @Delete(':id/learning-paths/:pathId')
  @ApiOperation({ summary: 'Delete learning path' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiParam({ name: 'pathId', description: 'Learning path ID' })
  @ApiResponse({ status: 200, description: 'Learning path deleted' })
  async deleteLearningPath(@Param('id') userId: string, @Param('pathId') pathId: string) {
    return this.profileService.deleteLearningPath(userId, pathId);
  }
}
