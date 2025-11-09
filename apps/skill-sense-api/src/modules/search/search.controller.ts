import { Controller, Get, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { VectorSearchService } from './vector-search.service';

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: VectorSearchService) {}

  @Get('skills')
  @ApiOperation({ summary: 'Search skills using vector similarity' })
  @ApiQuery({ name: 'q', description: 'Search query' })
  @ApiQuery({ name: 'userId', required: false, description: 'Filter by user ID' })
  @ApiQuery({ name: 'limit', required: false, description: 'Maximum results (default: 10)' })
  @ApiResponse({ status: 200, description: 'Returns matching skills' })
  async searchSkills(
    @Query('q') query: string,
    @Query('userId') userId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.searchService.searchSkills(
      query,
      userId,
      limit ? parseInt(limit) : 10,
    );
  }

  @Get('similar-profiles/:userId')
  @ApiOperation({ summary: 'Find users with similar skill sets' })
  @ApiParam({ name: 'userId', description: 'User ID to find similar profiles for' })
  @ApiQuery({ name: 'limit', required: false, description: 'Maximum results (default: 10)' })
  @ApiResponse({ status: 200, description: 'Returns similar user profiles' })
  async findSimilarProfiles(
    @Param('userId') userId: string,
    @Query('limit') limit?: string,
  ) {
    return this.searchService.findSimilarProfiles(
      userId,
      limit ? parseInt(limit) : 10,
    );
  }
}
