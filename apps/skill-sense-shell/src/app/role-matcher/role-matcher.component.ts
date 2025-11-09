import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../services/api.service';

interface JobMatch {
  id: string;
  title: string;
  company: string;
  location: string;
  matchScore: number; // 0-100
  skillsMatch: number; // 0-100
  experienceMatch: number; // 0-100
  salary: { min: number; max: number; currency: string };
  requiredSkills: Array<{ name: string; matched: boolean; proficiency: number }>;
  missingSkills: string[];
  url?: string;
  description: string;
  postedDate: Date;
}

interface MatchAnalysis {
  overallScore: number;
  strengths: string[];
  gaps: string[];
  recommendations: string[];
}

@Component({
  selector: 'app-role-matcher',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="role-matcher-container">
      <header class="page-header">
        <div>
          <h1>🎯 AI Role Matcher</h1>
          <p class="subtitle">Find roles that match your skills and experience</p>
        </div>
        <a [routerLink]="['/dashboard']" class="btn btn-secondary">Back to Dashboard</a>
      </header>

      @if (loading) {
        <div class="loading">
          <div class="spinner"></div>
          <p>{{ loadingMessage }}</p>
        </div>
      }

      @if (error) {
        <div class="alert alert-error">{{ error }}</div>
      }

      @if (!loading && !error) {
        <!-- Search Section -->
        <div class="search-section">
          <div class="search-card">
            <h3>🔍 Search for Roles</h3>
            <div class="search-form">
              <div class="form-row">
                <div class="form-group">
                  <label>Job Title / Keywords</label>
                  <input
                    type="text"
                    [(ngModel)]="searchQuery"
                    placeholder="e.g., Full Stack Developer, DevOps Engineer"
                    class="form-control"
                    (keyup.enter)="searchRoles()"
                  />
                </div>
                <div class="form-group">
                  <label>Location</label>
                  <input
                    type="text"
                    [(ngModel)]="location"
                    placeholder="e.g., Remote, New York, London"
                    class="form-control"
                  />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Minimum Match Score</label>
                  <select [(ngModel)]="minMatchScore" class="form-control">
                    <option [value]="0">Any Match</option>
                    <option [value]="50">50%+</option>
                    <option [value]="60">60%+</option>
                    <option [value]="70">70%+</option>
                    <option [value]="80">80%+</option>
                    <option [value]="90">90%+</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Sort By</label>
                  <select [(ngModel)]="sortBy" class="form-control">
                    <option value="match">Best Match</option>
                    <option value="salary">Highest Salary</option>
                    <option value="date">Most Recent</option>
                  </select>
                </div>
              </div>

              <button
                class="btn btn-primary btn-block"
                (click)="searchRoles()"
                [disabled]="searching"
              >
                @if (searching) {
                  <span class="spinner-sm"></span>
                  Searching...
                } @else {
                  🚀 Find Matching Roles
                }
              </button>
            </div>
          </div>
        </div>

        <!-- Results Section -->
        @if (matches.length > 0) {
          <div class="results-section">
            <div class="results-header">
              <h3>📊 Found {{ matches.length }} Matching Roles</h3>
              <div class="filter-badges">
                <span class="badge">{{ perfectMatches }} Perfect Matches (90%+)</span>
                <span class="badge">{{ goodMatches }} Good Matches (70-89%)</span>
                <span class="badge">{{ fairMatches }} Fair Matches (50-69%)</span>
              </div>
            </div>

            <div class="matches-grid">
              @for (match of filteredMatches; track match.id) {
                <div class="match-card" [class.perfect]="match.matchScore >= 90">
                  <!-- Header -->
                  <div class="match-header">
                    <div class="match-title-section">
                      <h4>{{ match.title }}</h4>
                      <p class="company">{{ match.company }} • {{ match.location }}</p>
                    </div>
                    <div class="match-score" [class.high]="match.matchScore >= 80">
                      <div class="score-circle">
                        <span class="score-value">{{ match.matchScore }}%</span>
                      </div>
                      <span class="score-label">Match</span>
                    </div>
                  </div>

                  <!-- Salary -->
                  <div class="salary-section">
                    <span class="salary-icon">💰</span>
                    <span class="salary-range">
                      {{ match.salary.currency }}{{ match.salary.min }}k - {{ match.salary.currency }}{{ match.salary.max }}k
                    </span>
                  </div>

                  <!-- Match Breakdown -->
                  <div class="match-breakdown">
                    <div class="breakdown-item">
                      <span class="breakdown-label">Skills Match:</span>
                      <div class="progress-bar">
                        <div class="progress-fill" [style.width.%]="match.skillsMatch"></div>
                      </div>
                      <span class="breakdown-value">{{ match.skillsMatch }}%</span>
                    </div>
                    <div class="breakdown-item">
                      <span class="breakdown-label">Experience Match:</span>
                      <div class="progress-bar">
                        <div class="progress-fill" [style.width.%]="match.experienceMatch"></div>
                      </div>
                      <span class="breakdown-value">{{ match.experienceMatch }}%</span>
                    </div>
                  </div>

                  <!-- Required Skills -->
                  <div class="skills-section">
                    <div class="skills-header">Required Skills:</div>
                    <div class="skills-list">
                      @for (skill of match.requiredSkills.slice(0, 6); track skill.name) {
                        <span
                          class="skill-tag"
                          [class.matched]="skill.matched"
                          [class.missing]="!skill.matched"
                        >
                          {{ skill.name }}
                          @if (skill.matched) {
                            ✓
                          }
                        </span>
                      }
                    </div>
                  </div>

                  <!-- Missing Skills -->
                  @if (match.missingSkills.length > 0) {
                    <div class="missing-skills">
                      <span class="warning-icon">⚠️</span>
                      <span>Missing {{ match.missingSkills.length }} skills:
                        <strong>{{ match.missingSkills.slice(0, 3).join(', ') }}</strong>
                        @if (match.missingSkills.length > 3) {
                          <span>, +{{ match.missingSkills.length - 3 }} more</span>
                        }
                      </span>
                    </div>
                  }

                  <!-- Actions -->
                  <div class="match-actions">
                    <button class="btn btn-sm btn-secondary" (click)="viewDetails(match)">
                      📋 View Details
                    </button>
                    <button class="btn btn-sm btn-primary" (click)="applyToJob(match)">
                      🚀 Apply Now
                    </button>
                  </div>

                  <!-- Posted Date -->
                  <div class="posted-date">
                    Posted {{ getTimeAgo(match.postedDate) }}
                  </div>
                </div>
              }
            </div>
          </div>
        }

        <!-- Empty State -->
        @if (!searching && matches.length === 0 && hasSearched) {
          <div class="empty-state">
            <div class="empty-icon">🔍</div>
            <h3>No Matching Roles Found</h3>
            <p>Try adjusting your search criteria or lowering the minimum match score.</p>
          </div>
        }

        <!-- Analysis Modal -->
        @if (selectedMatch) {
          <div class="modal-overlay" (click)="closeDetails()">
            <div class="modal-content" (click)="$event.stopPropagation()">
              <div class="modal-header">
                <h3>🎯 Match Analysis</h3>
                <button class="btn-close" (click)="closeDetails()">×</button>
              </div>

              <div class="modal-body">
                <h4>{{ selectedMatch.title }} at {{ selectedMatch.company }}</h4>

                <div class="analysis-section">
                  <h5>💪 Your Strengths</h5>
                  <ul>
                    @for (strength of analysisData.strengths; track strength) {
                      <li>{{ strength }}</li>
                    }
                  </ul>
                </div>

                <div class="analysis-section">
                  <h5>📉 Skill Gaps</h5>
                  <ul>
                    @for (gap of analysisData.gaps; track gap) {
                      <li>{{ gap }}</li>
                    }
                  </ul>
                </div>

                <div class="analysis-section">
                  <h5>💡 Recommendations</h5>
                  <ul>
                    @for (rec of analysisData.recommendations; track rec) {
                      <li>{{ rec }}</li>
                    }
                  </ul>
                </div>

                <div class="job-description">
                  <h5>📄 Job Description</h5>
                  <p>{{ selectedMatch.description }}</p>
                </div>
              </div>

              <div class="modal-footer">
                <button class="btn btn-secondary" (click)="closeDetails()">Close</button>
                <button class="btn btn-primary" (click)="applyToJob(selectedMatch)">
                  🚀 Apply Now
                </button>
              </div>
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .role-matcher-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 20px;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 30px;
    }

    .page-header h1 {
      margin: 0 0 5px 0;
      color: #333;
      font-size: 32px;
    }

    .subtitle {
      margin: 0;
      color: #666;
      font-size: 16px;
    }

    .loading {
      text-align: center;
      padding: 60px 20px;
    }

    .spinner {
      border: 4px solid #f3f3f3;
      border-top: 4px solid #667eea;
      border-radius: 50%;
      width: 50px;
      height: 50px;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .search-section {
      margin-bottom: 30px;
    }

    .search-card {
      background: white;
      padding: 24px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .search-card h3 {
      margin: 0 0 20px 0;
      color: #333;
    }

    .search-form {
      max-width: 900px;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin-bottom: 15px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
    }

    .form-group label {
      margin-bottom: 6px;
      font-weight: 500;
      color: #333;
      font-size: 14px;
    }

    .form-control {
      padding: 10px 12px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 14px;
    }

    .form-control:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.2s;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }

    .btn-secondary {
      background: #6c757d;
      color: white;
    }

    .btn-secondary:hover:not(:disabled) {
      background: #5a6268;
    }

    .btn-block {
      width: 100%;
      margin-top: 10px;
    }

    .btn-sm {
      padding: 6px 14px;
      font-size: 13px;
    }

    .spinner-sm {
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    .results-section {
      background: white;
      padding: 24px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .results-header {
      margin-bottom: 24px;
    }

    .results-header h3 {
      margin: 0 0 12px 0;
      color: #333;
    }

    .filter-badges {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .badge {
      padding: 6px 12px;
      background: #e0e7ff;
      color: #4f46e5;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
    }

    .matches-grid {
      display: grid;
      gap: 20px;
    }

    .match-card {
      padding: 24px;
      background: #f9fafb;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      transition: all 0.2s;
    }

    .match-card:hover {
      border-color: #667eea;
      box-shadow: 0 4px 16px rgba(102, 126, 234, 0.15);
    }

    .match-card.perfect {
      background: linear-gradient(135deg, #fff5f5 0%, #ffe5f5 100%);
      border-color: #ef4444;
    }

    .match-header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 16px;
    }

    .match-title-section h4 {
      margin: 0 0 6px 0;
      color: #333;
      font-size: 20px;
    }

    .company {
      margin: 0;
      color: #666;
      font-size: 14px;
    }

    .match-score {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }

    .score-circle {
      width: 70px;
      height: 70px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .score-circle.high {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    }

    .score-value {
      color: white;
      font-size: 20px;
      font-weight: bold;
    }

    .score-label {
      font-size: 12px;
      color: #666;
      font-weight: 500;
    }

    .salary-section {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
      padding: 12px;
      background: white;
      border-radius: 8px;
    }

    .salary-icon {
      font-size: 20px;
    }

    .salary-range {
      color: #059669;
      font-weight: 600;
      font-size: 16px;
    }

    .match-breakdown {
      margin-bottom: 16px;
    }

    .breakdown-item {
      display: grid;
      grid-template-columns: 120px 1fr 60px;
      align-items: center;
      gap: 12px;
      margin-bottom: 10px;
    }

    .breakdown-label {
      font-size: 13px;
      color: #666;
      font-weight: 500;
    }

    .progress-bar {
      height: 8px;
      background: #e5e7eb;
      border-radius: 4px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
      transition: width 0.3s;
    }

    .breakdown-value {
      text-align: right;
      font-weight: 600;
      color: #333;
      font-size: 13px;
    }

    .skills-section {
      margin-bottom: 16px;
    }

    .skills-header {
      font-weight: 600;
      color: #333;
      margin-bottom: 10px;
      font-size: 14px;
    }

    .skills-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .skill-tag {
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
    }

    .skill-tag.matched {
      background: #d1fae5;
      color: #059669;
    }

    .skill-tag.missing {
      background: #fee;
      color: #dc2626;
    }

    .missing-skills {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      border-radius: 6px;
      margin-bottom: 16px;
      font-size: 13px;
      color: #92400e;
    }

    .warning-icon {
      font-size: 16px;
    }

    .match-actions {
      display: flex;
      gap: 10px;
      margin-bottom: 12px;
    }

    .posted-date {
      font-size: 12px;
      color: #999;
      text-align: right;
    }

    .empty-state {
      text-align: center;
      padding: 80px 40px;
      background: white;
      border-radius: 12px;
    }

    .empty-icon {
      font-size: 80px;
      margin-bottom: 20px;
      opacity: 0.5;
    }

    .empty-state h3 {
      margin: 0 0 10px 0;
      color: #333;
    }

    .empty-state p {
      color: #666;
    }

    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 20px;
    }

    .modal-content {
      background: white;
      border-radius: 12px;
      max-width: 800px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 24px;
      border-bottom: 1px solid #e5e7eb;
    }

    .modal-header h3 {
      margin: 0;
      color: #333;
    }

    .btn-close {
      background: none;
      border: none;
      font-size: 32px;
      color: #999;
      cursor: pointer;
      padding: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
    }

    .btn-close:hover {
      background: #f3f4f6;
      color: #333;
    }

    .modal-body {
      padding: 24px;
    }

    .modal-body h4 {
      margin: 0 0 24px 0;
      color: #333;
    }

    .analysis-section {
      margin-bottom: 24px;
    }

    .analysis-section h5 {
      margin: 0 0 12px 0;
      color: #333;
      font-size: 16px;
    }

    .analysis-section ul {
      margin: 0;
      padding-left: 20px;
      color: #555;
    }

    .analysis-section li {
      margin-bottom: 8px;
      line-height: 1.5;
    }

    .job-description {
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid #e5e7eb;
    }

    .job-description h5 {
      margin: 0 0 12px 0;
      color: #333;
    }

    .job-description p {
      color: #555;
      line-height: 1.6;
      margin: 0;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 20px 24px;
      border-top: 1px solid #e5e7eb;
      background: #f9fafb;
    }

    .alert-error {
      background: #fee;
      color: #c33;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
    }

    @media (max-width: 768px) {
      .form-row {
        grid-template-columns: 1fr;
      }

      .match-header {
        flex-direction: column;
        gap: 16px;
      }

      .match-actions {
        flex-direction: column;
      }
    }
  `]
})
export class RoleMatcherComponent implements OnInit {
  private apiService = inject(ApiService);

  loading = false;
  error = '';
  loadingMessage = '';
  searching = false;
  hasSearched = false;

  searchQuery = '';
  location = 'Remote';
  minMatchScore = 70;
  sortBy = 'match';

  matches: JobMatch[] = [];
  selectedMatch: JobMatch | null = null;
  analysisData: MatchAnalysis = {
    overallScore: 0,
    strengths: [],
    gaps: [],
    recommendations: []
  };

  get filteredMatches(): JobMatch[] {
    let filtered = this.matches.filter(m => m.matchScore >= this.minMatchScore);

    // Sort
    if (this.sortBy === 'match') {
      filtered.sort((a, b) => b.matchScore - a.matchScore);
    } else if (this.sortBy === 'salary') {
      filtered.sort((a, b) => b.salary.max - a.salary.max);
    } else if (this.sortBy === 'date') {
      filtered.sort((a, b) => b.postedDate.getTime() - a.postedDate.getTime());
    }

    return filtered;
  }

  get perfectMatches(): number {
    return this.matches.filter(m => m.matchScore >= 90).length;
  }

  get goodMatches(): number {
    return this.matches.filter(m => m.matchScore >= 70 && m.matchScore < 90).length;
  }

  get fairMatches(): number {
    return this.matches.filter(m => m.matchScore >= 50 && m.matchScore < 70).length;
  }

  ngOnInit() {
    // Auto-search on load with default params
  }

  async searchRoles() {
    try {
      this.searching = true;
      this.hasSearched = true;
      this.error = '';

      // TODO: Replace with actual API call
      // this.apiService.matchRoles({
      //   query: this.searchQuery,
      //   location: this.location,
      //   minScore: this.minMatchScore
      // }).subscribe({
      //   next: (matches) => { this.matches = matches; },
      //   error: (err) => { this.error = err.message; },
      //   complete: () => { this.searching = false; }
      // });

      await this.delay(1500);
      this.matches = this.generateMockMatches();

    } catch (err: any) {
      this.error = err.message || 'Failed to search roles';
    } finally {
      this.searching = false;
    }
  }

  viewDetails(match: JobMatch) {
    this.selectedMatch = match;
    this.analysisData = this.generateAnalysis(match);
  }

  closeDetails() {
    this.selectedMatch = null;
  }

  applyToJob(match: JobMatch) {
    if (match.url) {
      window.open(match.url, '_blank');
    } else {
      alert(`Apply to ${match.title} at ${match.company}`);
    }
  }

  getTimeAgo(date: Date): string {
    const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'today';
    if (days === 1) return '1 day ago';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  }

  private generateAnalysis(match: JobMatch): MatchAnalysis {
    return {
      overallScore: match.matchScore,
      strengths: [
        'Strong experience with required technologies',
        'Excellent proficiency in core programming languages',
        'Proven track record in similar roles'
      ],
      gaps: match.missingSkills.map(s => `Need to develop: ${s}`),
      recommendations: [
        'Complete online courses in missing skills',
        'Build portfolio projects demonstrating required technologies',
        'Obtain relevant certifications to strengthen application'
      ]
    };
  }

  private generateMockMatches(): JobMatch[] {
    return [
      {
        id: '1',
        title: 'Senior Full Stack Developer',
        company: 'TechCorp Inc',
        location: 'Remote',
        matchScore: 92,
        skillsMatch: 95,
        experienceMatch: 88,
        salary: { min: 130, max: 180, currency: '$' },
        requiredSkills: [
          { name: 'TypeScript', matched: true, proficiency: 90 },
          { name: 'React', matched: true, proficiency: 85 },
          { name: 'Node.js', matched: true, proficiency: 88 },
          { name: 'AWS', matched: true, proficiency: 75 },
          { name: 'Docker', matched: true, proficiency: 80 },
          { name: 'PostgreSQL', matched: true, proficiency: 82 }
        ],
        missingSkills: ['Kubernetes'],
        description: 'We are seeking an experienced Full Stack Developer to join our growing team...',
        postedDate: new Date(Date.now() - 172800000), // 2 days ago
        url: 'https://example.com/job/1'
      },
      {
        id: '2',
        title: 'DevOps Engineer',
        company: 'CloudScale Solutions',
        location: 'New York, NY',
        matchScore: 85,
        skillsMatch: 82,
        experienceMatch: 88,
        salary: { min: 120, max: 160, currency: '$' },
        requiredSkills: [
          { name: 'Docker', matched: true, proficiency: 80 },
          { name: 'Kubernetes', matched: false, proficiency: 0 },
          { name: 'AWS', matched: true, proficiency: 75 },
          { name: 'Terraform', matched: false, proficiency: 0 },
          { name: 'Python', matched: true, proficiency: 70 },
          { name: 'CI/CD', matched: true, proficiency: 85 }
        ],
        missingSkills: ['Kubernetes', 'Terraform'],
        description: 'Join our DevOps team to build and maintain cloud infrastructure...',
        postedDate: new Date(Date.now() - 432000000), // 5 days ago
        url: 'https://example.com/job/2'
      },
      {
        id: '3',
        title: 'Frontend Developer',
        company: 'Design First Ltd',
        location: 'Remote',
        matchScore: 78,
        skillsMatch: 80,
        experienceMatch: 75,
        salary: { min: 90, max: 130, currency: '$' },
        requiredSkills: [
          { name: 'React', matched: true, proficiency: 85 },
          { name: 'TypeScript', matched: true, proficiency: 90 },
          { name: 'CSS', matched: true, proficiency: 75 },
          { name: 'Next.js', matched: false, proficiency: 0 },
          { name: 'GraphQL', matched: false, proficiency: 0 }
        ],
        missingSkills: ['Next.js', 'GraphQL', 'Tailwind CSS'],
        description: 'Build beautiful, responsive user interfaces for our SaaS products...',
        postedDate: new Date(Date.now() - 604800000), // 7 days ago
        url: 'https://example.com/job/3'
      }
    ];
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
