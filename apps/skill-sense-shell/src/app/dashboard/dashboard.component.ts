import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ApiService } from '../services/api.service';

interface DashboardStats {
  totalSkills: number;
  profilesAnalyzed: number;
  gapsIdentified: number;
  confidenceAverage: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="dashboard-container">
      <header class="dashboard-header">
        <h1>Welcome to SkillSense</h1>
        <button (click)="logout()" class="btn btn-secondary">Logout</button>
      </header>

      @if (loading) {
        <div class="loading">
          <div class="spinner"></div>
          <p>Loading your dashboard...</p>
        </div>
      } @else if (error) {
        <div class="alert alert-error">{{ error }}</div>
      } @else {
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">📊</div>
            <div class="stat-value">{{ stats.totalSkills }}</div>
            <div class="stat-label">Total Skills</div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">📁</div>
            <div class="stat-value">{{ stats.profilesAnalyzed }}</div>
            <div class="stat-label">Sources Analyzed</div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">🎯</div>
            <div class="stat-value">{{ stats.gapsIdentified }}</div>
            <div class="stat-label">Skill Gaps</div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">✨</div>
            <div class="stat-value">{{ stats.confidenceAverage }}%</div>
            <div class="stat-label">Avg Confidence</div>
          </div>
        </div>

        <div class="action-grid">
          <a [routerLink]="['/upload']" class="action-card">
            <div class="action-icon">📄</div>
            <h3>Upload CV</h3>
            <p>Extract skills from your resume</p>
          </a>

          <a [routerLink]="['/profile']" class="action-card">
            <div class="action-icon">👤</div>
            <h3>View Profile</h3>
            <p>See your complete skill profile</p>
          </a>

          <a [routerLink]="['/gaps']" class="action-card">
            <div class="action-icon">🔍</div>
            <h3>Analyze Gaps</h3>
            <p>Find skill gaps for target roles</p>
          </a>

          <a [routerLink]="['/recommendations']" class="action-card">
            <div class="action-icon">💡</div>
            <h3>Get Recommendations</h3>
            <p>Discover new skills to learn</p>
          </a>

          <a [routerLink]="['/trends']" class="action-card">
            <div class="action-icon">📈</div>
            <h3>Market Trends</h3>
            <p>Track skill demand and insights</p>
          </a>

          <a [routerLink]="['/cv-generator']" class="action-card">
            <div class="action-icon">📝</div>
            <h3>Generate CV</h3>
            <p>AI-powered resume builder</p>
          </a>

          <a [routerLink]="['/role-matcher']" class="action-card">
            <div class="action-icon">🎯</div>
            <h3>Match Roles</h3>
            <p>Find jobs that fit your skills</p>
          </a>

          <a [routerLink]="['/learning-paths']" class="action-card">
            <div class="action-icon">🎓</div>
            <h3>Learning Paths</h3>
            <p>Personalized skill roadmaps</p>
          </a>
        </div>
      }
    </div>
  `,
  styles: [`
    .dashboard-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }

    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 40px;
    }

    .dashboard-header h1 {
      margin: 0;
      color: #333;
      font-size: 32px;
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

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }

    .stat-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 12px;
      text-align: center;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .stat-icon {
      font-size: 48px;
      margin-bottom: 15px;
    }

    .stat-value {
      font-size: 36px;
      font-weight: bold;
      margin-bottom: 5px;
    }

    .stat-label {
      font-size: 14px;
      opacity: 0.9;
    }

    .action-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
    }

    .action-card {
      background: white;
      padding: 30px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      text-align: center;
      text-decoration: none;
      color: inherit;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .action-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
    }

    .action-icon {
      font-size: 48px;
      margin-bottom: 15px;
    }

    .action-card h3 {
      margin: 0 0 10px 0;
      color: #333;
      font-size: 20px;
    }

    .action-card p {
      margin: 0;
      color: #666;
      font-size: 14px;
    }

    .alert-error {
      background: #fee;
      color: #c33;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
    }

    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: background 0.2s;
    }

    .btn-secondary {
      background: #6c757d;
      color: white;
    }

    .btn-secondary:hover {
      background: #5a6268;
    }
  `]
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private apiService = inject(ApiService);
  private router = inject(Router);

  loading = true;
  error = '';
  stats: DashboardStats = {
    totalSkills: 0,
    profilesAnalyzed: 0,
    gapsIdentified: 0,
    confidenceAverage: 0
  };

  ngOnInit() {
    this.loadDashboardData();
  }

  async loadDashboardData() {
    try {
      this.loading = true;
      this.error = '';

      const userId = await this.authService.getUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      this.apiService.getProfile(userId).subscribe({
        next: (profile) => {
          // Handle null or missing profile gracefully
          if (!profile) {
            console.warn('No profile found for user, using default values');
            this.stats = {
              totalSkills: 0,
              profilesAnalyzed: 0,
              gapsIdentified: 0,
              confidenceAverage: 0
            };
            this.loading = false;
            return;
          }

          const skills = profile.skills || [];
          this.stats = {
            totalSkills: skills.length,
            profilesAnalyzed: 1, // Current user profile
            gapsIdentified: skills.filter((s: any) => s.confidence < 70).length,
            confidenceAverage: skills.length > 0
              ? Math.round(skills.reduce((sum: number, s: any) => sum + (s.confidence || 0), 0) / skills.length)
              : 0
          };
          this.loading = false;
        },
        error: (err) => {
          console.error('Failed to load dashboard data:', err);
          this.error = err.message || 'Failed to load dashboard data';
          this.loading = false;
        }
      });

    } catch (err: any) {
      this.error = err.message || 'Failed to load dashboard data';
      this.loading = false;
    }
  }

  async logout() {
    try {
      await this.authService.logout();
      this.router.navigate(['/login']);
    } catch (err: any) {
      this.error = err.message || 'Failed to logout';
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
