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
    <div class="dashboard-screen">
      <section class="dashboard-hero glass-panel">
        <div class="dashboard-hero__content">
          <span class="badge">Overview</span>
          <h1>Welcome back to SkillSense</h1>
          <p class="hero-copy">
            Keep an eye on your evolving capabilities and decide your next strategic move in seconds.
          </p>
          <div class="hero-metrics">
            <div class="hero-metric">
              <span class="hero-metric__label">Average confidence</span>
              <strong>{{ stats.confidenceAverage }}%</strong>
            </div>
            <div class="hero-metric">
              <span class="hero-metric__label">Active skills</span>
              <strong>{{ stats.totalSkills }}</strong>
            </div>
          </div>
        </div>
        <div class="dashboard-hero__actions">
          <a [routerLink]="['/upload']" class="btn btn-primary">Upload new evidence</a>
          <button (click)="logout()" class="btn btn-ghost">Logout</button>
        </div>
      </section>

      @if (loading) {
        <div class="dashboard-loading">
          <div class="loader"></div>
          <div class="loading-text">
            <span class="skeleton-line" style="width: 220px"></span>
            <span class="skeleton-line" style="width: 180px"></span>
          </div>
        </div>
      } @else if (error) {
        <div class="alert alert-error dashboard-alert">
          <div>
            <strong>We could not refresh your insights.</strong>
            <p>{{ error }}</p>
          </div>
          <button class="btn btn-secondary" type="button" (click)="loadDashboardData()">Try again</button>
        </div>
      } @else {
        <section class="stats-section">
          <article class="stat-card">
            <div class="stat-card__icon">📊</div>
            <div class="stat-card__content">
              <span class="stat-card__label">Total skills tracked</span>
              <strong class="stat-card__value">{{ stats.totalSkills }}</strong>
              <p>Across every connected data source.</p>
            </div>
          </article>

          <article class="stat-card">
            <div class="stat-card__icon">�</div>
            <div class="stat-card__content">
              <span class="stat-card__label">Sources analyzed</span>
              <strong class="stat-card__value">{{ stats.profilesAnalyzed }}</strong>
              <p>CVs, repositories, and professional profiles.</p>
            </div>
          </article>

          <article class="stat-card">
            <div class="stat-card__icon">🎯</div>
            <div class="stat-card__content">
              <span class="stat-card__label">Skill gaps detected</span>
              <strong class="stat-card__value">{{ stats.gapsIdentified }}</strong>
              <p>High-impact areas to focus your next sprint.</p>
            </div>
          </article>

          <article class="stat-card">
            <div class="stat-card__icon">✨</div>
            <div class="stat-card__content">
              <span class="stat-card__label">Confidence momentum</span>
              <strong class="stat-card__value">{{ stats.confidenceAverage }}%</strong>
              <p>Measured from verified occurrences this month.</p>
            </div>
          </article>
        </section>

        <section class="actions-section surface-card">
          <header class="section-header">
            <div>
              <h2>Do more with your profile</h2>
              <p class="text-subtle">Select a workspace to drill deeper or create new deliverables.</p>
            </div>
          </header>
          <div class="action-grid">
            <a [routerLink]="['/profile']" class="action-card">
              <span class="action-card__icon">�</span>
              <div>
                <h3>Review your profile</h3>
                <p>Explore confidence scores & supporting evidence.</p>
              </div>
            </a>
            <a [routerLink]="['/gaps']" class="action-card">
              <span class="action-card__icon">�</span>
              <div>
                <h3>Analyze skill gaps</h3>
                <p>Map target roles and pinpoint what to work on next.</p>
              </div>
            </a>
            <a [routerLink]="['/recommendations']" class="action-card">
              <span class="action-card__icon">�</span>
              <div>
                <h3>Get learning nudges</h3>
                <p>Receive curated courses and projects tailored to you.</p>
              </div>
            </a>
            <a [routerLink]="['/cv-generator']" class="action-card">
              <span class="action-card__icon">�</span>
              <div>
                <h3>Generate a CV</h3>
                <p>Produce role-specific CVs with compelling narratives.</p>
              </div>
            </a>
            <a [routerLink]="['/role-matcher']" class="action-card">
              <span class="action-card__icon">🎯</span>
              <div>
                <h3>Match to open roles</h3>
                <p>See where you already shine and where to iterate.</p>
              </div>
            </a>
            <a [routerLink]="['/learning-paths']" class="action-card">
              <span class="action-card__icon">🎓</span>
              <div>
                <h3>Build learning paths</h3>
                <p>Design sustainable progression plans with milestones.</p>
              </div>
            </a>
            <a [routerLink]="['/trends']" class="action-card">
              <span class="action-card__icon">📈</span>
              <div>
                <h3>Watch market signals</h3>
                <p>Stay alert to rising and fading competencies.</p>
              </div>
            </a>
            <a [routerLink]="['/upload']" class="action-card">
              <span class="action-card__icon">📄</span>
              <div>
                <h3>Upload another CV</h3>
                <p>Feed fresh experiences to keep insights relevant.</p>
              </div>
            </a>
          </div>
        </section>

        <section class="insights surface-card">
          <header class="section-header">
            <div>
              <h2>Focus suggestions</h2>
              <p class="text-subtle">Use these prompts to keep momentum between check-ins.</p>
            </div>
          </header>
          <div class="insight-grid">
            <article class="insight-card">
              <span class="insight-card__badge">Verification tip</span>
              <h3>Strengthen evidence for emerging skills</h3>
              <p>Revisit recent project notes or repositories to tag achievements that support your confidence score.</p>
            </article>
            <article class="insight-card">
              <span class="insight-card__badge">Opportunity</span>
              <h3>Create a quick learning sprint</h3>
              <p>Pick a high-demand skill from gaps and add a 14-day learning plan in the Learning Paths workspace.</p>
            </article>
            <article class="insight-card">
              <span class="insight-card__badge">Signal</span>
              <h3>Share your profile snapshot</h3>
              <p>Export the latest CV draft and send it to a mentor or teammate for feedback on positioning.</p>
            </article>
          </div>
        </section>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .dashboard-screen {
      display: grid;
      gap: 28px;
      padding: 12px 0 48px;
    }

    .dashboard-hero {
      display: grid;
      grid-template-columns: 1.3fr auto;
      gap: 32px;
      padding: 40px 44px;
      position: relative;
      overflow: hidden;
    }

    .dashboard-hero::after {
      content: '';
      position: absolute;
      width: 260px;
      height: 260px;
      right: -40px;
      bottom: -60px;
      background: radial-gradient(circle, rgba(99, 102, 241, 0.42) 0, rgba(99, 102, 241, 0));
      filter: blur(10px);
    }

    .dashboard-hero__content {
      position: relative;
      z-index: 1;
      display: grid;
      gap: 18px;
    }

    .dashboard-hero__content h1 {
      margin: 0;
      font-size: clamp(2rem, 2.6vw, 2.8rem);
      line-height: 1.1;
    }

    .hero-copy {
      margin: 0;
      color: var(--color-text-muted);
      max-width: 520px;
    }

    .hero-metrics {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 18px;
      margin-top: 12px;
    }

    .hero-metric {
      background: rgba(15, 23, 42, 0.55);
      border: 1px solid rgba(148, 163, 184, 0.22);
      border-radius: var(--radius);
      padding: 18px 20px;
      display: grid;
      gap: 6px;
    }

    .hero-metric__label {
      color: var(--color-text-subtle);
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .hero-metric strong {
      font-size: 1.8rem;
      font-weight: 700;
    }

    .dashboard-hero__actions {
      display: flex;
      flex-direction: column;
      gap: 14px;
      justify-content: center;
      align-items: flex-end;
    }

    .dashboard-loading {
      display: flex;
      align-items: center;
      gap: 24px;
      padding: 46px;
      border-radius: var(--radius);
      border: 1px solid rgba(148, 163, 184, 0.18);
      background: rgba(15, 23, 42, 0.45);
      min-height: 180px;
    }

    .loader {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      border: 4px solid rgba(148, 163, 184, 0.18);
      border-top-color: rgba(99, 102, 241, 0.75);
      animation: spin 1s linear infinite;
    }

    .loading-text {
      display: grid;
      gap: 12px;
      width: 100%;
      max-width: 280px;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    .dashboard-alert {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 18px;
    }

    .dashboard-alert p {
      margin: 6px 0 0;
      color: var(--color-text-muted);
      font-size: 0.9rem;
    }

    .stats-section {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 20px;
    }

    .stat-card {
      position: relative;
      overflow: hidden;
      padding: 28px 26px;
      border-radius: var(--radius);
      border: 1px solid rgba(148, 163, 184, 0.2);
      background: linear-gradient(130deg, rgba(99, 102, 241, 0.28), rgba(15, 23, 42, 0.75));
      box-shadow: var(--shadow-sm);
      display: grid;
      gap: 12px;
    }

    .stat-card::after {
      content: '';
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at top right, rgba(148, 163, 184, 0.18), transparent 55%);
      opacity: 0.9;
    }

    .stat-card__icon {
      font-size: 28px;
      z-index: 1;
    }

    .stat-card__content {
      z-index: 1;
      display: grid;
      gap: 6px;
    }

    .stat-card__label {
      font-size: 0.85rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: rgba(226, 232, 240, 0.78);
    }

    .stat-card__value {
      font-size: 2rem;
      font-weight: 700;
    }

    .stat-card__content p {
      margin: 0;
      color: rgba(226, 232, 240, 0.75);
      font-size: 0.9rem;
    }

    .actions-section {
      display: grid;
      gap: 24px;
    }

    .section-header h2 {
      margin: 0;
      font-size: 1.6rem;
    }

    .section-header p {
      margin: 4px 0 0;
    }

    .action-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 16px;
    }

    .action-card {
      display: flex;
      gap: 16px;
      padding: 20px;
      border-radius: var(--radius);
      border: 1px solid rgba(148, 163, 184, 0.16);
      background: rgba(15, 23, 42, 0.6);
      transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease;
      color: inherit;
    }

    .action-card:hover {
      transform: translateY(-4px);
      border-color: rgba(99, 102, 241, 0.45);
      background: rgba(15, 23, 42, 0.74);
    }

    .action-card__icon {
      font-size: 26px;
      line-height: 1;
    }

    .action-card h3 {
      margin: 0 0 6px;
      font-size: 1.1rem;
    }

    .action-card p {
      margin: 0;
      color: var(--color-text-muted);
      font-size: 0.9rem;
    }

    .insights {
      display: grid;
      gap: 24px;
    }

    .insight-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 18px;
    }

    .insight-card {
      padding: 24px;
      border-radius: var(--radius);
      border: 1px solid rgba(148, 163, 184, 0.16);
      background: rgba(15, 23, 42, 0.6);
      display: grid;
      gap: 12px;
    }

    .insight-card__badge {
      font-size: 0.72rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--color-text-subtle);
    }

    .insight-card h3 {
      margin: 0;
      font-size: 1.1rem;
    }

    .insight-card p {
      margin: 0;
      color: var(--color-text-muted);
      font-size: 0.9rem;
    }

    @media (max-width: 960px) {
      .dashboard-hero {
        grid-template-columns: 1fr;
        padding: 34px 30px;
      }

      .dashboard-hero__actions {
        flex-direction: row;
        align-items: center;
        justify-content: flex-start;
      }
    }

    @media (max-width: 640px) {
      .dashboard-screen {
        gap: 22px;
      }

      .dashboard-hero {
        padding: 26px 22px;
      }

      .dashboard-hero__actions {
        flex-direction: column;
        align-items: stretch;
      }

      .action-card {
        flex-direction: column;
      }
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
            console.warn('No profile found for user, showing empty dashboard');
            this.error = 'Profile not found. Your profile may still be loading. Please refresh the page.';
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

          // Handle 404 - profile not found
          if (err.status === 404) {
            this.error = 'Profile not found. Your profile may still be loading. Please refresh the page in a moment.';
            this.stats = {
              totalSkills: 0,
              profilesAnalyzed: 0,
              gapsIdentified: 0,
              confidenceAverage: 0
            };
          } else {
            this.error = err.message || 'Failed to load dashboard data. Please try again.';
          }
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
