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
            <a [routerLink]="['/integrations']" class="action-card">
              <span class="action-card__icon">🔗</span>
              <div>
                <h3>Connect data sources</h3>
                <p>Link LinkedIn, GitHub & more to enrich your profile.</p>
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

        <section class="networking surface-card">
          <header class="section-header">
            <div>
              <h2>🤝 Similar Profiles for Networking</h2>
              <p class="text-subtle">Connect with professionals who share similar skills and interests</p>
            </div>
            <button (click)="loadSimilarProfiles()" [disabled]="loadingProfiles" class="btn btn-secondary">
              {{ loadingProfiles ? 'Loading...' : 'Find Connections' }}
            </button>
          </header>

          @if (loadingProfiles) {
            <div class="profiles-loading">
              <div class="loader"></div>
              <p>Finding similar profiles using AI vector search...</p>
            </div>
          } @else if (profilesError) {
            <div class="alert alert-error">
              <strong>Error:</strong> {{ profilesError }}
            </div>
          } @else if (similarProfiles.length > 0) {
            <div class="profiles-grid">
              @for (profile of similarProfiles; track profile.userId) {
                <article class="profile-card">
                  <div class="profile-card__header">
                    <div class="profile-avatar">
                      @if (profile.profilePicture) {
                        <img [src]="profile.profilePicture" [alt]="profile.name">
                      } @else {
                        <span class="profile-avatar-placeholder">{{ getInitials(profile.name) }}</span>
                      }
                    </div>
                    <div class="profile-card__info">
                      <h3>{{ profile.name }}</h3>
                      <p class="profile-title">{{ profile.title }}</p>
                      @if (profile.location) {
                        <p class="profile-location">📍 {{ profile.location }}</p>
                      }
                    </div>
                    <div class="similarity-badge">
                      <span class="similarity-score">{{ profile.similarityScore }}%</span>
                      <span class="similarity-label">match</span>
                    </div>
                  </div>
                  <div class="profile-card__skills">
                    <h4>Matching Skills</h4>
                    <div class="skill-tags">
                      @for (skill of profile.matchingSkills.slice(0, 5); track skill) {
                        <span class="skill-tag">{{ skill }}</span>
                      }
                      @if (profile.matchingSkills.length > 5) {
                        <span class="skill-tag-more">+{{ profile.matchingSkills.length - 5 }} more</span>
                      }
                    </div>
                  </div>
                  <div class="profile-card__actions">
                    <button class="btn btn-sm btn-primary" (click)="viewProfile(profile.userId)">
                      View Profile
                    </button>
                    <button class="btn btn-sm btn-ghost" (click)="connectWithProfile(profile)">
                      Connect
                    </button>
                  </div>
                </article>
              }
            </div>
          } @else {
            <div class="empty-state">
              <span class="empty-state__icon">🔍</span>
              <h3>Discover connections</h3>
              <p>Click "Find Connections" to discover professionals with similar skills using AI-powered vector search</p>
            </div>
          }
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
      gap: 32px;
      padding: 16px 0 64px;
    }

    .dashboard-hero {
      display: grid;
      grid-template-columns: 1.3fr auto;
      gap: 40px;
      padding: 48px 56px;
      position: relative;
      overflow: hidden;
    }

    .dashboard-hero::after {
      content: '';
      position: absolute;
      width: 400px;
      height: 400px;
      right: -80px;
      bottom: -80px;
      background: radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, transparent 70%);
      filter: blur(60px);
      pointer-events: none;
    }

    .dashboard-hero__content {
      position: relative;
      z-index: 1;
      display: grid;
      gap: 20px;
    }

    .dashboard-hero__content h1 {
      margin: 0;
      font-size: clamp(2.25rem, 3vw, 3rem);
      font-weight: 800;
      line-height: 1.1;
      letter-spacing: -0.02em;
      background: linear-gradient(135deg, var(--color-text-strong) 0%, var(--color-text) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .hero-copy {
      margin: 0;
      color: var(--color-text-muted);
      max-width: 540px;
      font-size: 1.0625rem;
      line-height: 1.7;
      font-weight: 500;
    }

    .hero-metrics {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
      gap: 16px;
      margin-top: 8px;
    }

    .hero-metric {
      background: rgba(17, 24, 39, 0.6);
      border: 1px solid var(--color-border-strong);
      border-radius: var(--radius);
      padding: 18px 22px;
      display: grid;
      gap: 8px;
      transition: all 0.3s ease;
    }

    .hero-metric:hover {
      background: rgba(31, 41, 55, 0.7);
      border-color: rgba(99, 102, 241, 0.3);
      transform: translateY(-2px);
    }

    .hero-metric__label {
      color: var(--color-text-muted);
      font-size: 0.8125rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      font-weight: 700;
    }

    .hero-metric strong {
      font-size: 1.875rem;
      font-weight: 800;
      color: var(--color-text-strong);
      letter-spacing: -0.01em;
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
      gap: 28px;
      padding: 48px;
      border-radius: var(--radius-md);
      border: 1px solid var(--color-border-strong);
      background: var(--color-surface-alt);
      min-height: 200px;
    }

    .loader {
      width: 52px;
      height: 52px;
      border-radius: 50%;
      border: 4px solid rgba(99, 102, 241, 0.12);
      border-top-color: var(--color-primary);
      animation: spin 0.8s linear infinite;
    }

    .loading-text {
      display: grid;
      gap: 14px;
      width: 100%;
      max-width: 300px;
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
      gap: 20px;
    }

    .dashboard-alert p {
      margin: 8px 0 0;
      color: var(--color-text-muted);
      font-size: 0.9375rem;
      font-weight: 500;
    }

    .stats-section {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 20px;
    }

    .stat-card {
      position: relative;
      overflow: hidden;
      padding: 30px 28px;
      border-radius: var(--radius-md);
      border: 1px solid var(--color-border-strong);
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, var(--color-surface-alt) 60%);
      box-shadow: var(--shadow-md);
      display: grid;
      gap: 14px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .stat-card:hover {
      border-color: rgba(99, 102, 241, 0.35);
      transform: translateY(-4px);
      box-shadow: var(--shadow-lg), var(--shadow-glow);
    }

    .stat-card::after {
      content: '';
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at top right, rgba(99, 102, 241, 0.12), transparent 60%);
      opacity: 0.8;
      pointer-events: none;
    }

    .stat-card__icon {
      font-size: 32px;
      z-index: 1;
      filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3));
    }

    .stat-card__content {
      z-index: 1;
      display: grid;
      gap: 8px;
    }

    .stat-card__label {
      font-size: 0.8125rem;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--color-text-muted);
      font-weight: 700;
    }

    .stat-card__value {
      font-size: 2.25rem;
      font-weight: 800;
      color: var(--color-text-strong);
      letter-spacing: -0.02em;
    }

    .stat-card__content p {
      margin: 0;
      color: var(--color-text-muted);
      font-size: 0.9375rem;
      line-height: 1.6;
    }

    .actions-section {
      display: grid;
      gap: 28px;
    }

    .section-header h2 {
      margin: 0;
      font-size: 1.75rem;
      font-weight: 700;
      letter-spacing: -0.01em;
      color: var(--color-text-strong);
    }

    .section-header p {
      margin: 8px 0 0;
      color: var(--color-text-muted);
      font-size: 0.9375rem;
    }

    .action-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 18px;
    }

    .action-card {
      display: flex;
      gap: 18px;
      padding: 24px;
      border-radius: var(--radius-md);
      border: 1px solid var(--color-border-strong);
      background: var(--color-surface-alt);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      color: inherit;
      position: relative;
      overflow: hidden;
    }

    .action-card::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 3px;
      background: linear-gradient(180deg, var(--color-primary), var(--color-primary-light));
      transform: scaleY(0);
      transform-origin: top;
      transition: transform 0.3s ease;
    }

    .action-card:hover {
      transform: translateY(-4px);
      border-color: rgba(99, 102, 241, 0.4);
      background: var(--color-surface-hover);
      box-shadow: var(--shadow-lg), var(--shadow-glow);
    }

    .action-card:hover::before {
      transform: scaleY(1);
    }

    .action-card__icon {
      font-size: 28px;
      line-height: 1;
      filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.2));
    }

    .action-card h3 {
      margin: 0 0 8px;
      font-size: 1.125rem;
      font-weight: 700;
      letter-spacing: -0.01em;
      color: var(--color-text-strong);
    }

    .action-card p {
      margin: 0;
      color: var(--color-text-muted);
      font-size: 0.9375rem;
      line-height: 1.6;
    }

    .insights {
      display: grid;
      gap: 28px;
    }

    .insight-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 20px;
    }

    .insight-card {
      padding: 26px;
      border-radius: var(--radius-md);
      border: 1px solid var(--color-border-strong);
      background: var(--color-surface-alt);
      display: grid;
      gap: 14px;
      transition: all 0.3s ease;
    }

    .insight-card:hover {
      border-color: rgba(99, 102, 241, 0.3);
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }

    .insight-card__badge {
      font-size: 0.6875rem;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--color-text-subtle);
      font-weight: 700;
    }

    .insight-card h3 {
      margin: 0;
      font-size: 1.125rem;
      font-weight: 700;
      letter-spacing: -0.01em;
      color: var(--color-text-strong);
    }

    .insight-card p {
      margin: 0;
      color: var(--color-text-muted);
      font-size: 0.9375rem;
      line-height: 1.6;
    }

    /* Networking Section */
    .networking {
      display: grid;
      gap: 28px;
    }

    .profiles-loading {
      text-align: center;
      padding: 48px 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }

    .profiles-loading p {
      color: var(--color-text-muted);
      font-size: 0.9375rem;
    }

    .profiles-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 20px;
    }

    .profile-card {
      padding: 24px;
      border-radius: var(--radius-md);
      border: 1px solid var(--color-border-strong);
      background: var(--color-surface-alt);
      display: flex;
      flex-direction: column;
      gap: 20px;
      transition: all 0.3s ease;
    }

    .profile-card:hover {
      border-color: rgba(99, 102, 241, 0.4);
      transform: translateY(-3px);
      box-shadow: var(--shadow-lg);
    }

    .profile-card__header {
      display: flex;
      gap: 16px;
      align-items: flex-start;
    }

    .profile-avatar {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      overflow: hidden;
      flex-shrink: 0;
    }

    .profile-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .profile-avatar-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      color: white;
      font-weight: 700;
      font-size: 1.25rem;
    }

    .profile-card__info {
      flex: 1;
      min-width: 0;
    }

    .profile-card__info h3 {
      margin: 0 0 4px 0;
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--color-text-strong);
    }

    .profile-title {
      margin: 0 0 4px 0;
      color: var(--color-text-muted);
      font-size: 0.9375rem;
    }

    .profile-location {
      margin: 0;
      color: var(--color-text-subtle);
      font-size: 0.8125rem;
    }

    .similarity-badge {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 8px 12px;
      background: rgba(99, 102, 241, 0.1);
      border: 1px solid rgba(99, 102, 241, 0.3);
      border-radius: var(--radius);
    }

    .similarity-score {
      font-size: 1.5rem;
      font-weight: 800;
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .similarity-label {
      font-size: 0.75rem;
      color: var(--color-text-subtle);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .profile-card__skills h4 {
      margin: 0 0 12px 0;
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--color-text);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .skill-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .skill-tag {
      display: inline-block;
      padding: 6px 12px;
      background: rgba(99, 102, 241, 0.15);
      border: 1px solid rgba(99, 102, 241, 0.3);
      border-radius: var(--radius-sm);
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--color-text);
    }

    .skill-tag-more {
      display: inline-block;
      padding: 6px 12px;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--color-text-subtle);
    }

    .profile-card__actions {
      display: flex;
      gap: 12px;
      padding-top: 8px;
      border-top: 1px solid var(--color-border);
    }

    .empty-state {
      text-align: center;
      padding: 64px 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }

    .empty-state__icon {
      font-size: 3rem;
      opacity: 0.5;
    }

    .empty-state h3 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--color-text);
    }

    .empty-state p {
      margin: 0;
      color: var(--color-text-muted);
      max-width: 400px;
    }

    @media (max-width: 960px) {
      .dashboard-hero {
        grid-template-columns: 1fr;
        padding: 40px 32px;
      }

      .dashboard-hero__actions {
        flex-direction: row;
        align-items: center;
        justify-content: flex-start;
      }

      .stats-section {
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      }

      .profiles-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 640px) {
      .dashboard-screen {
        gap: 24px;
      }

      .dashboard-hero {
        padding: 32px 24px;
      }

      .dashboard-hero__content h1 {
        font-size: 2rem;
      }

      .dashboard-hero__actions {
        flex-direction: column;
        align-items: stretch;
      }

      .hero-metrics {
        grid-template-columns: 1fr;
      }

      .stats-section {
        grid-template-columns: 1fr;
      }

      .action-grid,
      .insight-grid {
        grid-template-columns: 1fr;
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

  // Networking
  loadingProfiles = false;
  profilesError = '';
  similarProfiles: any[] = [];

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
            gapsIdentified: skills.filter((s: any) => s.confidence < 0.7).length, // Fixed: confidence is 0.0-1.0
            confidenceAverage: skills.length > 0
              ? Math.round((skills.reduce((sum: number, s: any) => sum + (s.confidence || 0), 0) / skills.length) * 100)
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

  async loadSimilarProfiles() {
    try {
      this.loadingProfiles = true;
      this.profilesError = '';

      const userId = await this.authService.getUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      this.apiService.findSimilarProfiles(userId, 10).subscribe({
        next: (profiles) => {
          this.similarProfiles = profiles;
          this.loadingProfiles = false;
        },
        error: (err) => {
          console.error('Failed to load similar profiles:', err);
          this.profilesError = err.message || 'Failed to load similar profiles';
          this.loadingProfiles = false;
        }
      });
    } catch (err: any) {
      this.profilesError = err.message || 'Failed to load similar profiles';
      this.loadingProfiles = false;
    }
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  viewProfile(userId: string) {
    this.router.navigate(['/profile', userId]);
  }

  connectWithProfile(profile: any) {
    // In a real app, this would send a connection request
    alert(`Connection request sent to ${profile.name}!`);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
