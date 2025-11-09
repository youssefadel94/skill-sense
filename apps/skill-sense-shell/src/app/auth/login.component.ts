import { Component, inject } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="login-container">
      <div class="login-card">
        <h2>SkillSense Login</h2>

        <form (ngSubmit)="onSubmit()" #loginForm="ngForm">
          <div class="form-group">
            <label for="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              [(ngModel)]="email"
              required
              email
              class="form-control"
              placeholder="Enter your email"
            />
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              [(ngModel)]="password"
              required
              minlength="6"
              class="form-control"
              placeholder="Enter your password"
            />
          </div>

          @if (errorMessage) {
            <div class="alert alert-error">{{ errorMessage }}</div>
          }

          @if (successMessage) {
            <div class="alert alert-success">{{ successMessage }}</div>
          }

          <button
            type="submit"
            class="btn btn-primary"
            [disabled]="!loginForm.valid || loading"
          >
            {{ loading ? 'Logging in...' : 'Login' }}
          </button>
        </form>

        <div class="form-footer">
          <p>
            <a href="#" (click)="showForgotPassword($event)" class="forgot-link">Forgot password?</a>
          </p>
          <p>Don't have an account? <a [routerLink]="['/register']">Register here</a></p>
        </div>

        <!-- Forgot Password Modal -->
        @if (showForgotModal) {
          <div class="modal-overlay" (click)="closeForgotModal()">
            <div class="modal-content" (click)="$event.stopPropagation()">
              <div class="modal-header">
                <h3>Reset Password</h3>
                <button class="btn-close" (click)="closeForgotModal()">×</button>
              </div>
              <div class="modal-body">
                <p>Enter your email address and we'll send you a link to reset your password.</p>
                <div class="form-group">
                  <label for="resetEmail">Email</label>
                  <input
                    type="email"
                    id="resetEmail"
                    [(ngModel)]="resetEmail"
                    class="form-control"
                    placeholder="Enter your email"
                  />
                </div>
                @if (resetError) {
                  <div class="alert alert-error">{{ resetError }}</div>
                }
                @if (resetSuccess) {
                  <div class="alert alert-success">{{ resetSuccess }}</div>
                }
              </div>
              <div class="modal-footer">
                <button class="btn btn-secondary" (click)="closeForgotModal()">Cancel</button>
                <button
                  class="btn btn-primary"
                  (click)="sendResetEmail()"
                  [disabled]="!resetEmail || resetting"
                >
                  {{ resetting ? 'Sending...' : 'Send Reset Link' }}
                </button>
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }

    .login-card {
      background: white;
      border-radius: 12px;
      padding: 40px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      width: 100%;
      max-width: 400px;
    }

    h2 {
      margin: 0 0 30px 0;
      color: #333;
      text-align: center;
      font-size: 28px;
      font-weight: 600;
    }

    .form-group {
      margin-bottom: 20px;
    }

    label {
      display: block;
      margin-bottom: 8px;
      color: #555;
      font-weight: 500;
      font-size: 14px;
    }

    .form-control {
      width: 100%;
      padding: 12px 16px;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 15px;
      transition: all 0.3s ease;
      box-sizing: border-box;
    }

    .form-control:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .alert {
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 20px;
      font-size: 14px;
    }

    .alert-error {
      background: #fee;
      color: #c33;
      border: 1px solid #fcc;
    }

    .btn {
      width: 100%;
      padding: 14px;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .form-footer {
      margin-top: 24px;
      text-align: center;
    }

    .form-footer p {
      margin: 0;
      color: #666;
      font-size: 14px;
    }

    .form-footer a {
      color: #667eea;
      text-decoration: none;
      font-weight: 600;
    }

    .form-footer a:hover {
      text-decoration: underline;
    }

    .forgot-link {
      font-size: 14px;
    }

    .alert-success {
      background: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }

    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 20px;
    }

    .modal-content {
      background: white;
      border-radius: 12px;
      max-width: 500px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }

    .modal-header {
      padding: 20px 24px;
      border-bottom: 1px solid #e0e0e0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .modal-header h3 {
      margin: 0;
      color: #333;
      font-size: 20px;
    }

    .btn-close {
      background: none;
      border: none;
      font-size: 28px;
      color: #999;
      cursor: pointer;
      padding: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: all 0.2s;
    }

    .btn-close:hover {
      background: #f0f0f0;
      color: #333;
    }

    .modal-body {
      padding: 24px;
    }

    .modal-body p {
      color: #666;
      margin: 0 0 20px 0;
      line-height: 1.5;
    }

    .modal-footer {
      padding: 16px 24px;
      border-top: 1px solid #e0e0e0;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }

    .modal-footer .btn {
      width: auto;
      padding: 10px 24px;
    }

    .btn-secondary {
      background: #6c757d;
      color: white;
    }

    .btn-secondary:hover:not(:disabled) {
      background: #5a6268;
    }
  `]
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  email = '';
  password = '';
  loading = false;
  errorMessage = '';
  successMessage = '';

  // Forgot password modal
  showForgotModal = false;
  resetEmail = '';
  resetting = false;
  resetError = '';
  resetSuccess = '';

  async onSubmit() {
    if (!this.email || !this.password) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    try {
      await this.authService.login(this.email, this.password);

      // Get return URL from query parameters or default to dashboard
      const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
      this.router.navigate([returnUrl]);
    } catch (error: any) {
      this.errorMessage = error.message || 'Login failed. Please check your credentials.';
    } finally {
      this.loading = false;
    }
  }

  showForgotPassword(event: Event) {
    event.preventDefault();
    this.showForgotModal = true;
    this.resetEmail = this.email; // Pre-fill with login email
    this.resetError = '';
    this.resetSuccess = '';
  }

  closeForgotModal() {
    this.showForgotModal = false;
    this.resetEmail = '';
    this.resetError = '';
    this.resetSuccess = '';
  }

  async sendResetEmail() {
    if (!this.resetEmail) {
      this.resetError = 'Please enter your email address';
      return;
    }

    this.resetting = true;
    this.resetError = '';
    this.resetSuccess = '';

    try {
      await this.authService.forgotPassword(this.resetEmail);
      this.resetSuccess = 'Password reset email sent! Check your inbox.';

      // Close modal after 3 seconds
      setTimeout(() => {
        this.closeForgotModal();
      }, 3000);
    } catch (error: any) {
      this.resetError = error.message || 'Failed to send reset email. Please try again.';
    } finally {
      this.resetting = false;
    }
  }
}
