import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SharedModule } from './shared/shared.module';
import { ProfileModule } from './modules/profile/profile.module';
import { ExtractionModule } from './modules/extraction/extraction.module';
import { ConnectorsModule } from './modules/connectors/connectors.module';
import { SearchModule } from './modules/search/search.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    SharedModule,
    ProfileModule,
    ExtractionModule,
    ConnectorsModule,
    SearchModule,
    HealthModule,
  ],
})
export class AppModule {}
