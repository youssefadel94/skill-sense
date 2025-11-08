import { Injectable, Logger } from '@nestjs/common';
import { Octokit } from '@octokit/rest';
import { VertexAIService } from '../../../shared/services/vertex-ai.service';

@Injectable()
export class GithubConnectorService {
  private readonly logger = new Logger(GithubConnectorService.name);
  private octokit: Octokit;

  constructor(private readonly vertexAI: VertexAIService) {
    this.octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });
  }

  async extractSkillsFromGitHub(username: string): Promise<any> {
    this.logger.log(`Extracting skills from GitHub user: ${username}`);

    try {
      // Fetch user's repositories
      const { data: repos } = await this.octokit.repos.listForUser({
        username,
        per_page: 10,
        sort: 'updated',
      });

      // Analyze languages and README files
      const languages = new Set<string>();
      const skills: any[] = [];

      for (const repo of repos) {
        // Get languages used in repo
        const { data: repoLangs } = await this.octokit.repos.listLanguages({
          owner: username,
          repo: repo.name,
        });

        Object.keys(repoLangs).forEach(lang => languages.add(lang));

        // Extract from README if available
        try {
          const { data: readme } = await this.octokit.repos.getReadme({
            owner: username,
            repo: repo.name,
          });

          const content = Buffer.from(readme.content, 'base64').toString('utf-8');
          const extracted = await this.vertexAI.extractSkills(content);
          skills.push(...(extracted.skills || []));
        } catch (error) {
          // README not found, skip
        }
      }

      return {
        source: 'github',
        username,
        languages: Array.from(languages),
        skills,
        repoCount: repos.length,
      };
    } catch (error) {
      this.logger.error(`GitHub extraction failed: ${error.message}`);
      throw error;
    }
  }
}
