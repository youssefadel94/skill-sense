import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { firstValueFrom } from 'rxjs';

interface CvSummary {
  fileName: string;
  gcsUri: string;
  uploadedAt: string;
  skillsExtracted?: number;
}

interface SkillOverview {
  id: string;
  name: string;
  category: string;
  confidence: number;
  verified: boolean;
  occurrences: number;
  evidenceCount: number;
}

interface ProfileOverview {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  skillCount: number;
  sourcesConnected: number;
  cvs: CvSummary[];
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="profile-screen">
      <header class="profile-top">
        <a [routerLink]="['/dashboard']" class="btn btn-ghost">← Back to dashboard</a>
      </header>

      @if (loading) {
        <div class="profile-loading glass-panel">
          <div class="spinner"></div>
          <div class="loading-copy">
            <span class="skeleton-line" style="width: 260px"></span>
            <span class="skeleton-line" style="width: 180px"></span>
          </div>
        </div>
      } @else if (error) {
        <div class="alert alert-error profile-alert">{{ error }}</div>
      } @else {
        <section class="profile-hero glass-panel">
          <div class="profile-hero__content">
            <span class="badge">Skill profile</span>
            <h1>{{ profile.name }}</h1>
            <p class="profile-hero__email">{{ profile.email }}</p>
            <div class="profile-hero__chips">
              <span class="pill">{{ profile.skillCount }} skills</span>
              <span class="pill">{{ profile.sourcesConnected }} sources</span>
              @if (profile.cvs && profile.cvs.length > 0) {
                <span class="pill">{{ profile.cvs.length }} CV{{ profile.cvs.length > 1 ? 's' : '' }}</span>
              }
            </div>
          </div>
          <div class="profile-hero__actions">
            <a [routerLink]="['/upload']" class="btn btn-primary">Upload new CV</a>
            <a [routerLink]="['/dashboard']" class="btn btn-ghost">View dashboard</a>
          </div>
        </section>

        @if (profile.cvs && profile.cvs.length > 0) {
          <section class="cvs-section surface-card">
            <header class="section-header">
              <div>
                <h2>Uploaded CVs</h2>
                <p class="text-subtle">Keep them fresh to improve extraction accuracy.</p>
              </div>
              <a [routerLink]="['/upload']" class="btn btn-secondary">+ Upload another</a>
            </header>
            <div class="cvs-grid">
              @for (cv of profile.cvs; track cv.gcsUri) {
                <article class="cv-card">
                  <div class="cv-card__icon">📄</div>
                  <div class="cv-card__body">
                    <div class="cv-card__header">
                      <h3>{{ cv.fileName }}</h3>
                      <span class="chip">{{ getFileExtension(cv.fileName) }}</span>
                    </div>
                    <div class="cv-card__meta">
                      <span class="meta-item">
                        <span class="meta-icon">📅</span>
                        Uploaded {{ formatDate(cv.uploadedAt) }}
                      </span>
                      <span class="meta-item">
                        <span class="meta-icon">✨</span>
                        {{ cv.skillsExtracted || 0 }} skills extracted
                      </span>
                    </div>
                  </div>
                  <div class="cv-card__actions">
                    <button
                      (click)="downloadCV(cv)"
                      class="btn-icon"
                      title="Download CV"
                      [disabled]="downloadingCv === cv.gcsUri"
                    >
                      @if (downloadingCv === cv.gcsUri) {
                        <span class="spinner-small"></span>
                      } @else {
                        📥
                      }
                    </button>
                    <button
                      (click)="viewCVDetails(cv)"
                      class="btn-icon"
                      title="View details"
                    >
                      👁️
                    </button>
                    <button
                      (click)="deleteCV(cv)"
                      class="btn-icon btn-danger"
                      title="Delete CV"
                      [disabled]="deletingCv === cv.gcsUri"
                    >
                      @if (deletingCv === cv.gcsUri) {
                        <span class="spinner-small"></span>
                      } @else {
                        🗑️
                      }
                    </button>
                  </div>
                </article>
              }
            </div>
          </section>
        }

        <section class="skills-section surface-card">
          <header class="section-header">
            <div>
              <h2>Skills ({{ skills.length }})</h2>
              <p class="text-subtle">Confidence reflects evidence-rich occurrences across sources.</p>
            </div>
            <div class="filters">
              <label class="input-label" for="categorySelect">Category</label>
              <select
                id="categorySelect"
                [(ngModel)]="categoryFilter"
                (change)="filterSkills()"
                class="input-control"
              >
                <option value="">All categories</option>
                @for (cat of categories; track cat) {
                  <option [value]="cat">{{ cat }}</option>
                }
              </select>
            </div>
          </header>

          @if (filteredSkills.length === 0) {
            <div class="empty-state">
              <h3>No skills yet</h3>
              <p>Upload a CV or connect a source to start building your portfolio.</p>
              <a [routerLink]="['/upload']" class="btn btn-primary">Upload a CV</a>
            </div>
          } @else {
            <div class="skills-grid">
              @for (skill of filteredSkills; track skill.id) {
                <article class="skill-card" [class.verified]="skill.verified">
                  <header class="skill-card__header">
                    <h3>{{ skill.name }}</h3>
                    @if (skill.verified) {
                      <span class="badge badge-verified">Verified</span>
                    }
                  </header>
                  <p class="skill-card__category">{{ skill.category }}</p>
                  <div class="skill-card__stats">
                    <div class="skill-stat">
                      <span class="skill-stat__label">Confidence</span>
                      <div class="confidence">
                        <div class="confidence__bar">
                          <div class="confidence__fill" [style.width.%]="skill.confidence * 100"></div>
                        </div>
                        <span class="skill-stat__value">{{ (skill.confidence * 100).toFixed(0) }}%</span>
                      </div>
                    </div>
                    <div class="skill-stat">
                      <span class="skill-stat__label">Evidence</span>
                      <span class="skill-stat__value">{{ skill.evidenceCount }} items</span>
                    </div>
                    <div class="skill-stat">
                      <span class="skill-stat__label">Occurrences</span>
                      <span class="skill-stat__value">{{ skill.occurrences }}×</span>
                    </div>
                  </div>
                </article>
              }
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

    .profile-screen {
      display: grid;
      gap: 32px;
      padding: 16px 0 80px;
    }

    .profile-top {
      display: flex;
      justify-content: flex-end;
    }

    .profile-loading {
      display: flex;
      gap: 28px;
      align-items: center;
      padding: 48px;
      border-radius: var(--radius-lg);
    }

    .spinner {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      border: 4px solid rgba(99, 102, 241, 0.12);
      border-top-color: var(--color-primary);
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .loading-copy {
      display: grid;
      gap: 14px;
      width: 100%;
      max-width: 340px;
    }

    .profile-alert {
      border-radius: var(--radius);
    }

    .profile-hero {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 40px;
      padding: 48px 56px;
      position: relative;
      overflow: hidden;
    }

    .profile-hero::after {
      content: '';
      position: absolute;
      width: 400px;
      height: 400px;
      right: -100px;
      bottom: -100px;
      background: radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, transparent 70%);
      filter: blur(60px);
      pointer-events: none;
    }

    .profile-hero__content {
      position: relative;
      z-index: 1;
      display: grid;
      gap: 18px;
    }

    .profile-hero__content h1 {
      margin: 0;
      font-size: clamp(2.25rem, 3vw, 3rem);
      font-weight: 800;
      letter-spacing: -0.02em;
      background: linear-gradient(135deg, var(--color-text-strong) 0%, var(--color-text) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .profile-hero__email {
      margin: 0;
      color: var(--color-text-muted);
      font-size: 1.0625rem;
      font-weight: 500;
    }

    .profile-hero__chips {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 6px;
    }

    .profile-hero__actions {
      display: flex;
      flex-direction: column;
      gap: 14px;
      align-items: flex-end;
      justify-content: center;
    }

    .cvs-section,
    .skills-section {
      display: grid;
      gap: 28px;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      gap: 20px;
      flex-wrap: wrap;
      align-items: flex-start;
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

    .cvs-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 20px;
    }

    .cv-card {
      position: relative;
      display: grid;
      grid-template-columns: auto 1fr auto;
      gap: 20px;
      padding: 26px;
      border-radius: var(--radius-md);
      border: 1px solid var(--color-border-strong);
      background: var(--color-surface-alt);
      overflow: hidden;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .cv-card:hover {
      border-color: rgba(99, 102, 241, 0.35);
      transform: translateY(-2px);
      box-shadow: var(--shadow-lg), var(--shadow-glow);
    }

    .cv-card::after {
      content: '';
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at top right, rgba(99, 102, 241, 0.15), transparent 60%);
      opacity: 0;
      transition: opacity 0.3s ease;
      pointer-events: none;
    }

    .cv-card:hover::after {
      opacity: 1;
    }

    .cv-card__icon {
      font-size: 36px;
      z-index: 1;
      align-self: center;
      filter: grayscale(0.2) drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3));
    }

    .cv-card__body {
      z-index: 1;
      display: grid;
      gap: 14px;
      min-width: 0;
    }

    .cv-card__header {
      display: flex;
      justify-content: space-between;
      gap: 14px;
      align-items: flex-start;
      flex-wrap: wrap;
    }

    .cv-card__header h3 {
      margin: 0;
      font-size: 1.0625rem;
      font-weight: 700;
      color: var(--color-text-strong);
      max-width: 260px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      letter-spacing: -0.01em;
    }

    .chip {
      padding: 5px 14px;
      border-radius: 6px;
      background: rgba(99, 102, 241, 0.12);
      border: 1px solid rgba(99, 102, 241, 0.25);
      color: var(--color-primary-light);
      font-size: 0.6875rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .cv-card__meta {
      display: flex;
      flex-wrap: wrap;
      gap: 14px 20px;
      color: var(--color-text-muted);
      font-size: 0.875rem;
      font-weight: 500;
    }

    .meta-item {
      display: inline-flex;
      gap: 7px;
      align-items: center;
    }

    .meta-icon {
      font-size: 0.9375rem;
    }

    .cv-card__actions {
      z-index: 1;
      display: flex;
      flex-direction: column;
      gap: 11px;
      align-items: center;
    }

    .btn-icon {
      background: rgba(31, 41, 55, 0.6);
      border: 1px solid var(--color-border-strong);
      border-radius: 10px;
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: var(--color-text);
      font-size: 1.125rem;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
    }

    .btn-icon::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.08), transparent);
      opacity: 0;
      transition: opacity 0.25s ease;
    }

    .btn-icon:hover {
      transform: translateY(-3px) scale(1.05);
      background: rgba(99, 102, 241, 0.15);
      border-color: rgba(99, 102, 241, 0.4);
      box-shadow: 0 6px 16px -4px rgba(99, 102, 241, 0.3);
    }

    .btn-icon:hover::before {
      opacity: 1;
    }

    .btn-icon:active {
      transform: translateY(-1px) scale(1.02);
    }

    .btn-icon:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }

    .btn-danger {
      border-color: rgba(239, 68, 68, 0.25);
      background: rgba(239, 68, 68, 0.1);
    }

    .btn-danger:hover {
      background: rgba(239, 68, 68, 0.18);
      border-color: rgba(239, 68, 68, 0.45);
      box-shadow: 0 6px 16px -4px rgba(239, 68, 68, 0.35);
    }

    .spinner-small {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      border: 3px solid rgba(99, 102, 241, 0.15);
      border-top-color: var(--color-primary);
      animation: spin 0.7s linear infinite;
    }

    .filters {
      display: grid;
      gap: 10px;
      min-width: 220px;
    }

    .empty-state {
      text-align: center;
      padding: 56px 28px;
      border: 2px dashed var(--color-border-strong);
      border-radius: var(--radius-md);
      background: rgba(17, 24, 39, 0.4);
      display: grid;
      gap: 16px;
      transition: all 0.3s ease;
    }

    .empty-state:hover {
      border-color: rgba(99, 102, 241, 0.3);
      background: rgba(17, 24, 39, 0.6);
    }

    .empty-state h3 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--color-text-strong);
      letter-spacing: -0.01em;
    }

    .empty-state p {
      margin: 0;
      color: var(--color-text-muted);
      font-size: 1rem;
    }

    .skills-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
    }

    .skill-card {
      position: relative;
      padding: 24px;
      border-radius: var(--radius-md);
      border: 1px solid var(--color-border-strong);
      background: var(--color-surface-alt);
      display: grid;
      gap: 16px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      overflow: hidden;
    }

    .skill-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, var(--color-primary), var(--color-primary-light));
      transform: scaleX(0);
      transform-origin: left;
      transition: transform 0.3s ease;
    }

    .skill-card:hover {
      border-color: rgba(99, 102, 241, 0.4);
      transform: translateY(-4px);
      box-shadow: var(--shadow-lg), var(--shadow-glow);
    }

    .skill-card:hover::before {
      transform: scaleX(1);
    }

    .skill-card.verified {
      border-color: rgba(16, 185, 129, 0.35);
    }

    .skill-card.verified::before {
      background: linear-gradient(90deg, var(--color-positive), var(--color-positive-light));
    }

    .skill-card__header {
      display: flex;
      justify-content: space-between;
      gap: 14px;
      align-items: flex-start;
    }

    .skill-card__header h3 {
      margin: 0;
      font-size: 1.1875rem;
      font-weight: 700;
      letter-spacing: -0.01em;
      color: var(--color-text-strong);
    }

    .skill-card__category {
      margin: 0;
      color: var(--color-text-muted);
      font-size: 0.9375rem;
      font-weight: 600;
    }

    .skill-card__stats {
      display: grid;
      gap: 14px;
    }

    .skill-stat {
      display: grid;
      gap: 8px;
    }

    .skill-stat__label {
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--color-text-subtle);
    }

    .skill-stat__value {
      font-weight: 700;
      font-size: 1rem;
      color: var(--color-text-strong);
    }

    .confidence {
      display: flex;
      gap: 14px;
      align-items: center;
    }

    .confidence__bar {
      flex: 1;
      height: 8px;
      border-radius: 999px;
      background: rgba(99, 102, 241, 0.12);
      overflow: hidden;
      position: relative;
    }

    .confidence__bar::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(90deg, rgba(255, 255, 255, 0.1), transparent);
    }

    .confidence__fill {
      height: 100%;
      background: linear-gradient(90deg, var(--color-primary), var(--color-primary-light));
      border-radius: 999px;
      transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      box-shadow: 0 0 12px rgba(99, 102, 241, 0.4);
    }

    @media (max-width: 960px) {
      .profile-hero {
        grid-template-columns: 1fr;
        padding: 40px;
      }

      .profile-hero__actions {
        flex-direction: row;
        align-items: center;
        justify-content: flex-start;
      }

      .cv-card {
        grid-template-columns: auto 1fr;
      }

      .cv-card__actions {
        flex-direction: row;
        justify-content: flex-end;
      }
    }

    @media (max-width: 640px) {
      .profile-screen {
        gap: 24px;
      }

      .profile-hero {
        padding: 32px 24px;
      }

      .profile-hero__content h1 {
        font-size: 2rem;
      }

      .profile-hero__actions {
        flex-direction: column;
        align-items: stretch;
      }

      .cvs-grid {
        grid-template-columns: 1fr;
      }

      .skills-grid {
        grid-template-columns: 1fr;
      }

      .section-header {
        flex-direction: column;
        gap: 16px;
      }

      .filters {
        width: 100%;
      }
    }

    .storage-uri {
      font-family: 'JetBrains Mono', 'Courier New', monospace;
      background: rgba(17, 24, 39, 0.8);
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 0.8125rem;
      color: var(--color-text-muted);
      border: 1px solid var(--color-border-strong);
    }

    .modal-actions {
      display: flex;
      gap: 14px;
      margin-top: 28px;
      padding-top: 28px;
      border-top: 1px solid var(--color-border-strong);
    }

    .modal-actions .btn {
      flex: 1;
    }

    .btn-danger {
      background: linear-gradient(135deg, var(--color-negative) 0%, #dc2626 100%);
      color: var(--color-text-strong);
      border: none;
      box-shadow: 0 4px 12px -2px rgba(239, 68, 68, 0.4);
    }

    .btn-danger:hover {
      background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
      box-shadow: 0 8px 20px -4px rgba(239, 68, 68, 0.5);
    }

    .btn-danger:disabled {
      background: rgba(239, 68, 68, 0.3);
      cursor: not-allowed;
      opacity: 0.6;
    }
  `]
})
export class ProfileComponent implements OnInit {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);

  loading = true;
  error = '';
  categoryFilter = '';

  profile: ProfileOverview = {
    id: '',
    name: '',
    email: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    skillCount: 0,
    sourcesConnected: 0,
    cvs: []
  };

  skills: SkillOverview[] = [];
  filteredSkills: SkillOverview[] = [];
  categories: string[] = [];

  downloadingCv: string | null = null;
  deletingCv: string | null = null;
  selectedCv: any = null;
  showCvModal: boolean = false;

  ngOnInit() {
    this.loadProfile();
  }

  async loadProfile() {
    try {
      this.loading = true;
      this.error = '';

      const userId = this.authService.getUserId();
      console.log('[PROFILE] Loading profile for userId:', userId);

      if (!userId) {
        console.warn('[PROFILE] No userId found, user not logged in');
        this.error = 'Please login to view your profile';
        this.loading = false;
        return;
      }

      console.log('[PROFILE] Fetching profile from API...');
      this.apiService.getProfile(userId).subscribe({
        next: (profileData) => {
          console.log('[PROFILE] ✓ Received profile data:', profileData);

          this.profile = {
            id: profileData.id || userId,
            name: profileData.name || 'User',
            email: profileData.email || this.authService.getCurrentUser()?.email || '',
            createdAt: profileData.createdAt ? new Date(profileData.createdAt) : new Date(),
            updatedAt: profileData.updatedAt ? new Date(profileData.updatedAt) : new Date(),
            skillCount: profileData.skills?.length || 0,
            sourcesConnected: profileData.sourcesConnected || 0,
            cvs: profileData.cvs || []
          };

          console.log('[PROFILE] Profile object:', this.profile);
          console.log('[PROFILE] CVs found:', this.profile.cvs?.length || 0);

          this.skills = (profileData.skills || []).map((skill: any) => ({
            id: skill.id || Math.random().toString(),
            name: skill.name,
            category: skill.category || 'Other',
            confidence: skill.confidence || 0,
            verified: skill.verified || false,
            occurrences: skill.occurrences || 1,
            evidenceCount: skill.evidence?.length || 0
          }));

          console.log('[PROFILE] Skills processed:', this.skills.length);

          this.filteredSkills = [...this.skills];
          this.categories = [...new Set(this.skills.map(s => s.category))];

          console.log('[PROFILE] Categories:', this.categories);
          console.log('[PROFILE] ✓ Profile loaded successfully, setting loading=false');

          this.loading = false;
        },
        error: (err) => {
          console.error('[PROFILE] ✗ Failed to load profile:', err);
          console.error('[PROFILE] Error details:', {
            message: err.message,
            status: err.status,
            error: err.error
          });
          this.error = 'Failed to load profile. Please try again.';
          this.loading = false;
        }
      });

    } catch (err: any) {
      console.error('[PROFILE] ✗ Exception in loadProfile:', err);
      this.error = err.message || 'Failed to load profile';
      this.loading = false;
    }
  }

  filterSkills() {
    if (this.categoryFilter) {
      this.filteredSkills = this.skills.filter(s => s.category === this.categoryFilter);
    } else {
      this.filteredSkills = [...this.skills];
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return date.toLocaleDateString();
  }

  getFileExtension(fileName: string): string {
    const ext = fileName.split('.').pop()?.toUpperCase() || 'FILE';
    return ext;
  }

  async downloadCV(cv: any) {
    console.log('[PROFILE] Downloading CV:', cv.fileName);

    try {
      this.downloadingCv = cv.gcsUri;

      const userId = this.authService.getUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      console.log('[PROFILE] Requesting signed URL for:', cv.gcsUri);

      // Get signed download URL from backend
      const response = await firstValueFrom(this.apiService.getCVDownloadUrl(userId, cv.gcsUri));

      console.log('[PROFILE] ✓ Opening signed URL in new tab');
      window.open(response.downloadUrl, '_blank');

      console.log('[PROFILE] ✓ CV download initiated');
    } catch (error: any) {
      console.error('[PROFILE] ✗ Failed to download CV:', error);
      alert('Failed to download CV: ' + (error.error?.message || error.message));
    } finally {
      this.downloadingCv = null;
    }
  }

  viewCVDetails(cv: any) {
    console.log('[PROFILE] Viewing CV details:', cv);
    this.selectedCv = cv;
    this.showCvModal = true;
  }

  closeCvModal() {
    this.showCvModal = false;
    this.selectedCv = null;
  }

  formatFullDate(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }

  async deleteCV(cv: any) {
    console.log('[PROFILE] Deleting CV:', cv.fileName);

    const confirmed = confirm(
      `Are you sure you want to delete "${cv.fileName}"?\n\n` +
      `This will remove the CV from your profile but will NOT remove the extracted skills.`
    );

    if (!confirmed) {
      console.log('[PROFILE] CV deletion cancelled');
      return;
    }

    try {
      this.deletingCv = cv.gcsUri;

      // Call backend API to delete CV
      const userId = this.profile.id;
      await firstValueFrom(this.apiService.deleteCV(userId, cv.gcsUri));

      console.log('[PROFILE] ✓ CV deleted successfully from backend');

      // Remove from local profile
      this.profile.cvs = this.profile.cvs?.filter(c => c.gcsUri !== cv.gcsUri) || [];

      console.log('[PROFILE] ✓ CV deleted successfully');
      alert('CV deleted successfully!');

      // Reload profile to sync with backend
      this.loadProfile();
    } catch (error: any) {
      console.error('[PROFILE] ✗ Failed to delete CV:', error);
      alert('Failed to delete CV: ' + (error.error?.message || error.message));
    } finally {
      this.deletingCv = null;
    }
  }

  private generateMockSkills(): SkillOverview[] {
    return [
      { id: '1', name: 'TypeScript', category: 'Programming', confidence: 0.95, verified: true, occurrences: 12, evidenceCount: 8 },
      { id: '2', name: 'Angular', category: 'Frontend', confidence: 0.92, verified: true, occurrences: 10, evidenceCount: 6 },
      { id: '3', name: 'NestJS', category: 'Backend', confidence: 0.88, verified: false, occurrences: 7, evidenceCount: 5 },
      { id: '4', name: 'Docker', category: 'DevOps', confidence: 0.85, verified: false, occurrences: 6, evidenceCount: 4 },
      { id: '5', name: 'GCP', category: 'Cloud', confidence: 0.90, verified: true, occurrences: 9, evidenceCount: 7 },
    ];
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
