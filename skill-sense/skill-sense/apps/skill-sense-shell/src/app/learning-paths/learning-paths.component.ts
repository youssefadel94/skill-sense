import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { SimpleChartComponent } from '../components/simple-chart.component';
import type { LearningPath, SkillGap } from '../models';

interface PathStep {
  id: string;
  title: string;
  description: string;
  duration: string;
  resources: Array<{
    name: string;
    type: 'course' | 'video' | 'article' | 'practice';
    url: string;
    provider: string;
    cost: 'free' | 'paid';
  }>;
  completed: boolean;
}

interface CustomPath {
  id: string;
  name: string;
  targetRole: string;
  steps: PathStep[];
  totalDuration: string;
  completionRate: number;
  createdAt: Date;
}

@Component({
  selector: 'app-learning-paths',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SimpleChartComponent],
  template: `
    <div class="learning-paths-container">
      <header class="page-header">
        <div>
          <h1>🎓 Learning Paths</h1>
          <p class="subtitle">AI-generated personalized learning roadmaps</p>
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
        <!-- Create Path Section -->
        <div class="create-section">
          <div class="create-card">
            <h3>🚀 Generate New Learning Path</h3>
            <div class="create-form">
              <div class="form-group">
                <label>Target Role or Skill</label>
                <input
                  type="text"
                  [(ngModel)]="targetGoal"
                  placeholder="e.g., Cloud Solutions Architect, Kubernetes Expert"
                  class="form-control"
                  (keyup.enter)="generatePath()"
                />
                <small>Enter the role or skill you want to achieve</small>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Learning Style</label>
                  <select [(ngModel)]="learningStyle" class="form-control">
                    <option value="balanced">Balanced (Theory + Practice)</option>
                    <option value="practical">Hands-on (Project-focused)</option>
                    <option value="theoretical">Theoretical (Concept-focused)</option>
                    <option value="fast">Fast Track (Essentials only)</option>
                  </select>
                </div>

                <div class="form-group">
                  <label>Time Commitment</label>
                  <select [(ngModel)]="timeCommitment" class="form-control">
                    <option value="5">5 hours/week (Casual)</option>
                    <option value="10">10 hours/week (Standard)</option>
                    <option value="20">20 hours/week (Intensive)</option>
                    <option value="40">40 hours/week (Full-time)</option>
                  </select>
                </div>
              </div>

              <button
                class="btn btn-primary btn-block"
                (click)="generatePath()"
                [disabled]="generating || !targetGoal"
              >
                @if (generating) {
                  <span class="spinner-sm"></span>
                  Generating Path...
                } @else {
                  ✨ Generate Learning Path
                }
              </button>
            </div>
          </div>
        </div>

        <!-- Active Paths -->
        @if (activePaths.length > 0) {
          <div class="paths-section">
            <h3>📚 Your Learning Paths</h3>
            <div class="paths-grid">
              @for (path of activePaths; track path.id) {
                <div class="path-card" (click)="selectPath(path)">
                  <div class="path-header">
                    <h4>{{ path.name }}</h4>
                    <span class="target-role">🎯 {{ path.targetRole }}</span>
                  </div>

                  <div class="path-progress">
                    <div class="progress-info">
                      <span>Progress</span>
                      <span class="progress-value">{{ path.completionRate }}%</span>
                    </div>
                    <div class="progress-bar-large">
                      <div class="progress-fill" [style.width.%]="path.completionRate"></div>
                    </div>
                  </div>

                  <div class="path-stats">
                    <div class="stat">
                      <span class="stat-icon">📝</span>
                      <span class="stat-text">{{ path.steps.length }} steps</span>
                    </div>
                    <div class="stat">
                      <span class="stat-icon">⏱️</span>
                      <span class="stat-text">{{ path.totalDuration }}</span>
                    </div>
                    <div class="stat">
                      <span class="stat-icon">✓</span>
                      <span class="stat-text">{{ getCompletedSteps(path) }}/{{ path.steps.length }} done</span>
                    </div>
                  </div>

                  <div class="path-actions">
                    <button class="btn btn-sm btn-primary" (click)="continuePathNow(path); $event.stopPropagation()">
                      ▶️ Continue
                    </button>
                  </div>
                </div>
              }
            </div>
          </div>
        }

        <!-- Path Details Modal -->
        @if (selectedPath) {
          <div class="modal-overlay" (click)="closePath()">
            <div class="modal-content large" (click)="$event.stopPropagation()">
              <div class="modal-header">
                <div>
                  <h3>{{ selectedPath.name }}</h3>
                  <p class="target-role-subtitle">🎯 Target: {{ selectedPath.targetRole }}</p>
                </div>
                <button class="btn-close" (click)="closePath()">×</button>
              </div>

              <div class="modal-body">
                <!-- Progress Visualization -->
                <div class="chart-section">
                  <h4>📊 Progress Overview</h4>
                  <app-simple-chart
                    type="pie"
                    [data]="getProgressChartData(selectedPath)"
                    dataLabel="Steps"
                    style="height: 250px; margin-bottom: 20px;"
                  ></app-simple-chart>
                </div>

                <!-- Progress Overview -->
                <div class="progress-overview">
                  <div class="progress-stat">
                    <div class="stat-value">{{ selectedPath.completionRate }}%</div>
                    <div class="stat-label">Complete</div>
                  </div>
                  <div class="progress-stat">
                    <div class="stat-value">{{ getCompletedSteps(selectedPath) }}/{{ selectedPath.steps.length }}</div>
                    <div class="stat-label">Steps Done</div>
                  </div>
                  <div class="progress-stat">
                    <div class="stat-value">{{ selectedPath.totalDuration }}</div>
                    <div class="stat-label">Total Time</div>
                  </div>
                  <div class="progress-stat">
                    <div class="stat-value">{{ getRemainingTime(selectedPath) }}</div>
                    <div class="stat-label">Time Left</div>
                  </div>
                </div>

                <!-- Steps -->
                <div class="steps-section">
                  <h4>📋 Learning Steps</h4>
                  @for (step of selectedPath.steps; track step.id; let i = $index) {
                    <div class="step-card" [class.completed]="step.completed">
                      <div class="step-header">
                        <div class="step-number" [class.completed]="step.completed">
                          @if (step.completed) {
                            ✓
                          } @else {
                            {{ i + 1 }}
                          }
                        </div>
                        <div class="step-info">
                          <h5>{{ step.title }}</h5>
                          <p>{{ step.description }}</p>
                          <div class="step-meta">
                            <span class="duration">⏱️ {{ step.duration }}</span>
                            <span class="resources">📚 {{ step.resources.length }} resources</span>
                          </div>
                        </div>
                        <button
                          class="btn btn-sm"
                          [class.btn-secondary]="step.completed"
                          [class.btn-primary]="!step.completed"
                          (click)="toggleStepCompletion(step)"
                        >
                          @if (step.completed) {
                            ✓ Done
                          } @else {
                            Mark Done
                          }
                        </button>
                      </div>

                      <!-- Resources -->
                      @if (!step.completed) {
                        <div class="resources-list">
                          @for (resource of step.resources; track resource.url) {
                            <div class="resource-item">
                              <div class="resource-icon">{{ getResourceIcon(resource.type) }}</div>
                              <div class="resource-details">
                                <div class="resource-name">{{ resource.name }}</div>
                                <div class="resource-provider">{{ resource.provider }}</div>
                              </div>
                              <div class="resource-meta">
                                @if (resource.cost === 'free') {
                                  <span class="badge-free">FREE</span>
                                } @else {
                                  <span class="badge-paid">PAID</span>
                                }
                              </div>
                              <a [href]="resource.url" target="_blank" class="btn btn-sm btn-link">
                                Open →
                              </a>
                            </div>
                          }
                        </div>
                      }
                    </div>
                  }
                </div>
              </div>

              <div class="modal-footer">
                <button class="btn btn-secondary" (click)="closePath()">Close</button>
                <button class="btn btn-primary" (click)="continuePathNow(selectedPath)">
                  ▶️ Continue Learning
                </button>
              </div>
            </div>
          </div>
        }

        <!-- Empty State -->
        @if (activePaths.length === 0 && !generating) {
          <div class="empty-state">
            <div class="empty-icon">🎓</div>
            <h3>No Learning Paths Yet</h3>
            <p>Create your first AI-generated learning path to start your skill development journey!</p>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .learning-paths-container {
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

    .create-section {
      margin-bottom: 30px;
    }

    .create-card {
      background: white;
      padding: 24px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .create-card h3 {
      margin: 0 0 20px 0;
      color: #333;
    }

    .create-form {
      max-width: 800px;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin-bottom: 15px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      margin-bottom: 15px;
    }

    .form-group label {
      margin-bottom: 6px;
      font-weight: 500;
      color: #333;
      font-size: 14px;
    }

    .form-group small {
      margin-top: 6px;
      font-size: 12px;
      color: #666;
    }

    .form-control {
      padding: 10px 12px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 14px;
    }

    .form-control:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.2s;
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

    .btn-secondary:hover:not(:disabled) {
      background: #5a6268;
    }

    .btn-link {
      background: none;
      color: #667eea;
      padding: 6px 12px;
    }

    .btn-link:hover {
      background: #f0f4ff;
    }

    .btn-block {
      width: 100%;
      margin-top: 10px;
    }

    .btn-sm {
      padding: 6px 14px;
      font-size: 13px;
    }

    .spinner-sm {
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    .paths-section {
      background: white;
      padding: 24px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      margin-bottom: 30px;
    }

    .paths-section h3 {
      margin: 0 0 20px 0;
      color: #333;
    }

    .paths-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 20px;
    }

    .path-card {
      padding: 20px;
      background: #f9fafb;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .path-card:hover {
      border-color: #667eea;
      box-shadow: 0 4px 16px rgba(102, 126, 234, 0.15);
      transform: translateY(-2px);
    }

    .path-header h4 {
      margin: 0 0 8px 0;
      color: #333;
      font-size: 18px;
    }

    .target-role {
      display: inline-block;
      padding: 4px 10px;
      background: #e0e7ff;
      color: #4f46e5;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      margin-bottom: 16px;
    }

    .path-progress {
      margin-bottom: 16px;
    }

    .progress-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 14px;
      color: #666;
      font-weight: 500;
    }

    .progress-value {
      color: #667eea;
      font-weight: 600;
    }

    .progress-bar-large {
      height: 12px;
      background: #e5e7eb;
      border-radius: 6px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
      transition: width 0.3s;
    }

    .path-stats {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
    }

    .stat {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: #666;
    }

    .stat-icon {
      font-size: 16px;
    }

    .path-actions {
      display: flex;
      gap: 10px;
    }

    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 20px;
    }

    .modal-content {
      background: white;
      border-radius: 12px;
      max-width: 900px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }

    .modal-content.large {
      max-width: 1100px;
    }

    .modal-header {
      padding: 24px;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      align-items: start;
    }

    .modal-header h3 {
      margin: 0 0 5px 0;
      color: #333;
    }

    .target-role-subtitle {
      margin: 0;
      color: #667eea;
      font-size: 14px;
      font-weight: 500;
    }

    .btn-close {
      background: none;
      border: none;
      font-size: 32px;
      color: #999;
      cursor: pointer;
      padding: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
    }

    .btn-close:hover {
      background: #f3f4f6;
      color: #333;
    }

    .modal-body {
      padding: 24px;
    }

    .progress-overview {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      margin-bottom: 30px;
      padding: 20px;
      background: #f9fafb;
      border-radius: 8px;
    }

    .progress-stat {
      text-align: center;
    }

    .progress-stat .stat-value {
      font-size: 28px;
      font-weight: bold;
      color: #667eea;
      margin-bottom: 5px;
    }

    .progress-stat .stat-label {
      font-size: 13px;
      color: #666;
    }

    .steps-section h4 {
      margin: 0 0 20px 0;
      color: #333;
    }

    .step-card {
      margin-bottom: 20px;
      padding: 20px;
      background: white;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      transition: all 0.2s;
    }

    .step-card.completed {
      background: #f0fdf4;
      border-color: #86efac;
    }

    .step-header {
      display: flex;
      gap: 16px;
      align-items: start;
      margin-bottom: 16px;
    }

    .step-number {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #e0e7ff;
      color: #4f46e5;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      flex-shrink: 0;
    }

    .step-number.completed {
      background: #86efac;
      color: #166534;
    }

    .step-info {
      flex: 1;
    }

    .step-info h5 {
      margin: 0 0 8px 0;
      color: #333;
      font-size: 16px;
    }

    .step-info p {
      margin: 0 0 10px 0;
      color: #666;
      font-size: 14px;
      line-height: 1.5;
    }

    .step-meta {
      display: flex;
      gap: 16px;
      font-size: 13px;
      color: #999;
    }

    .resources-list {
      padding-left: 56px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .resource-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: #f9fafb;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
    }

    .resource-icon {
      font-size: 24px;
    }

    .resource-details {
      flex: 1;
    }

    .resource-name {
      font-weight: 500;
      color: #333;
      font-size: 14px;
      margin-bottom: 3px;
    }

    .resource-provider {
      font-size: 12px;
      color: #666;
    }

    .resource-meta {
      margin-right: 12px;
    }

    .badge-free {
      padding: 4px 8px;
      background: #d1fae5;
      color: #059669;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
    }

    .badge-paid {
      padding: 4px 8px;
      background: #fef3c7;
      color: #d97706;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 20px 24px;
      border-top: 1px solid #e5e7eb;
      background: #f9fafb;
    }

    .empty-state {
      text-align: center;
      padding: 80px 40px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
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
    }

    .alert-error {
      background: #fee;
      color: #c33;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
    }

    @media (max-width: 768px) {
      .form-row {
        grid-template-columns: 1fr;
      }

      .paths-grid {
        grid-template-columns: 1fr;
      }

      .progress-overview {
        grid-template-columns: repeat(2, 1fr);
      }

      .step-header {
        flex-direction: column;
      }

      .resources-list {
        padding-left: 0;
      }
    }
  `]
})
export class LearningPathsComponent implements OnInit {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);

  loading = false;
  error = '';
  loadingMessage = '';
  generating = false;

  targetGoal = '';
  learningStyle: 'balanced' | 'practical' | 'theoretical' | 'fast' = 'balanced';
  timeCommitment = 10;

  activePaths: CustomPath[] = [];
  selectedPath: CustomPath | null = null;

  ngOnInit() {
    this.loadActivePaths();
  }

  async loadActivePaths() {
    try {
      this.loading = true;
      this.loadingMessage = 'Loading your learning paths...';

      const userId = await this.authService.getUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      this.apiService.getLearningPaths(userId).subscribe({
        next: (response) => {
          this.activePaths = (response.paths || []).map((path: any) => ({
            id: path.id,
            title: path.title || path.targetRole,
            targetRole: path.targetRole || path.title,
            estimatedDuration: path.estimatedDuration || path.duration || '3 months',
            difficulty: path.difficulty || 'Intermediate',
            progress: path.progress || 0,
            currentPhase: path.currentPhase || 'Foundation',
            steps: (path.steps || []).map((step: any) => ({
              id: step.id,
              title: step.title,
              description: step.description,
              type: step.type || 'course',
              duration: step.duration || '2 weeks',
              resources: step.resources || [],
              skills: step.skills || [],
              completed: step.completed || false
            })),
            createdAt: path.createdAt || new Date().toISOString()
          }));
          this.loading = false;
        },
        error: (err) => {
          console.error('Failed to load learning paths:', err);
          this.error = err.message || 'Failed to load learning paths';
          this.loading = false;
        }
      });

    } catch (err: any) {
      this.error = err.message || 'Failed to load learning paths';
      this.loading = false;
    }
  }

  async generatePath() {
    const trimmedGoal = this.targetGoal.trim();
    if (!trimmedGoal) {
      this.error = 'Please provide a target goal before generating a learning path';
      return;
    }

    this.generating = true;
    this.error = '';

    const userId = await this.authService.getUserId();
    if (!userId) {
      this.error = 'Please login to generate learning paths';
      this.generating = false;
      return;
    }

    const config = {
      targetGoal: trimmedGoal,
      learningStyle: this.learningStyle,
      timeCommitment: this.timeCommitment
    };

    this.apiService.generateLearningPath(userId, config).subscribe({
      next: (path) => {
        this.activePaths.unshift(path);
        this.targetGoal = '';
        this.generating = false;
      },
      error: (err) => {
        console.error('Failed to generate learning path:', err);
        this.error = err.message || 'Failed to generate learning path';
        this.generating = false;
      }
    });
  }

  selectPath(path: CustomPath) {
    this.selectedPath = path;
  }

  closePath() {
    this.selectedPath = null;
  }

  continuePathNow(path: CustomPath) {
    const nextStep = path.steps.find(s => !s.completed);
    if (nextStep && nextStep.resources.length > 0) {
      window.open(nextStep.resources[0].url, '_blank');
    }
  }

  toggleStepCompletion(step: PathStep) {
    if (!this.selectedPath) return;

    const userId = this.authService.getUserId();
    if (!userId) {
      console.error('User not authenticated');
      return;
    }

    const newCompletedState = !step.completed;

    this.apiService.updateLearningPathProgress(
      userId,
      this.selectedPath.id,
      step.id,
      newCompletedState
    ).subscribe({
      next: () => {
        step.completed = newCompletedState;
        this.updatePathCompletion(this.selectedPath!);
      },
      error: (err) => {
        console.error('Failed to update step completion:', err);
        // Optionally show error to user
      }
    });
  }

  getCompletedSteps(path: CustomPath): number {
    return path.steps.filter(s => s.completed).length;
  }

  getRemainingTime(path: CustomPath): string {
    const remainingSteps = path.steps.filter(s => !s.completed);
    const totalHours = remainingSteps.reduce((sum, step) => {
      const hours = parseInt(step.duration);
      return sum + (isNaN(hours) ? 0 : hours);
    }, 0);

    if (totalHours < 1) return '< 1 hour';
    if (totalHours < 24) return `${totalHours} hours`;
    const days = Math.ceil(totalHours / 8);
    if (days < 7) return `${days} days`;
    return `${Math.ceil(days / 7)} weeks`;
  }

  getProgressChartData(path: CustomPath) {
    const completed = this.getCompletedSteps(path);
    const remaining = path.steps.length - completed;
    return [
      { label: 'Completed', value: completed },
      { label: 'Remaining', value: remaining }
    ];
  }

  getResourceIcon(type: string): string {
    const icons: Record<string, string> = {
      course: '📚',
      video: '🎥',
      article: '📄',
      practice: '💻'
    };
    return icons[type] || '📎';
  }

  private updatePathCompletion(path: CustomPath) {
    const completed = this.getCompletedSteps(path);
    path.completionRate = Math.round((completed / path.steps.length) * 100);
  }

  private generateMockPaths(): CustomPath[] {
    return [
      {
        id: '1',
        name: 'Master Kubernetes',
        targetRole: 'DevOps Engineer',
        totalDuration: '6 weeks',
        completionRate: 35,
        createdAt: new Date(),
        steps: [
          {
            id: 's1',
            title: 'Container Fundamentals',
            description: 'Learn Docker basics and container concepts',
            duration: '8 hours',
            completed: true,
            resources: [
              { name: 'Docker for Beginners', type: 'course', url: 'https://example.com', provider: 'Udemy', cost: 'paid' },
              { name: 'Container Concepts', type: 'article', url: 'https://example.com', provider: 'Medium', cost: 'free' }
            ]
          },
          {
            id: 's2',
            title: 'Kubernetes Architecture',
            description: 'Understand K8s components and architecture',
            duration: '10 hours',
            completed: true,
            resources: [
              { name: 'Kubernetes Architecture Deep Dive', type: 'video', url: 'https://example.com', provider: 'YouTube', cost: 'free' }
            ]
          },
          {
            id: 's3',
            title: 'Deploy Your First Cluster',
            description: 'Set up a local Kubernetes cluster',
            duration: '6 hours',
            completed: false,
            resources: [
              { name: 'Minikube Tutorial', type: 'practice', url: 'https://example.com', provider: 'Kubernetes.io', cost: 'free' }
            ]
          }
        ]
      }
    ];
  }

  private createMockPath(goal: string): CustomPath {
    return {
      id: 'path-' + Date.now(),
      name: `Path to ${goal}`,
      targetRole: goal,
      totalDuration: '8 weeks',
      completionRate: 0,
      createdAt: new Date(),
      steps: [
        {
          id: 's1',
          title: 'Fundamentals',
          description: `Learn the core concepts of ${goal}`,
          duration: '12 hours',
          completed: false,
          resources: [
            { name: `${goal} Basics`, type: 'course', url: 'https://example.com', provider: 'Coursera', cost: 'paid' }
          ]
        },
        {
          id: 's2',
          title: 'Hands-on Practice',
          description: 'Build practical projects',
          duration: '20 hours',
          completed: false,
          resources: [
            { name: 'Project Tutorial', type: 'practice', url: 'https://example.com', provider: 'FreeCodeCamp', cost: 'free' }
          ]
        }
      ]
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
