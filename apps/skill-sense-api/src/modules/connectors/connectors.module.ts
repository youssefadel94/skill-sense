import { Module } from '@nestjs/common';
import { CvParserService } from './cv/cv-parser.service';
import { GithubConnectorService } from './github/github-connector.service';
import { LinkedInConnectorService } from './linkedin/linkedin-connector.service';
import { WebSearchService } from './web/web-search.service';

@Module({
  providers: [
    CvParserService,
    GithubConnectorService,
    LinkedInConnectorService,
    WebSearchService,
  ],
  exports: [
    CvParserService,
    GithubConnectorService,
    LinkedInConnectorService,
    WebSearchService,
  ],
})
export class ConnectorsModule {}
