import { Controller, Get, Query } from '@nestjs/common';
import { VectorSearchService } from './vector-search.service';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: VectorSearchService) {}

  @Get('skills')
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
}
