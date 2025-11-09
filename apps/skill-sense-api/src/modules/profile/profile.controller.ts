import { Controller, Get, Post, Body, Param, Delete, Query, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { ProfileService } from './profile.service';
import { CreateProfileDto } from './dto/profile.dto';

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
}
