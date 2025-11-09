import { Module, forwardRef } from '@nestjs/common';
import { ExtractionController } from './extraction.controller';
import { ExtractionService } from './extraction.service';
import { ConnectorsModule } from '../connectors/connectors.module';
import { ProfileModule } from '../profile/profile.module';

@Module({
  imports: [ConnectorsModule, forwardRef(() => ProfileModule)],
  controllers: [ExtractionController],
  providers: [ExtractionService],
  exports: [ExtractionService],
})
export class ExtractionModule {}
