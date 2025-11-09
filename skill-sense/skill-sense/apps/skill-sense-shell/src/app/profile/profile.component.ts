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
      gap: 28px;
      padding: 12px 0 60px;
    }

    .profile-top {
      display: flex;
      justify-content: flex-end;
    }

    .profile-loading {
      display: flex;
      gap: 26px;
      align-items: center;
      padding: 40px;
      border-radius: var(--radius-lg);
    }

    .spinner {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      border: 4px solid rgba(148, 163, 184, 0.18);
      border-top-color: rgba(99, 102, 241, 0.75);
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    .loading-copy {
      display: grid;
      gap: 12px;
      width: 100%;
      max-width: 320px;
    }

    .profile-alert {
      border-radius: var(--radius);
    }

    .profile-hero {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 32px;
      padding: 44px 48px;
      position: relative;
      overflow: hidden;
    }

    .profile-hero::after {
      content: '';
      position: absolute;
      width: 280px;
      height: 280px;
      right: -40px;
      bottom: -60px;
      background: radial-gradient(circle, rgba(6, 182, 212, 0.18) 0, rgba(6, 182, 212, 0));
      filter: blur(10px);
    }

    .profile-hero__content {
      position: relative;
      z-index: 1;
      display: grid;
      gap: 16px;
    }

    .profile-hero__content h1 {
      margin: 0;
      font-size: clamp(2rem, 2.4vw, 2.6rem);
    }

    .profile-hero__email {
      margin: 0;
      color: var(--color-text-muted);
      font-size: 1rem;
    }

    .profile-hero__chips {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }

    .profile-hero__actions {
      display: flex;
      flex-direction: column;
      gap: 12px;
      align-items: flex-end;
      justify-content: center;
    }

    .cvs-section,
    .skills-section {
      display: grid;
      gap: 24px;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      gap: 18px;
      flex-wrap: wrap;
      align-items: flex-start;
    }

    .section-header h2 {
      margin: 0;
      font-size: 1.6rem;
    }

    .section-header p {
      margin: 6px 0 0;
    }

    .cvs-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 18px;
    }

    .cv-card {
      position: relative;
      display: grid;
      grid-template-columns: auto 1fr auto;
      gap: 18px;
      padding: 24px;
      border-radius: var(--radius);
      border: 1px solid rgba(148, 163, 184, 0.2);
      background: rgba(15, 23, 42, 0.62);
      overflow: hidden;
    }

    .cv-card::after {
      content: '';
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at top right, rgba(99, 102, 241, 0.22), transparent 55%);
      opacity: 0.85;
      pointer-events: none;
    }

    .cv-card__icon {
      font-size: 34px;
      z-index: 1;
      align-self: center;
    }

    .cv-card__body {
      z-index: 1;
      display: grid;
      gap: 12px;
      min-width: 0;
    }

    .cv-card__header {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: flex-start;
      flex-wrap: wrap;
    }

    .cv-card__header h3 {
      margin: 0;
      font-size: 1.05rem;
      font-weight: 600;
      max-width: 240px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .chip {
      padding: 4px 12px;
      border-radius: 999px;
      background: rgba(148, 163, 184, 0.16);
      font-size: 0.75rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .cv-card__meta {
      display: flex;
      flex-wrap: wrap;
      gap: 12px 18px;
      color: var(--color-text-muted);
      font-size: 0.85rem;
    }

    .meta-item {
      display: inline-flex;
      gap: 6px;
      align-items: center;
    }

    .meta-icon {
      font-size: 0.9rem;
    }

    .cv-card__actions {
      z-index: 1;
      display: flex;
      flex-direction: column;
      gap: 10px;
      align-items: center;
    }

    .btn-icon {
      background: rgba(148, 163, 184, 0.16);
      border: 1px solid rgba(148, 163, 184, 0.28);
      border-radius: 12px;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: var(--color-text);
      transition: transform 0.2s ease, background 0.2s ease, border-color 0.2s ease;
    }

    .btn-icon:hover {
      transform: translateY(-2px);
      background: rgba(148, 163, 184, 0.24);
    }

    .btn-icon:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-danger {
      border-color: rgba(239, 68, 68, 0.32);
      background: rgba(239, 68, 68, 0.16);
    }

    .btn-danger:hover {
      background: rgba(239, 68, 68, 0.22);
    }

    .spinner-small {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 3px solid rgba(148, 163, 184, 0.18);
      border-top-color: rgba(99, 102, 241, 0.75);
      animation: spin 0.9s linear infinite;
    }

    .filters {
      display: grid;
      gap: 8px;
      min-width: 200px;
    }

    .empty-state {
      text-align: center;
      padding: 48px 24px;
      border: 1px dashed rgba(148, 163, 184, 0.28);
      border-radius: var(--radius);
      background: rgba(15, 23, 42, 0.45);
      display: grid;
      gap: 12px;
    }

    .empty-state h3 {
      margin: 0;
      font-size: 1.3rem;
    }

    .empty-state p {
      margin: 0;
      color: var(--color-text-muted);
    }

    .skills-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 18px;
    }

    .skill-card {
      position: relative;
      padding: 22px;
      border-radius: var(--radius);
      border: 1px solid rgba(148, 163, 184, 0.2);
      background: rgba(15, 23, 42, 0.62);
      display: grid;
      gap: 14px;
      transition: border-color 0.2s ease, transform 0.2s ease;
    }

    .skill-card:hover {
      border-color: rgba(99, 102, 241, 0.45);
      transform: translateY(-2px);
    }

    .skill-card.verified {
      border-color: rgba(34, 197, 94, 0.38);
    }

    .skill-card__header {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: flex-start;
    }

    .skill-card__header h3 {
      margin: 0;
      font-size: 1.1rem;
    }

    .skill-card__category {
      margin: 0;
      color: var(--color-text-muted);
      font-size: 0.9rem;
    }

    .skill-card__stats {
      display: grid;
      gap: 12px;
    }

    .skill-stat {
      display: grid;
      gap: 6px;
    }

    .skill-stat__label {
      font-size: 0.78rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--color-text-subtle);
    }

    .skill-stat__value {
      font-weight: 600;
      font-size: 0.96rem;
    }

    .confidence {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .confidence__bar {
      flex: 1;
      height: 10px;
      border-radius: 999px;
      background: rgba(148, 163, 184, 0.18);
      overflow: hidden;
    }

    .confidence__fill {
      height: 100%;
      background: linear-gradient(120deg, rgba(99, 102, 241, 0.8), rgba(129, 140, 248, 0.95));
      border-radius: 999px;
      transition: width 0.4s ease;
    }

    @media (max-width: 960px) {
      .profile-hero {
        grid-template-columns: 1fr;
        padding: 36px;
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
        gap: 22px;
      }

      .profile-hero {
        padding: 28px;
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
    }

    .storage-uri {
      font-family: 'Courier New', monospace;
      background: #f9fafb;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 13px;
      color: #666;
      border: 1px solid #e5e7eb;
    }

    .modal-actions {
      display: flex;
      gap: 12px;
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid #e5e7eb;
    }

    .modal-actions .btn {
      flex: 1;
    }

    .btn-danger {
      background: #ef4444;
      color: white;
      border: none;
    }

    .btn-danger:hover {
      background: #dc2626;
    }

    .btn-danger:disabled {
      background: #fca5a5;
      cursor: not-allowed;
    }
  `]
})
export class ProfileComponent implements OnInit {
      background: white;
      padding: 30px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      margin-bottom: 30px;
    }

    .info-card h2 {
      margin: 0 0 10px 0;
      color: #333;
    }

    .email {
      color: #666;
      margin: 0 0 15px 0;
    }

    .meta {
      color: #999;
      font-size: 14px;
    }

    .meta span {
      margin: 0 5px;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .section-header h2 {
      margin: 0;
      color: #333;
    }

    .cvs-section {
      margin-bottom: 30px;
    }

    .cvs-section .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .cvs-section h2 {
      color: #333;
      margin: 0;
    }

    .cvs-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .cv-card {
      background: white;
      padding: 20px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      border-left: 4px solid #667eea;
      display: flex;
      gap: 15px;
      align-items: start;
      transition: transform 0.2s, box-shadow 0.2s;
      position: relative;
    }

    .cv-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
    }

    .cv-icon {
      font-size: 32px;
      flex-shrink: 0;
    }

    .cv-info {
      flex: 1;
      min-width: 0;
    }

    .cv-info h3 {
      margin: 0 0 8px 0;
      color: #333;
      font-size: 16px;
      font-weight: 600;
      word-break: break-word;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .cv-date {
      color: #666;
      font-size: 13px;
      margin: 0 0 8px 0;
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .date-icon {
      font-size: 12px;
    }

    .cv-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      margin-top: 8px;
    }

    .cv-stats {
      color: #667eea;
      font-size: 14px;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .stat-icon {
      font-size: 14px;
    }

    .cv-type {
      background: #e0e7ff;
      color: #667eea;
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .cv-actions {
      display: flex;
      flex-direction: column;
      gap: 8px;
      flex-shrink: 0;
    }

    .btn-icon {
      background: #f3f4f6;
      border: none;
      border-radius: 8px;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 18px;
    }

    .btn-icon:hover {
      background: #e5e7eb;
      transform: scale(1.05);
    }

    .btn-icon:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }

    .btn-icon.btn-danger:hover {
      background: #fee;
      color: #dc2626;
    }

    .spinner-small {
      width: 16px;
      height: 16px;
      border: 2px solid #ddd;
      border-top-color: #667eea;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .filters select {
      min-width: 200px;
    }

    .skills-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
    }

    .skill-card {
      background: white;
      padding: 20px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      border-left: 4px solid #667eea;
    }

  `]
})
export class ProfileComponent implements OnInit {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);

  loading = true;
  error = '';
  categoryFilter = '';

  profile: Profile = {
    id: '',
    name: '',
    email: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    skillCount: 0,
    sourcesConnected: 0
  };

  skills: Skill[] = [];
  filteredSkills: Skill[] = [];
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

  private generateMockSkills(): Skill[] {
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
