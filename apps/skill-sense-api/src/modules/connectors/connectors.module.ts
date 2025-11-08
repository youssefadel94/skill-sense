import { Module } from '@nestjs/common';
import { CvParserService } from './cv/cv-parser.service';
import { GithubConnectorService } from './github/github-connector.service';
import { WebSearchService } from './web/web-search.service';

@Module({
  providers: [CvParserService, GithubConnectorService, WebSearchService],
  exports: [CvParserService, GithubConnectorService, WebSearchService],
})
export class ConnectorsModule {}
