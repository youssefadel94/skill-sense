import { Module } from '@nestjs/common';
import { ExtractionController } from './extraction.controller';
import { ExtractionService } from './extraction.service';
import { ConnectorsModule } from '../connectors/connectors.module';

@Module({
  imports: [ConnectorsModule],
  controllers: [ExtractionController],
  providers: [ExtractionService],
})
export class ExtractionModule {}
