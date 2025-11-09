import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';

interface Recommendation {
  skill: string;
  category: string;
  relevanceScore: number;
  reason: string;
  demandLevel: 'high' | 'medium' | 'low';
  avgSalaryImpact?: string;
  learningResources: Resource[];
}

interface Resource {
  title: string;
  type: 'course' | 'book' | 'tutorial' | 'certification';
  provider: string;
  url: string;
  cost: 'free' | 'paid';
  duration?: string;
  rating?: number;
}

@Component({
  selector: 'app-recommendations',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="recommendations-container">
      <header class="page-header">
        <div>
          <h1>🎯 Skill Recommendations</h1>
          <p class="subtitle">Personalized skills to boost your career</p>
        </div>
        <a [routerLink]="['/dashboard']" class="btn btn-secondary">Back to Dashboard</a>
      </header>

      @if (loading) {
        <div class="loading">
          <div class="spinner"></div>
          <p>Generating personalized recommendations...</p>
        </div>
      }

      @if (error) {
        <div class="alert alert-error">{{ error }}</div>
      }

      @if (recommendations.length > 0 && !loading) {
        <div class="filters-section">
          <div class="filter-group">
            <label>Filter by demand:</label>
            <div class="button-group">
              <button
                [class.active]="demandFilter === 'all'"
                (click)="demandFilter = 'all'; filterRecommendations()"
                class="filter-btn"
              >
                All
              </button>
              <button
                [class.active]="demandFilter === 'high'"
                (click)="demandFilter = 'high'; filterRecommendations()"
                class="filter-btn high"
              >
                High Demand
              </button>
              <button
                [class.active]="demandFilter === 'medium'"
                (click)="demandFilter = 'medium'; filterRecommendations()"
                class="filter-btn medium"
              >
                Medium
              </button>
              <button
                [class.active]="demandFilter === 'low'"
                (click)="demandFilter = 'low'; filterRecommendations()"
                class="filter-btn low"
              >
                Low
              </button>
            </div>
          </div>

          <div class="sort-group">
            <label>Sort by:</label>
            <select [(ngModel)]="sortBy" (change)="sortRecommendations()" class="form-control">
              <option value="relevance">Relevance Score</option>
              <option value="demand">Demand Level</option>
              <option value="impact">Salary Impact</option>
            </select>
          </div>
        </div>

        <div class="recommendations-grid">
          @for (rec of filteredRecommendations; track rec.skill) {
            <div class="recommendation-card" [class]="'demand-' + rec.demandLevel">
              <div class="card-header">
                <div>
                  <h3>{{ rec.skill }}</h3>
                  <span class="category-badge">{{ rec.category }}</span>
                </div>
                <div class="relevance-score">
                  <div class="score-circle">{{ rec.relevanceScore }}%</div>
                  <span class="score-label">Match</span>
                </div>
              </div>

              <p class="reason">{{ rec.reason }}</p>

              <div class="metrics">
                <div class="metric">
                  <span class="label">Demand:</span>
                  <span class="badge demand" [class]="rec.demandLevel || 'medium'">
                    {{ (rec.demandLevel || 'medium').toUpperCase() }}
                  </span>
                </div>
                @if (rec.avgSalaryImpact) {
                  <div class="metric">
                    <span class="label">Salary Impact:</span>
                    <span class="value">{{ rec.avgSalaryImpact }}</span>
                  </div>
                }
              </div>

              <div class="resources">
                <h4>📚 Learning Resources ({{ rec.learningResources.length }})</h4>
                <div class="resources-list">
                  @for (resource of rec.learningResources.slice(0, 3); track resource.url) {
                    <div class="resource-item">
                      <div class="resource-header">
                        <span class="resource-type">{{ getResourceIcon(resource.type) }}</span>
                        <strong>{{ resource.title }}</strong>
                      </div>
                      <div class="resource-meta">
                        <span class="provider">{{ resource.provider }}</span>
                        <span class="cost" [class]="resource.cost">{{ resource.cost }}</span>
                        @if (resource.duration) {
                          <span class="duration">⏱️ {{ resource.duration }}</span>
                        }
                        @if (resource.rating) {
                          <span class="rating">⭐ {{ resource.rating }}/5</span>
                        }
                      </div>
                      <a [href]="resource.url" target="_blank" class="resource-link">
                        Learn more →
                      </a>
                    </div>
                  }
                </div>
                @if (rec.learningResources.length > 3) {
                  <button class="btn-text" (click)="showAllResources(rec)">
                    View all {{ rec.learningResources.length }} resources
                  </button>
                }
              </div>
            </div>
          }
        </div>

        <div class="actions">
          <button (click)="exportRecommendations()" class="btn btn-secondary">
            📥 Export as PDF
          </button>
          <a [routerLink]="['/gaps']" class="btn btn-primary">
            🎯 Analyze Skill Gaps
          </a>
        </div>
      }

      @if (recommendations.length === 0 && !loading && !error) {
        <div class="empty-state">
          <div class="empty-icon">🎯</div>
          <h3>No recommendations yet</h3>
          <p>Upload your CV or connect data sources to get personalized recommendations</p>
          <a [routerLink]="['/upload']" class="btn btn-primary">Upload CV</a>
        </div>
      }
    </div>
  `,
  styles: [`
    .recommendations-container {
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

    .filters-section {
      background: white;
      padding: 20px;
      border-radius: 12px;
      margin-bottom: 30px;
      display: flex;
      gap: 30px;
      flex-wrap: wrap;
      align-items: center;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .filter-group, .sort-group {
      display: flex;
      align-items: center;
      gap: 15px;
    }

    .filter-group label, .sort-group label {
      font-weight: 500;
      color: #555;
    }

    .button-group {
      display: flex;
      gap: 8px;
    }

    .filter-btn {
      padding: 8px 16px;
      border: 2px solid #ddd;
      background: white;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s;
    }

    .filter-btn:hover {
      border-color: #667eea;
    }

    .filter-btn.active {
      background: #667eea;
      border-color: #667eea;
      color: white;
    }

    .filter-btn.high.active {
      background: #ef4444;
      border-color: #ef4444;
    }

    .filter-btn.medium.active {
      background: #f59e0b;
      border-color: #f59e0b;
    }

    .filter-btn.low.active {
      background: #10b981;
      border-color: #10b981;
    }

    .recommendations-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));
      gap: 24px;
      margin-bottom: 30px;
    }

    .recommendation-card {
      background: white;
      padding: 24px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      border-left: 4px solid #667eea;
      transition: transform 0.2s;
    }

    .recommendation-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
    }

    .recommendation-card.demand-high {
      border-left-color: #ef4444;
    }

    .recommendation-card.demand-medium {
      border-left-color: #f59e0b;
    }

    .recommendation-card.demand-low {
      border-left-color: #10b981;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 15px;
    }

    .recommendation-card h3 {
      margin: 0 0 8px 0;
      color: #333;
      font-size: 20px;
    }

    .category-badge {
      display: inline-block;
      padding: 4px 10px;
      background: #e0e7ff;
      color: #4f46e5;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
    }

    .relevance-score {
      text-align: center;
    }

    .score-circle {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 4px;
    }

    .score-label {
      font-size: 11px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .reason {
      color: #555;
      line-height: 1.6;
      margin: 0 0 15px 0;
    }

    .metrics {
      display: flex;
      gap: 20px;
      margin-bottom: 20px;
      padding: 15px;
      background: #f9fafb;
      border-radius: 8px;
    }

    .metric {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .metric .label {
      color: #666;
      font-size: 14px;
    }

    .metric .value {
      color: #333;
      font-weight: 600;
    }

    .badge.demand {
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.5px;
    }

    .badge.demand.high {
      background: #fee;
      color: #dc2626;
    }

    .badge.demand.medium {
      background: #fef3c7;
      color: #d97706;
    }

    .badge.demand.low {
      background: #d1fae5;
      color: #059669;
    }

    .resources {
      border-top: 1px solid #e5e7eb;
      padding-top: 15px;
    }

    .resources h4 {
      margin: 0 0 12px 0;
      color: #333;
      font-size: 14px;
    }

    .resources-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .resource-item {
      padding: 12px;
      background: #f9fafb;
      border-radius: 6px;
      border-left: 3px solid #667eea;
    }

    .resource-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 6px;
    }

    .resource-type {
      font-size: 16px;
    }

    .resource-header strong {
      color: #333;
      font-size: 14px;
    }

    .resource-meta {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: 6px;
      font-size: 12px;
      color: #666;
    }

    .resource-meta .cost {
      padding: 2px 6px;
      border-radius: 3px;
      font-weight: 500;
    }

    .resource-meta .cost.free {
      background: #d1fae5;
      color: #059669;
    }

    .resource-meta .cost.paid {
      background: #fef3c7;
      color: #d97706;
    }

    .resource-link {
      color: #667eea;
      font-size: 13px;
      text-decoration: none;
      font-weight: 500;
    }

    .resource-link:hover {
      text-decoration: underline;
    }

    .btn-text {
      background: none;
      border: none;
      color: #667eea;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      padding: 8px 0;
      margin-top: 8px;
    }

    .btn-text:hover {
      text-decoration: underline;
    }

    .actions {
      display: flex;
      gap: 15px;
      justify-content: center;
    }

    .empty-state {
      text-align: center;
      padding: 80px 20px;
      background: white;
      border-radius: 12px;
    }

    .empty-icon {
      font-size: 64px;
      margin-bottom: 20px;
    }

    .empty-state h3 {
      margin: 0 0 10px 0;
      color: #333;
    }

    .empty-state p {
      color: #666;
      margin-bottom: 24px;
    }

    .alert-error {
      background: #fee;
      color: #c33;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
    }

    .btn {
      padding: 12px 24px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      text-decoration: none;
      display: inline-block;
      transition: background 0.2s;
    }

    .btn-primary {
      background: #667eea;
      color: white;
    }

    .btn-primary:hover {
      background: #5568d3;
    }

    .btn-secondary {
      background: #6c757d;
      color: white;
    }

    .btn-secondary:hover {
      background: #5a6268;
    }

    .form-control {
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 14px;
      min-width: 150px;
    }

    @media (max-width: 768px) {
      .recommendations-grid {
        grid-template-columns: 1fr;
      }

      .filters-section {
        flex-direction: column;
        align-items: stretch;
      }

      .filter-group, .sort-group {
        flex-direction: column;
        align-items: stretch;
      }
    }
  `]
})
export class RecommendationsComponent implements OnInit {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);

  loading = true;
  error = '';
  demandFilter: 'all' | 'high' | 'medium' | 'low' = 'all';
  sortBy: 'relevance' | 'demand' | 'impact' = 'relevance';

  recommendations: Recommendation[] = [];
  filteredRecommendations: Recommendation[] = [];

  ngOnInit() {
    this.loadRecommendations();
  }

  async loadRecommendations() {
    try {
      this.loading = true;
      this.error = '';

      const userId = this.authService.getUserId();
      if (!userId) {
        this.error = 'Please login to get recommendations';
        this.loading = false;
        return;
      }

      this.apiService.getSkillRecommendations(userId).subscribe({
        next: (response) => {
          this.recommendations = (response.recommendations || []).map((rec: any) => ({
            skill: rec.skill || rec.name,
            category: rec.category || 'Other',
            priority: rec.priority || 'medium',
            reason: rec.reason || 'Recommended based on your profile',
            marketDemand: rec.marketDemand || 'high',
            learningTime: rec.learningTime || rec.estimatedTime || '4-8 weeks',
            resources: rec.resources || []
          }));
          this.filterRecommendations();
          this.loading = false;
        },
        error: (err) => {
          console.error('Failed to load recommendations:', err);
          this.error = err.message || 'Failed to load recommendations';
          this.loading = false;
        }
      });

    } catch (err: any) {
      this.error = err.message || 'Failed to load recommendations';
      this.loading = false;
    }
  }

  filterRecommendations() {
    if (this.demandFilter === 'all') {
      this.filteredRecommendations = [...this.recommendations];
    } else {
      this.filteredRecommendations = this.recommendations.filter(
        r => r.demandLevel === this.demandFilter
      );
    }
    this.sortRecommendations();
  }

  sortRecommendations() {
    this.filteredRecommendations.sort((a, b) => {
      switch (this.sortBy) {
        case 'relevance':
          return b.relevanceScore - a.relevanceScore;
        case 'demand':
          const demandOrder = { high: 3, medium: 2, low: 1 };
          return demandOrder[b.demandLevel] - demandOrder[a.demandLevel];
        case 'impact':
          return (b.avgSalaryImpact || '').localeCompare(a.avgSalaryImpact || '');
        default:
          return 0;
      }
    });
  }

  getResourceIcon(type: string): string {
    const icons: Record<string, string> = {
      course: '🎓',
      book: '📖',
      tutorial: '📺',
      certification: '🏆'
    };
    return icons[type] || '📚';
  }

  showAllResources(recommendation: Recommendation) {
    // TODO: Implement modal or expanded view
    console.log('Show all resources for:', recommendation.skill);
    alert(`All ${recommendation.learningResources.length} resources for ${recommendation.skill}`);
  }

  exportRecommendations() {
    // TODO: Implement PDF export
    console.log('Exporting recommendations...');
    alert('PDF export coming soon!');
  }

  private generateMockRecommendations(): Recommendation[] {
    return [
      {
        skill: 'Kubernetes',
        category: 'DevOps',
        relevanceScore: 95,
        reason: 'Based on your Docker and microservices experience, Kubernetes is a natural next step. It\'s in high demand and will significantly boost your DevOps capabilities.',
        demandLevel: 'high',
        avgSalaryImpact: '+15-20%',
        learningResources: [
          {
            title: 'Kubernetes for Developers',
            type: 'course',
            provider: 'Linux Foundation',
            url: 'https://training.linuxfoundation.org',
            cost: 'paid',
            duration: '40 hours',
            rating: 4.7
          },
          {
            title: 'Kubernetes Up & Running',
            type: 'book',
            provider: "O'Reilly",
            url: 'https://oreilly.com',
            cost: 'paid',
            rating: 4.8
          },
          {
            title: 'Kubernetes Crash Course',
            type: 'tutorial',
            provider: 'YouTube - TechWorld with Nana',
            url: 'https://youtube.com',
            cost: 'free',
            duration: '3 hours',
            rating: 4.9
          }
        ]
      },
      {
        skill: 'GraphQL',
        category: 'Backend Development',
        relevanceScore: 88,
        reason: 'Your REST API expertise translates well to GraphQL. Many companies are migrating to GraphQL for better performance and developer experience.',
        demandLevel: 'high',
        avgSalaryImpact: '+10-15%',
        learningResources: [
          {
            title: 'GraphQL with Node.js',
            type: 'course',
            provider: 'Udemy',
            url: 'https://udemy.com',
            cost: 'paid',
            duration: '20 hours',
            rating: 4.6
          },
          {
            title: 'How to GraphQL',
            type: 'tutorial',
            provider: 'Prisma',
            url: 'https://howtographql.com',
            cost: 'free',
            duration: '10 hours',
            rating: 4.8
          }
        ]
      },
      {
        skill: 'Terraform',
        category: 'Infrastructure as Code',
        relevanceScore: 85,
        reason: 'Complements your cloud experience perfectly. Essential for modern DevOps and infrastructure automation.',
        demandLevel: 'high',
        avgSalaryImpact: '+12-18%',
        learningResources: [
          {
            title: 'HashiCorp Terraform Associate',
            type: 'certification',
            provider: 'HashiCorp',
            url: 'https://hashicorp.com',
            cost: 'paid',
            duration: '30 hours',
            rating: 4.7
          },
          {
            title: 'Terraform Up & Running',
            type: 'book',
            provider: "O'Reilly",
            url: 'https://oreilly.com',
            cost: 'paid',
            rating: 4.9
          }
        ]
      },
      {
        skill: 'React',
        category: 'Frontend Framework',
        relevanceScore: 82,
        reason: 'While you know Angular, React is the most in-demand frontend framework. Knowing both gives you more opportunities.',
        demandLevel: 'medium',
        avgSalaryImpact: '+8-12%',
        learningResources: [
          {
            title: 'React - The Complete Guide',
            type: 'course',
            provider: 'Udemy',
            url: 'https://udemy.com',
            cost: 'paid',
            duration: '48 hours',
            rating: 4.8
          },
          {
            title: 'React Official Tutorial',
            type: 'tutorial',
            provider: 'React.dev',
            url: 'https://react.dev',
            cost: 'free',
            duration: '5 hours',
            rating: 4.9
          }
        ]
      },
      {
        skill: 'PostgreSQL Advanced',
        category: 'Database',
        relevanceScore: 78,
        reason: 'Deepen your database expertise with advanced PostgreSQL features like partitioning, replication, and performance tuning.',
        demandLevel: 'medium',
        avgSalaryImpact: '+5-10%',
        learningResources: [
          {
            title: 'PostgreSQL Performance Tuning',
            type: 'course',
            provider: 'Pluralsight',
            url: 'https://pluralsight.com',
            cost: 'paid',
            duration: '25 hours',
            rating: 4.6
          }
        ]
      },
      {
        skill: 'Machine Learning Basics',
        category: 'AI/ML',
        relevanceScore: 72,
        reason: 'AI/ML skills are increasingly valuable across all tech roles. Start with fundamentals to understand how to leverage AI in your work.',
        demandLevel: 'low',
        avgSalaryImpact: '+15-25%',
        learningResources: [
          {
            title: 'Machine Learning by Andrew Ng',
            type: 'course',
            provider: 'Coursera',
            url: 'https://coursera.org',
            cost: 'free',
            duration: '60 hours',
            rating: 4.9
          },
          {
            title: 'Hands-On Machine Learning',
            type: 'book',
            provider: "O'Reilly",
            url: 'https://oreilly.com',
            cost: 'paid',
            rating: 4.8
          }
        ]
      }
    ];
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
