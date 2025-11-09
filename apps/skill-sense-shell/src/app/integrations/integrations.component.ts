import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';

interface Integration {
  id: string;
  name: string;
  icon: string;
  description: string;
  status: 'connected' | 'not_connected' | 'pending';
  lastSync?: string;
  skillsExtracted?: number;
}

@Component({
  selector: 'app-integrations',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="integrations-container">
      <header class="page-header">
        <div>
          <h1>🔗 Data Source Integrations</h1>
          <p class="subtitle">Connect your professional profiles to enrich your skill portfolio</p>
        </div>
        <a [routerLink]="['/dashboard']" class="btn btn-secondary">Back to Dashboard</a>
      </header>

      @if (loading) {
        <div class="loading">
          <div class="spinner"></div>
          <p>Loading integrations...</p>
        </div>
      }

      @if (error) {
        <div class="alert alert-error">{{ error }}</div>
      }

      @if (!loading) {
        <div class="integrations-grid">
          <!-- LinkedIn Integration -->
          <div class="integration-card" [class.connected]="linkedInIntegration.status === 'connected'">
            <div class="card-header">
              <div class="icon">{{ linkedInIntegration.icon }}</div>
              <h3>{{ linkedInIntegration.name }}</h3>
              @if (linkedInIntegration.status === 'connected') {
                <span class="status-badge connected">✓ Connected</span>
              } @else {
                <span class="status-badge">Not Connected</span>
              }
            </div>

            <p class="description">{{ linkedInIntegration.description }}</p>

            @if (linkedInIntegration.status === 'connected') {
              <div class="integration-info">
                <div class="info-item">
                  <span class="label">Last Synced:</span>
                  <span class="value">{{ formatDate(linkedInIntegration.lastSync) }}</span>
                </div>
                <div class="info-item">
                  <span class="label">Skills Extracted:</span>
                  <span class="value">{{ linkedInIntegration.skillsExtracted || 0 }}</span>
                </div>
              </div>
            }

            <div class="card-actions">
              @if (linkedInIntegration.status === 'connected') {
                <button (click)="syncLinkedIn()" class="btn btn-primary" [disabled]="syncing">
                  {{ syncing ? 'Syncing...' : '🔄 Re-sync' }}
                </button>
                <button (click)="disconnectLinkedIn()" class="btn btn-danger">
                  Disconnect
                </button>
              } @else {
                <button (click)="showLinkedInForm = true" class="btn btn-primary">
                  Connect LinkedIn
                </button>
              }
            </div>
          </div>

          <!-- GitHub Integration -->
          <div class="integration-card" [class.connected]="githubIntegration.status === 'connected'">
            <div class="card-header">
              <div class="icon">{{ githubIntegration.icon }}</div>
              <h3>{{ githubIntegration.name }}</h3>
              @if (githubIntegration.status === 'connected') {
                <span class="status-badge connected">✓ Connected</span>
              } @else {
                <span class="status-badge">Not Connected</span>
              }
            </div>

            <p class="description">{{ githubIntegration.description }}</p>

            @if (githubIntegration.status === 'connected') {
              <div class="integration-info">
                <div class="info-item">
                  <span class="label">Last Synced:</span>
                  <span class="value">{{ formatDate(githubIntegration.lastSync) }}</span>
                </div>
                <div class="info-item">
                  <span class="label">Skills Extracted:</span>
                  <span class="value">{{ githubIntegration.skillsExtracted || 0 }}</span>
                </div>
              </div>
            }

            <div class="card-actions">
              @if (githubIntegration.status === 'connected') {
                <button (click)="syncGitHub()" class="btn btn-primary" [disabled]="syncing">
                  {{ syncing ? 'Syncing...' : '🔄 Re-sync' }}
                </button>
                <button (click)="disconnectGitHub()" class="btn btn-danger">
                  Disconnect
                </button>
              } @else {
                <button (click)="showGitHubForm = true" class="btn btn-primary">
                  Connect GitHub
                </button>
              }
            </div>
          </div>

          <!-- CV Upload (Already Connected) -->
          <div class="integration-card connected">
            <div class="card-header">
              <div class="icon">📄</div>
              <h3>CV/Resume</h3>
              <span class="status-badge connected">✓ Available</span>
            </div>

            <p class="description">Upload and analyze your resume/CV for skill extraction</p>

            <div class="card-actions">
              <a [routerLink]="['/upload']" class="btn btn-primary">
                Upload CV
              </a>
            </div>
          </div>

          <!-- Web Scraping (Future) -->
          <div class="integration-card">
            <div class="card-header">
              <div class="icon">🌐</div>
              <h3>Personal Website</h3>
              <span class="status-badge">Coming Soon</span>
            </div>

            <p class="description">Extract skills from your portfolio or personal blog</p>

            <div class="card-actions">
              <button class="btn btn-secondary" disabled>
                Coming Soon
              </button>
            </div>
          </div>
        </div>
      }

      <!-- LinkedIn Connection Modal -->
      @if (showLinkedInForm) {
        <div class="modal-overlay" (click)="showLinkedInForm = false">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Connect LinkedIn Profile</h3>
              <button (click)="showLinkedInForm = false" class="close-btn">×</button>
            </div>
            <div class="modal-body">
              <p class="note">
                <strong>Note:</strong> LinkedIn has strict API limitations. Please provide your public profile URL.
              </p>
              <form (ngSubmit)="connectLinkedIn()">
                <div class="form-group">
                  <label for="linkedinUrl">LinkedIn Profile URL</label>
                  <input
                    type="url"
                    id="linkedinUrl"
                    [(ngModel)]="linkedInUrl"
                    name="linkedinUrl"
                    class="form-control"
                    placeholder="https://www.linkedin.com/in/your-username"
                    required
                  />
                  <small class="help-text">
                    Example: https://www.linkedin.com/in/john-doe
                  </small>
                </div>
                <div class="modal-actions">
                  <button type="button" (click)="showLinkedInForm = false" class="btn btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" class="btn btn-primary" [disabled]="!linkedInUrl || connecting">
                    {{ connecting ? 'Connecting...' : 'Connect' }}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      }

      <!-- GitHub Connection Modal -->
      @if (showGitHubForm) {
        <div class="modal-overlay" (click)="showGitHubForm = false">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Connect GitHub Account</h3>
              <button (click)="showGitHubForm = false" class="close-btn">×</button>
            </div>
            <div class="modal-body">
              <form (ngSubmit)="connectGitHub()">
                <div class="form-group">
                  <label for="githubUsername">GitHub Username</label>
                  <input
                    type="text"
                    id="githubUsername"
                    [(ngModel)]="githubUsername"
                    name="githubUsername"
                    class="form-control"
                    placeholder="your-github-username"
                    required
                  />
                  <small class="help-text">
                    We'll analyze your public repositories
                  </small>
                </div>
                <div class="modal-actions">
                  <button type="button" (click)="showGitHubForm = false" class="btn btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" class="btn btn-primary" [disabled]="!githubUsername || connecting">
                    {{ connecting ? 'Connecting...' : 'Connect' }}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .integrations-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 20px;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 30px;
      gap: 20px;
    }

    .page-header h1 {
      margin: 0 0 8px 0;
      font-size: 2rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .subtitle {
      margin: 0;
      color: var(--color-text-muted);
      font-size: 1rem;
    }

    .loading {
      text-align: center;
      padding: 60px 20px;
    }

    .spinner {
      width: 48px;
      height: 48px;
      margin: 0 auto 20px;
      border: 4px solid rgba(148, 163, 184, 0.2);
      border-top-color: #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .alert-error {
      background: #fee;
      color: #c33;
      padding: 15px 20px;
      border-radius: 8px;
      margin-bottom: 20px;
    }

    .integrations-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 24px;
    }

    .integration-card {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(148, 163, 184, 0.2);
      border-radius: 12px;
      padding: 24px;
      transition: all 0.3s ease;
    }

    .integration-card:hover {
      border-color: rgba(102, 126, 234, 0.4);
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    }

    .integration-card.connected {
      border-color: rgba(34, 197, 94, 0.4);
      background: rgba(34, 197, 94, 0.05);
    }

    .card-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }

    .icon {
      font-size: 32px;
    }

    .card-header h3 {
      margin: 0;
      font-size: 1.3rem;
      flex: 1;
      min-width: 150px;
    }

    .status-badge {
      padding: 4px 12px;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.05em;
      background: rgba(148, 163, 184, 0.2);
      color: var(--color-text-muted);
    }

    .status-badge.connected {
      background: rgba(34, 197, 94, 0.2);
      color: #22c55e;
    }

    .description {
      color: var(--color-text-muted);
      font-size: 0.95rem;
      margin: 0 0 20px 0;
      line-height: 1.5;
    }

    .integration-info {
      background: rgba(0, 0, 0, 0.2);
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 20px;
    }

    .info-item {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid rgba(148, 163, 184, 0.1);
    }

    .info-item:last-child {
      border-bottom: none;
    }

    .info-item .label {
      color: var(--color-text-subtle);
      font-size: 0.9rem;
    }

    .info-item .value {
      font-weight: 600;
    }

    .card-actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.95rem;
      font-weight: 500;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      flex: 1;
      min-width: 120px;
    }

    .btn-primary {
      background: #667eea;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #5568d3;
    }

    .btn-secondary {
      background: #6c757d;
      color: white;
    }

    .btn-secondary:hover:not(:disabled) {
      background: #5a6268;
    }

    .btn-danger {
      background: #dc2626;
      color: white;
    }

    .btn-danger:hover:not(:disabled) {
      background: #b91c1c;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      backdrop-filter: blur(4px);
    }

    .modal {
      background: var(--color-bg-card);
      border-radius: 12px;
      max-width: 500px;
      width: 90%;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 24px;
      border-bottom: 1px solid rgba(148, 163, 184, 0.2);
    }

    .modal-header h3 {
      margin: 0;
      font-size: 1.4rem;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 28px;
      cursor: pointer;
      color: var(--color-text-muted);
      padding: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: all 0.2s;
    }

    .close-btn:hover {
      background: rgba(148, 163, 184, 0.2);
      color: var(--color-text);
    }

    .modal-body {
      padding: 24px;
    }

    .note {
      background: rgba(99, 102, 241, 0.1);
      border-left: 3px solid #667eea;
      padding: 12px 16px;
      margin-bottom: 20px;
      border-radius: 4px;
      font-size: 0.9rem;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      margin-bottom: 8px;
      font-weight: 600;
      color: var(--color-text);
    }

    .form-control {
      width: 100%;
      padding: 12px 16px;
      border: 1px solid rgba(148, 163, 184, 0.3);
      border-radius: 8px;
      background: rgba(0, 0, 0, 0.2);
      color: var(--color-text);
      font-size: 0.95rem;
      transition: all 0.2s;
    }

    .form-control:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .help-text {
      display: block;
      margin-top: 6px;
      color: var(--color-text-subtle);
      font-size: 0.85rem;
    }

    .modal-actions {
      display: flex;
      gap: 12px;
      margin-top: 24px;
    }

    .modal-actions .btn {
      flex: 1;
    }

    @media (max-width: 768px) {
      .integrations-grid {
        grid-template-columns: 1fr;
      }

      .page-header {
        flex-direction: column;
      }

      .modal {
        width: 95%;
      }
    }
  `]
})
export class IntegrationsComponent implements OnInit {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);

  loading = false;
  error = '';
  syncing = false;
  connecting = false;

  showLinkedInForm = false;
  showGitHubForm = false;

  linkedInUrl = '';
  githubUsername = '';

  linkedInIntegration: Integration = {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: '💼',
    description: 'Extract skills from your professional experience, projects, and endorsements',
    status: 'not_connected'
  };

  githubIntegration: Integration = {
    id: 'github',
    name: 'GitHub',
    icon: '🐙',
    description: 'Analyze your repositories to discover programming languages and technologies',
    status: 'not_connected'
  };

  ngOnInit() {
    this.loadIntegrations();
  }

  async loadIntegrations() {
    // Load saved integrations from user profile
    this.loading = true;
    try {
      const userId = this.authService.getUserId();
      if (!userId) {
        this.error = 'Please login to view integrations';
        this.loading = false;
        return;
      }

      // Check profile for connected integrations
      this.apiService.getProfile(userId).subscribe({
        next: (profile) => {
          // Update integration status based on profile data
          if (profile.integrations) {
            if (profile.integrations.linkedin) {
              this.linkedInIntegration.status = 'connected';
              this.linkedInIntegration.lastSync = profile.integrations.linkedin.lastSync;
              this.linkedInIntegration.skillsExtracted = profile.integrations.linkedin.skillsExtracted;
            }
            if (profile.integrations.github) {
              this.githubIntegration.status = 'connected';
              this.githubIntegration.lastSync = profile.integrations.github.lastSync;
              this.githubIntegration.skillsExtracted = profile.integrations.github.skillsExtracted;
            }
          }
          this.loading = false;
        },
        error: (err) => {
          console.error('Failed to load integrations:', err);
          this.loading = false;
        }
      });
    } catch (err: any) {
      this.error = err.message || 'Failed to load integrations';
      this.loading = false;
    }
  }

  async connectLinkedIn() {
    if (!this.linkedInUrl) return;

    this.connecting = true;
    this.error = '';

    try {
      const userId = this.authService.getUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      console.log('[INTEGRATIONS] Connecting LinkedIn:', this.linkedInUrl);

      this.apiService.extractFromLinkedIn(userId, this.linkedInUrl).subscribe({
        next: (response) => {
          console.log('[INTEGRATIONS] ✓ LinkedIn connection initiated:', response);
          this.linkedInIntegration.status = 'pending';
          this.showLinkedInForm = false;
          this.linkedInUrl = '';
          this.connecting = false;

          // Show success message
          alert('LinkedIn profile connected! Skills extraction started. Check back in a few minutes.');

          // Reload integrations
          this.loadIntegrations();
        },
        error: (err) => {
          console.error('[INTEGRATIONS] ✗ LinkedIn connection failed:', err);
          this.error = err.error?.message || err.message || 'Failed to connect LinkedIn. Please try again.';
          this.connecting = false;
        }
      });
    } catch (err: any) {
      console.error('[INTEGRATIONS] ✗ Exception:', err);
      this.error = err.message || 'Failed to connect LinkedIn';
      this.connecting = false;
    }
  }

  async connectGitHub() {
    if (!this.githubUsername) return;

    this.connecting = true;
    this.error = '';

    try {
      const userId = this.authService.getUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      console.log('[INTEGRATIONS] Connecting GitHub:', this.githubUsername);

      this.apiService.extractFromGitHub(userId, this.githubUsername).subscribe({
        next: (response) => {
          console.log('[INTEGRATIONS] ✓ GitHub connection initiated:', response);
          this.githubIntegration.status = 'pending';
          this.showGitHubForm = false;
          this.githubUsername = '';
          this.connecting = false;

          // Show success message
          alert('GitHub account connected! Repository analysis started. Check back in a few minutes.');

          // Reload integrations
          this.loadIntegrations();
        },
        error: (err) => {
          console.error('[INTEGRATIONS] ✗ GitHub connection failed:', err);
          this.error = err.error?.message || err.message || 'Failed to connect GitHub. Please try again.';
          this.connecting = false;
        }
      });
    } catch (err: any) {
      console.error('[INTEGRATIONS] ✗ Exception:', err);
      this.error = err.message || 'Failed to connect GitHub';
      this.connecting = false;
    }
  }

  async syncLinkedIn() {
    this.syncing = true;
    // Re-trigger LinkedIn extraction
    // Implementation depends on backend support for re-sync
    setTimeout(() => {
      this.syncing = false;
      alert('LinkedIn sync feature coming soon!');
    }, 1000);
  }

  async syncGitHub() {
    this.syncing = true;
    // Re-trigger GitHub extraction
    setTimeout(() => {
      this.syncing = false;
      alert('GitHub sync feature coming soon!');
    }, 1000);
  }

  async disconnectLinkedIn() {
    if (!confirm('Are you sure you want to disconnect your LinkedIn profile?')) {
      return;
    }

    this.linkedInIntegration.status = 'not_connected';
    this.linkedInIntegration.lastSync = undefined;
    this.linkedInIntegration.skillsExtracted = undefined;

    // Call API to remove integration
    // Implementation needed
  }

  async disconnectGitHub() {
    if (!confirm('Are you sure you want to disconnect your GitHub account?')) {
      return;
    }

    this.githubIntegration.status = 'not_connected';
    this.githubIntegration.lastSync = undefined;
    this.githubIntegration.skillsExtracted = undefined;

    // Call API to remove integration
    // Implementation needed
  }

  formatDate(dateString?: string): string {
    if (!dateString) return 'Never';

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  }
}
