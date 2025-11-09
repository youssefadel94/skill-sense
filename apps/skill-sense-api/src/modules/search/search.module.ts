import { Module } from '@nestjs/common';
import { SearchController } from './search.controller';
import { VectorSearchService } from './vector-search.service';

@Module({
  controllers: [SearchController],
  providers: [VectorSearchService],
  exports: [VectorSearchService], // Export for use in other modules
})
export class SearchModule {}
