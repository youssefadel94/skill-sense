import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../services/api.service';

interface Profile {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  skillCount: number;
  sourcesConnected: number;
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
            </div>
          </div>
        </div>

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

      // TODO: Replace with actual API calls
      // const profile = await this.apiService.getProfile();
      // const skills = await this.apiService.getSkills(profile.id);

      // Mock data for now
      await this.delay(800);

      this.profile = {
        id: '123',
        name: 'John Doe',
        email: 'john@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
        skillCount: 15,
        sourcesConnected: 2
      };

      this.skills = this.generateMockSkills();
      this.filteredSkills = [...this.skills];
      this.categories = [...new Set(this.skills.map(s => s.category))];

    } catch (err: any) {
      this.error = err.message || 'Failed to load profile';
    } finally {
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
