import { Module } from '@nestjs/common';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { SearchModule } from '../search/search.module';

@Module({
  imports: [SearchModule], // Import SearchModule to use VectorSearchService
  controllers: [ProfileController],
  providers: [ProfileService],
  exports: [ProfileService],
})
export class ProfileModule {}
