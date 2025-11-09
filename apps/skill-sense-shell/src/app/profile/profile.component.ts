import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';

interface Profile {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  skillCount: number;
  sourcesConnected: number;
  cvs?: CV[];
}

interface Skill {
  id: string;
  name: string;
  category: string;
  confidence: number;
  verified: boolean;
  occurrences: number;
  evidenceCount: number;
}

interface CV {
  fileName: string;
  fileType: string;
  gcsUri: string;
  uploadedAt: string;
  skillsExtracted: number;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="profile-container">
      <header class="profile-header">
        <h1>Your Profile</h1>
        <a [routerLink]="['/dashboard']" class="btn btn-secondary">Back to Dashboard</a>
      </header>

      @if (loading) {
        <div class="loading">
          <div class="spinner"></div>
          <p>Loading your profile...</p>
        </div>
      } @else if (error) {
        <div class="alert alert-error">{{ error }}</div>
      } @else {
        <div class="profile-info">
          <div class="info-card">
            <h2>{{ profile.name }}</h2>
            <p class="email">{{ profile.email }}</p>
            <div class="meta">
              <span>{{ profile.skillCount }} skills</span>
              <span>•</span>
              <span>{{ profile.sourcesConnected }} sources</span>
              @if (profile.cvs && profile.cvs.length > 0) {
                <span>•</span>
                <span>{{ profile.cvs.length }} CV{{ profile.cvs.length > 1 ? 's' : '' }}</span>
              }
            </div>
          </div>
        </div>

        @if (profile.cvs && profile.cvs.length > 0) {
          <div class="cvs-section">
            <h2>Uploaded CVs</h2>
            <div class="cvs-grid">
              @for (cv of profile.cvs; track cv.gcsUri) {
                <div class="cv-card">
                  <div class="cv-icon">📄</div>
                  <div class="cv-info">
                    <h3>{{ cv.fileName }}</h3>
                    <p class="cv-date">Uploaded {{ formatDate(cv.uploadedAt) }}</p>
                    <p class="cv-stats">{{ cv.skillsExtracted }} skills extracted</p>
                  </div>
                </div>
              }
            </div>
          </div>
        }

        <div class="skills-section">
          <div class="section-header">
            <h2>Skills ({{ skills.length }})</h2>
            <div class="filters">
              <select [(ngModel)]="categoryFilter" (change)="filterSkills()" class="form-control">
                <option value="">All Categories</option>
                @for (cat of categories; track cat) {
                  <option [value]="cat">{{ cat }}</option>
                }
              </select>
            </div>
          </div>

          @if (filteredSkills.length === 0) {
            <div class="empty-state">
              <p>No skills found. Upload a CV to get started!</p>
              <a [routerLink]="['/upload']" class="btn btn-primary">Upload CV</a>
            </div>
          } @else {
            <div class="skills-grid">
              @for (skill of filteredSkills; track skill.id) {
                <div class="skill-card" [class.verified]="skill.verified">
                  <div class="skill-header">
                    <h3>{{ skill.name }}</h3>
                    @if (skill.verified) {
                      <span class="badge badge-verified">✓ Verified</span>
                    }
                  </div>
                  <p class="skill-category">{{ skill.category }}</p>
                  <div class="skill-stats">
                    <div class="stat">
                      <span class="label">Confidence:</span>
                      <div class="confidence-bar">
                        <div
                          class="confidence-fill"
                          [style.width.%]="skill.confidence * 100"
                        ></div>
                      </div>
                      <span class="value">{{ (skill.confidence * 100).toFixed(0) }}%</span>
                    </div>
                    <div class="stat">
                      <span class="label">Evidence:</span>
                      <span class="value">{{ skill.evidenceCount }} items</span>
                    </div>
                    <div class="stat">
                      <span class="label">Occurrences:</span>
                      <span class="value">{{ skill.occurrences }}×</span>
                    </div>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .profile-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }

    .profile-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
    }

    .profile-header h1 {
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

    .info-card {
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

    .cvs-section h2 {
      color: #333;
      margin: 0 0 20px 0;
    }

    .cvs-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
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
    }

    .cv-icon {
      font-size: 32px;
    }

    .cv-info {
      flex: 1;
    }

    .cv-info h3 {
      margin: 0 0 8px 0;
      color: #333;
      font-size: 16px;
      word-break: break-word;
    }

    .cv-date {
      color: #999;
      font-size: 13px;
      margin: 0 0 5px 0;
    }

    .cv-stats {
      color: #667eea;
      font-size: 14px;
      margin: 0;
      font-weight: 500;
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

    .skill-card.verified {
      border-left-color: #10b981;
    }

    .skill-header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 10px;
    }

    .skill-card h3 {
      margin: 0;
      color: #333;
      font-size: 18px;
    }

    .skill-category {
      color: #666;
      font-size: 14px;
      margin: 0 0 15px 0;
    }

    .skill-stats {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .stat {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 14px;
    }

    .stat .label {
      color: #666;
    }

    .stat .value {
      color: #333;
      font-weight: 500;
    }

    .confidence-bar {
      flex: 1;
      height: 8px;
      background: #e0e0e0;
      border-radius: 4px;
      margin: 0 10px;
      overflow: hidden;
    }

    .confidence-fill {
      height: 100%;
      background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
      transition: width 0.3s;
    }

    .badge {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
    }

    .badge-verified {
      background: #d1fae5;
      color: #065f46;
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      background: white;
      border-radius: 12px;
    }

    .empty-state p {
      color: #666;
      margin-bottom: 20px;
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

  ngOnInit() {
    this.loadProfile();
  }

  async loadProfile() {
    try {
      this.loading = true;
      this.error = '';

      const userId = this.authService.getUserId();
      if (!userId) {
        this.error = 'Please login to view your profile';
        this.loading = false;
        return;
      }

      this.apiService.getProfile(userId).subscribe({
        next: (profileData) => {
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

          this.skills = (profileData.skills || []).map((skill: any) => ({
            id: skill.id || Math.random().toString(),
            name: skill.name,
            category: skill.category || 'Other',
            confidence: skill.confidence || 0,
            verified: skill.verified || false,
            occurrences: skill.occurrences || 1,
            evidenceCount: skill.evidence?.length || 0
          }));

          this.filteredSkills = [...this.skills];
          this.categories = [...new Set(this.skills.map(s => s.category))];
          this.loading = false;
        },
        error: (err) => {
          console.error('Failed to load profile:', err);
          this.error = 'Failed to load profile. Please try again.';
          this.loading = false;
        }
      });

    } catch (err: any) {
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
