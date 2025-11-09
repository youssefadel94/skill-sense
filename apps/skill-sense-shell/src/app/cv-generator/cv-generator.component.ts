import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../services/api.service';
import type { Profile } from '../models';

interface CVTemplate {
  id: string;
  name: string;
  description: string;
  style: 'modern' | 'classic' | 'creative' | 'minimal';
  preview: string;
}

interface GeneratedCV {
  id: string;
  profileId: string;
  template: string;
  format: 'pdf' | 'docx' | 'html';
  content: string;
  downloadUrl?: string;
  createdAt: Date;
}

@Component({
  selector: 'app-cv-generator',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="cv-generator-container">
      <header class="page-header">
        <div>
          <h1>📄 AI CV Generator</h1>
          <p class="subtitle">Generate professional CVs from your skill profile</p>
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
        <div class="generator-layout">
          <!-- Configuration Panel -->
          <div class="config-panel">
            <div class="card">
              <h3>⚙️ CV Configuration</h3>

              <div class="form-group">
                <label>Target Role</label>
                <input
                  type="text"
                  [(ngModel)]="targetRole"
                  placeholder="e.g., Senior Full Stack Developer"
                  class="form-control"
                />
                <small>Customize CV content for specific role</small>
              </div>

              <div class="form-group">
                <label>Template Style</label>
                <div class="template-grid">
                  @for (template of templates; track template.id) {
                    <div
                      class="template-card"
                      [class.selected]="selectedTemplate === template.id"
                      (click)="selectTemplate(template.id)"
                    >
                      <div class="template-preview">{{ template.preview }}</div>
                      <div class="template-name">{{ template.name }}</div>
                      <div class="template-desc">{{ template.description }}</div>
                    </div>
                  }
                </div>
              </div>

              <div class="form-group">
                <label>Output Format</label>
                <select [(ngModel)]="outputFormat" class="form-control">
                  <option value="pdf">PDF (Recommended)</option>
                  <option value="docx">Word Document (.docx)</option>
                  <option value="html">HTML (Preview)</option>
                </select>
              </div>

              <div class="form-group">
                <label>Include Sections</label>
                <div class="checkbox-group">
                  <label class="checkbox-label">
                    <input type="checkbox" [(ngModel)]="sections.summary" />
                    Professional Summary
                  </label>
                  <label class="checkbox-label">
                    <input type="checkbox" [(ngModel)]="sections.skills" />
                    Skills & Competencies
                  </label>
                  <label class="checkbox-label">
                    <input type="checkbox" [(ngModel)]="sections.evidence" />
                    Evidence & Projects
                  </label>
                  <label class="checkbox-label">
                    <input type="checkbox" [(ngModel)]="sections.certifications" />
                    Certifications
                  </label>
                  <label class="checkbox-label">
                    <input type="checkbox" [(ngModel)]="sections.achievements" />
                    Key Achievements
                  </label>
                </div>
              </div>

              <div class="form-group">
                <label>Skill Categories to Emphasize</label>
                <div class="checkbox-group">
                  @for (category of availableCategories; track category) {
                    <label class="checkbox-label">
                      <input
                        type="checkbox"
                        [checked]="emphasisCategories.includes(category)"
                        (change)="toggleCategory(category)"
                      />
                      {{ category }}
                    </label>
                  }
                </div>
              </div>

              <button
                class="btn btn-primary btn-block"
                (click)="generateCV()"
                [disabled]="generating"
              >
                @if (generating) {
                  <span class="spinner-sm"></span>
                  Generating CV...
                } @else {
                  🚀 Generate CV
                }
              </button>
            </div>
          </div>

          <!-- Preview Panel -->
          <div class="preview-panel">
            @if (!generatedCV) {
              <div class="empty-state">
                <div class="empty-icon">📄</div>
                <h3>No CV Generated Yet</h3>
                <p>Configure your CV options on the left and click "Generate CV" to create your professional resume.</p>
              </div>
            } @else {
              <div class="cv-preview">
                <div class="preview-header">
                  <h3>📋 CV Preview</h3>
                  <div class="preview-actions">
                    <button class="btn btn-sm btn-secondary" (click)="editCV()">
                      ✏️ Edit
                    </button>
                    <button class="btn btn-sm btn-primary" (click)="downloadCV()">
                      ⬇️ Download
                    </button>
                  </div>
                </div>

                <div class="preview-content" [innerHTML]="generatedCV.content"></div>

                <div class="preview-footer">
                  <p class="meta">
                    Generated: {{ generatedCV.createdAt | date:'medium' }} •
                    Format: {{ generatedCV.format.toUpperCase() }} •
                    Template: {{ getTemplateName(generatedCV.template) }}
                  </p>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Recent CVs -->
        @if (recentCVs.length > 0) {
          <div class="recent-cvs-section">
            <h3>📚 Recent CVs</h3>
            <div class="recent-cvs-grid">
              @for (cv of recentCVs; track cv.id) {
                <div class="recent-cv-card" (click)="loadCV(cv)">
                  <div class="cv-icon">📄</div>
                  <div class="cv-info">
                    <div class="cv-title">{{ getTemplateName(cv.template) }}</div>
                    <div class="cv-meta">
                      {{ cv.format.toUpperCase() }} • {{ cv.createdAt | date:'short' }}
                    </div>
                  </div>
                  <button class="btn-icon" (click)="downloadCV(cv); $event.stopPropagation()">
                    ⬇️
                  </button>
                </div>
              }
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .cv-generator-container {
      max-width: 1600px;
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

    .generator-layout {
      display: grid;
      grid-template-columns: 400px 1fr;
      gap: 30px;
      margin-bottom: 30px;
    }

    .card {
      background: white;
      padding: 24px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .card h3 {
      margin: 0 0 20px 0;
      color: #333;
      font-size: 18px;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
      color: #333;
    }

    .form-group small {
      display: block;
      margin-top: 5px;
      color: #666;
      font-size: 12px;
    }

    .form-control {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 14px;
      box-sizing: border-box;
    }

    .form-control:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .template-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      margin-top: 10px;
    }

    .template-card {
      padding: 12px;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
      text-align: center;
    }

    .template-card:hover {
      border-color: #667eea;
      background: #f9fafb;
    }

    .template-card.selected {
      border-color: #667eea;
      background: #eef2ff;
    }

    .template-preview {
      font-size: 36px;
      margin-bottom: 8px;
    }

    .template-name {
      font-weight: 600;
      color: #333;
      font-size: 14px;
      margin-bottom: 4px;
    }

    .template-desc {
      font-size: 11px;
      color: #666;
    }

    .checkbox-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      padding: 8px;
      border-radius: 4px;
      transition: background 0.2s;
    }

    .checkbox-label:hover {
      background: #f9fafb;
    }

    .checkbox-label input[type="checkbox"] {
      cursor: pointer;
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

    .btn-secondary:hover {
      background: #5a6268;
    }

    .btn-block {
      width: 100%;
      display: block;
    }

    .btn-sm {
      padding: 6px 12px;
      font-size: 13px;
    }

    .spinner-sm {
      display: inline-block;
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
      margin-right: 6px;
    }

    .preview-panel {
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .empty-state {
      text-align: center;
      padding: 80px 40px;
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
      max-width: 400px;
      margin: 0 auto;
    }

    .cv-preview {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .preview-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid #e5e7eb;
    }

    .preview-header h3 {
      margin: 0;
      color: #333;
      font-size: 18px;
    }

    .preview-actions {
      display: flex;
      gap: 10px;
    }

    .preview-content {
      flex: 1;
      padding: 30px;
      overflow-y: auto;
      background: #f9fafb;
    }

    .preview-footer {
      padding: 15px 24px;
      border-top: 1px solid #e5e7eb;
      background: #f9fafb;
    }

    .meta {
      margin: 0;
      font-size: 12px;
      color: #666;
    }

    .recent-cvs-section {
      background: white;
      padding: 24px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .recent-cvs-section h3 {
      margin: 0 0 20px 0;
      color: #333;
    }

    .recent-cvs-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 15px;
    }

    .recent-cv-card {
      display: flex;
      align-items: center;
      gap: 15px;
      padding: 15px;
      background: #f9fafb;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .recent-cv-card:hover {
      background: #eef2ff;
      transform: translateY(-2px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .cv-icon {
      font-size: 32px;
    }

    .cv-info {
      flex: 1;
    }

    .cv-title {
      font-weight: 600;
      color: #333;
      margin-bottom: 4px;
    }

    .cv-meta {
      font-size: 12px;
      color: #666;
    }

    .btn-icon {
      background: none;
      border: none;
      font-size: 18px;
      cursor: pointer;
      padding: 8px;
      border-radius: 4px;
      transition: background 0.2s;
    }

    .btn-icon:hover {
      background: rgba(0,0,0,0.05);
    }

    .alert-error {
      background: #fee;
      color: #c33;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
    }

    @media (max-width: 1200px) {
      .generator-layout {
        grid-template-columns: 1fr;
      }

      .preview-panel {
        min-height: 500px;
      }
    }
  `]
})
export class CvGeneratorComponent implements OnInit {
  private apiService = inject(ApiService);

  loading = false;
  error = '';
  loadingMessage = '';
  generating = false;

  profile: Profile | null = null;
  targetRole = '';
  selectedTemplate = 'modern';
  outputFormat: 'pdf' | 'docx' | 'html' = 'pdf';

  sections = {
    summary: true,
    skills: true,
    evidence: true,
    certifications: true,
    achievements: true
  };

  availableCategories = ['Programming', 'Frontend', 'Backend', 'DevOps', 'Cloud', 'Database'];
  emphasisCategories: string[] = [];

  templates: CVTemplate[] = [
    { id: 'modern', name: 'Modern', description: 'Clean & professional', style: 'modern', preview: '📋' },
    { id: 'classic', name: 'Classic', description: 'Traditional format', style: 'classic', preview: '📄' },
    { id: 'creative', name: 'Creative', description: 'Stand out design', style: 'creative', preview: '🎨' },
    { id: 'minimal', name: 'Minimal', description: 'Simple & elegant', style: 'minimal', preview: '📃' }
  ];

  generatedCV: GeneratedCV | null = null;
  recentCVs: GeneratedCV[] = [];

  ngOnInit() {
    this.loadProfile();
    this.loadRecentCVs();
  }

  async loadProfile() {
    try {
      this.loading = true;
      this.loadingMessage = 'Loading your profile...';

      // TODO: Replace with actual API call
      // this.apiService.getProfile().subscribe({
      //   next: (profile) => { this.profile = profile; },
      //   error: (err) => { this.error = err.message; },
      //   complete: () => { this.loading = false; }
      // });

      await this.delay(800);
      // Mock profile loaded
      this.loading = false;
    } catch (err: any) {
      this.error = err.message || 'Failed to load profile';
      this.loading = false;
    }
  }

  async loadRecentCVs() {
    // TODO: Fetch from API
    // Mock data
    this.recentCVs = [
      {
        id: '1',
        profileId: 'user-123',
        template: 'modern',
        format: 'pdf',
        content: '',
        createdAt: new Date(Date.now() - 86400000)
      },
      {
        id: '2',
        profileId: 'user-123',
        template: 'classic',
        format: 'docx',
        content: '',
        createdAt: new Date(Date.now() - 172800000)
      }
    ];
  }

  selectTemplate(templateId: string) {
    this.selectedTemplate = templateId;
  }

  toggleCategory(category: string) {
    const index = this.emphasisCategories.indexOf(category);
    if (index > -1) {
      this.emphasisCategories.splice(index, 1);
    } else {
      this.emphasisCategories.push(category);
    }
  }

  async generateCV() {
    try {
      this.generating = true;
      this.error = '';

      // TODO: Replace with actual API call
      // this.apiService.generateCV({
      //   targetRole: this.targetRole,
      //   template: this.selectedTemplate,
      //   format: this.outputFormat,
      //   sections: this.sections,
      //   emphasisCategories: this.emphasisCategories
      // }).subscribe({
      //   next: (cv) => { this.generatedCV = cv; },
      //   error: (err) => { this.error = err.message; },
      //   complete: () => { this.generating = false; }
      // });

      await this.delay(2000);
      this.generatedCV = this.generateMockCV();

    } catch (err: any) {
      this.error = err.message || 'Failed to generate CV';
    } finally {
      this.generating = false;
    }
  }

  editCV() {
    // TODO: Open CV editor
    alert('CV editor coming soon!');
  }

  downloadCV(cv?: GeneratedCV) {
    const targetCV = cv || this.generatedCV;
    if (!targetCV) return;

    // TODO: Implement actual download
    alert(`Downloading ${targetCV.format.toUpperCase()} CV...`);
  }

  loadCV(cv: GeneratedCV) {
    this.generatedCV = cv;
  }

  getTemplateName(templateId: string): string {
    return this.templates.find(t => t.id === templateId)?.name || templateId;
  }

  private generateMockCV(): GeneratedCV {
    const content = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; background: white;">
        <h1 style="color: #667eea; margin: 0 0 5px 0;">John Doe</h1>
        <p style="color: #666; margin: 0 0 30px 0;">${this.targetRole || 'Full Stack Developer'}</p>

        <h2 style="color: #333; border-bottom: 2px solid #667eea; padding-bottom: 5px;">Professional Summary</h2>
        <p style="color: #555; line-height: 1.6;">
          Experienced software engineer with expertise in modern web technologies, cloud platforms, and DevOps practices.
          Proven track record of delivering scalable applications and leading technical initiatives.
        </p>

        <h2 style="color: #333; border-bottom: 2px solid #667eea; padding-bottom: 5px; margin-top: 30px;">Key Skills</h2>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 15px;">
          <div style="padding: 10px; background: #f0f4ff; border-radius: 4px;">TypeScript</div>
          <div style="padding: 10px; background: #f0f4ff; border-radius: 4px;">React</div>
          <div style="padding: 10px; background: #f0f4ff; border-radius: 4px;">Node.js</div>
          <div style="padding: 10px; background: #f0f4ff; border-radius: 4px;">AWS</div>
          <div style="padding: 10px; background: #f0f4ff; border-radius: 4px;">Docker</div>
          <div style="padding: 10px; background: #f0f4ff; border-radius: 4px;">PostgreSQL</div>
        </div>

        <h2 style="color: #333; border-bottom: 2px solid #667eea; padding-bottom: 5px; margin-top: 30px;">Notable Projects</h2>
        <ul style="color: #555; line-height: 1.8;">
          <li>Built microservices architecture serving 1M+ users</li>
          <li>Led migration to Kubernetes, reducing infrastructure costs by 40%</li>
          <li>Implemented CI/CD pipeline improving deployment frequency by 300%</li>
        </ul>

        <p style="text-align: center; margin-top: 40px; color: #999; font-size: 12px;">
          Generated by SkillSense AI • ${new Date().toLocaleDateString()}
        </p>
      </div>
    `;

    return {
      id: 'cv-' + Date.now(),
      profileId: 'user-123',
      template: this.selectedTemplate,
      format: this.outputFormat,
      content,
      createdAt: new Date()
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
