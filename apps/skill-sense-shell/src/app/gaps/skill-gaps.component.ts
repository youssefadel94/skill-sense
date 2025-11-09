import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';

interface SkillGap {
  skill: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  estimatedLearningTime: string;
  resources?: string[];
}

@Component({
  selector: 'app-skill-gaps',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="gaps-container">
      <header class="gaps-header">
        <h1>Skill Gap Analysis</h1>
        <a [routerLink]="['/dashboard']" class="btn btn-secondary">Back to Dashboard</a>
      </header>

      <div class="input-card">
        <h3>Enter Target Role</h3>
        <form (ngSubmit)="analyzeGaps()" #gapForm="ngForm">
          <div class="form-group">
            <label for="targetRole">What role are you targeting?</label>
            <input
              type="text"
              id="targetRole"
              name="targetRole"
              [(ngModel)]="targetRole"
              required
              class="form-control"
              placeholder="e.g., Senior Full Stack Developer, DevOps Engineer, Data Scientist"
            />
          </div>
          <button type="submit" class="btn btn-primary" [disabled]="!gapForm.valid || loading">
            {{ loading ? 'Analyzing...' : 'Analyze Gaps' }}
          </button>
        </form>
      </div>

      @if (loading) {
        <div class="loading">
          <div class="spinner"></div>
          <p>Analyzing skill gaps for {{ targetRole }}...</p>
        </div>
      }

      @if (error) {
        <div class="alert alert-error">{{ error }}</div>
      }

      @if (gaps.length > 0 && !loading) {
        <div class="results-section">
          <h2>Skill Gaps for {{ targetRole }}</h2>

          <div class="priority-tabs">
            <button
              [class.active]="priorityFilter === 'all'"
              (click)="priorityFilter = 'all'; filterGaps()"
              class="tab-btn"
            >
              All ({{ gaps.length }})
            </button>
            <button
              [class.active]="priorityFilter === 'high'"
              (click)="priorityFilter = 'high'; filterGaps()"
              class="tab-btn high"
            >
              High Priority ({{ countByPriority('high') }})
            </button>
            <button
              [class.active]="priorityFilter === 'medium'"
              (click)="priorityFilter = 'medium'; filterGaps()"
              class="tab-btn medium"
            >
              Medium ({{ countByPriority('medium') }})
            </button>
            <button
              [class.active]="priorityFilter === 'low'"
              (click)="priorityFilter = 'low'; filterGaps()"
              class="tab-btn low"
            >
              Low ({{ countByPriority('low') }})
            </button>
          </div>

          <div class="gaps-grid">
            @for (gap of filteredGaps; track gap.skill) {
              <div class="gap-card" [class]="'priority-' + gap.priority">
                <div class="gap-header">
                  <h3>{{ gap.skill }}</h3>
                  <span class="priority-badge" [class]="gap.priority">
                    {{ gap.priority.toUpperCase() }}
                  </span>
                </div>
                <p class="category">{{ gap.category }}</p>
                <div class="gap-info">
                  <div class="info-item">
                    <span class="icon">⏱️</span>
                    <span class="text">{{ gap.estimatedLearningTime }}</span>
                  </div>
                </div>
                @if (gap.resources && gap.resources.length > 0) {
                  <div class="resources">
                    <h4>Learning Resources:</h4>
                    <ul>
                      @for (resource of gap.resources; track resource) {
                        <li>{{ resource }}</li>
                      }
                    </ul>
                  </div>
                }
              </div>
            }
          </div>

          <div class="actions">
            <button (click)="exportGaps()" class="btn btn-secondary">
              Export as PDF
            </button>
            <a [routerLink]="['/recommendations']" class="btn btn-primary">
              Get Learning Recommendations
            </a>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .gaps-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }

    .gaps-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
    }

    .gaps-header h1 {
      margin: 0;
      color: #333;
      font-size: 32px;
    }

    .input-card {
      background: white;
      padding: 30px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      margin-bottom: 30px;
    }

    .input-card h3 {
      margin: 0 0 20px 0;
      color: #333;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      margin-bottom: 8px;
      color: #555;
      font-weight: 500;
    }

    .form-control {
      width: 100%;
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 8px;
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

    .results-section h2 {
      margin: 0 0 20px 0;
      color: #333;
    }

    .priority-tabs {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }

    .tab-btn {
      padding: 10px 20px;
      border: 2px solid #ddd;
      background: white;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s;
    }

    .tab-btn:hover {
      border-color: #667eea;
      background: #f8f9ff;
    }

    .tab-btn.active {
      border-color: #667eea;
      background: #667eea;
      color: white;
    }

    .tab-btn.high.active {
      background: #ef4444;
      border-color: #ef4444;
    }

    .tab-btn.medium.active {
      background: #f59e0b;
      border-color: #f59e0b;
    }

    .tab-btn.low.active {
      background: #10b981;
      border-color: #10b981;
    }

    .gaps-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .gap-card {
      background: white;
      padding: 24px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      border-left: 4px solid #ddd;
    }

    .gap-card.priority-high {
      border-left-color: #ef4444;
    }

    .gap-card.priority-medium {
      border-left-color: #f59e0b;
    }

    .gap-card.priority-low {
      border-left-color: #10b981;
    }

    .gap-header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 10px;
    }

    .gap-card h3 {
      margin: 0;
      color: #333;
      font-size: 20px;
    }

    .priority-badge {
      padding: 4px 12px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.5px;
    }

    .priority-badge.high {
      background: #fee;
      color: #dc2626;
    }

    .priority-badge.medium {
      background: #fef3c7;
      color: #d97706;
    }

    .priority-badge.low {
      background: #d1fae5;
      color: #059669;
    }

    .category {
      color: #666;
      font-size: 14px;
      margin: 0 0 15px 0;
    }

    .gap-info {
      margin-bottom: 15px;
    }

    .info-item {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #333;
      font-size: 14px;
      margin-bottom: 8px;
    }

    .icon {
      font-size: 18px;
    }

    .resources h4 {
      margin: 15px 0 10px 0;
      color: #333;
      font-size: 14px;
      font-weight: 600;
    }

    .resources ul {
      margin: 0;
      padding-left: 20px;
    }

    .resources li {
      color: #666;
      font-size: 13px;
      margin-bottom: 5px;
    }

    .actions {
      display: flex;
      gap: 15px;
      justify-content: center;
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

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  `]
})
export class SkillGapsComponent implements OnInit {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);

  targetRole = '';
  loading = false;
  error = '';
  gaps: SkillGap[] = [];
  filteredGaps: SkillGap[] = [];
  priorityFilter: 'all' | 'high' | 'medium' | 'low' = 'all';

  ngOnInit() {
    // Could load saved analysis if available
  }

  async analyzeGaps() {
    if (!this.targetRole.trim()) return;

    try {
      this.loading = true;
      this.error = '';

      const user = await this.authService.getCurrentUser();

      // TODO: Replace with actual API call
      // this.apiService.analyzeSkillGaps(user.uid, this.targetRole).subscribe({
      //   next: (gaps) => { this.gaps = gaps; this.filterGaps(); },
      //   error: (err) => { this.error = err.message; },
      //   complete: () => { this.loading = false; }
      // });

      // Mock data for now
      await this.delay(2000);
      this.gaps = this.generateMockGaps();
      this.filterGaps();

    } catch (err: any) {
      this.error = err.message || 'Failed to analyze skill gaps';
    } finally {
      this.loading = false;
    }
  }

  filterGaps() {
    if (this.priorityFilter === 'all') {
      this.filteredGaps = [...this.gaps];
    } else {
      this.filteredGaps = this.gaps.filter(g => g.priority === this.priorityFilter);
    }
  }

  countByPriority(priority: 'high' | 'medium' | 'low'): number {
    return this.gaps.filter(g => g.priority === priority).length;
  }

  exportGaps() {
    // TODO: Implement PDF export
    console.log('Exporting gaps as PDF...');
    alert('PDF export coming soon!');
  }

  private generateMockGaps(): SkillGap[] {
    return [
      {
        skill: 'Kubernetes',
        category: 'DevOps',
        priority: 'high',
        estimatedLearningTime: '2-3 months',
        resources: ['Kubernetes Official Docs', 'CKA Certification', 'Hands-on Labs']
      },
      {
        skill: 'GraphQL',
        category: 'Backend',
        priority: 'high',
        estimatedLearningTime: '3-4 weeks',
        resources: ['Apollo GraphQL Tutorial', 'GraphQL Best Practices']
      },
      {
        skill: 'Redis',
        category: 'Database',
        priority: 'medium',
        estimatedLearningTime: '2-3 weeks',
        resources: ['Redis University', 'Caching Patterns']
      },
      {
        skill: 'Terraform',
        category: 'Infrastructure',
        priority: 'medium',
        estimatedLearningTime: '4-6 weeks',
        resources: ['HashiCorp Learn', 'Terraform Up & Running Book']
      },
      {
        skill: 'Microservices Architecture',
        category: 'Architecture',
        priority: 'high',
        estimatedLearningTime: '2-3 months',
        resources: ['Microservices Patterns', 'Building Microservices Book']
      },
      {
        skill: 'CI/CD Pipelines',
        category: 'DevOps',
        priority: 'low',
        estimatedLearningTime: '2-3 weeks',
        resources: ['GitHub Actions', 'GitLab CI/CD']
      },
    ];
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
