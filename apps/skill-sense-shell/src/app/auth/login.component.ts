import { Component, inject } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { ApiService } from '../services/api.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-layout">
      <section class="auth-layout__hero">
        <div class="brand-chip">
          <span class="brand-chip__icon">⚡</span>
          <span>SkillSense</span>
        </div>
        <h1 class="auth-layout__title">Return to your skill intelligence hub</h1>
        <p class="auth-layout__subtitle">
          Monitor capabilities, uncover growth opportunities, and stay ahead with curated learning signals.
        </p>
        <ul class="auth-benefits">
          <li>
            <span class="auth-benefits__bullet">◆</span>
            Unified profile across CVs, GitHub, and LinkedIn.
          </li>
          <li>
            <span class="auth-benefits__bullet">◆</span>
            AI-driven recommendations tuned to your ambitions.
          </li>
          <li>
            <span class="auth-benefits__bullet">◆</span>
            Real-time skill confidence tracking with evidence.
          </li>
        </ul>
      </section>

      <section class="auth-card glass-panel">
        <header class="auth-card__header">
          <span class="badge">Members Portal</span>
          <h2>Welcome back</h2>
          <p>Sign in to pick up right where you left off.</p>
        </header>

        <form (ngSubmit)="onSubmit()" #loginForm="ngForm" class="auth-form">
          <div class="form-field">
            <label for="email" class="input-label">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              autocomplete="email"
              [(ngModel)]="email"
              required
              email
              class="input-control"
              placeholder="you@skillsense.ai"
            />
          </div>

          <div class="form-field">
            <div class="input-label-row">
              <label for="password" class="input-label">Password</label>
              <button type="button" class="btn-link" (click)="showForgotPassword($event)">Forgot?</button>
            </div>
            <div class="input-affix">
              <input
                [type]="showPassword ? 'text' : 'password'"
                id="password"
                name="password"
                autocomplete="current-password"
                [(ngModel)]="password"
                required
                minlength="6"
                class="input-control"
                placeholder="Enter your password"
              />
              <button
                type="button"
                class="icon-button"
                (click)="togglePasswordVisibility()"
                [attr.aria-pressed]="showPassword"
                aria-label="Toggle password visibility"
              >
                {{ showPassword ? '🙈' : '👁️' }}
              </button>
            </div>
          </div>

          @if (errorMessage) {
            <div class="alert alert-error">{{ errorMessage }}</div>
          }

          @if (successMessage) {
            <div class="alert alert-success">{{ successMessage }}</div>
          }

          <button
            type="submit"
            class="btn btn-primary auth-submit"
            [disabled]="!loginForm.valid || loading"
          >
            {{ loading ? 'Signing you in...' : 'Continue' }}
          </button>
        </form>

        <footer class="auth-card__footer">
          <p>
            New to SkillSense?
            <a [routerLink]="['/register']">Create an account</a>
          </p>
          <p class="support-text">Need access? Reach us at <a href="mailto:team@skillsense.ai">team@skillsense.ai</a></p>
        </footer>

        @if (showForgotModal) {
          <div class="modal" (click)="closeForgotModal()">
            <div class="modal__content glass-panel" (click)="$event.stopPropagation()">
              <header class="modal__header">
                <div>
                  <span class="badge">Password Reset</span>
                  <h3>Get back into SkillSense</h3>
                  <p>We will email you a secure link to set a new password.</p>
                </div>
                <button class="icon-button icon-button--ghost" (click)="closeForgotModal()" aria-label="Close reset dialog">×</button>
              </header>
              <div class="modal__body">
                <label for="resetEmail" class="input-label">Email</label>
                <input
                  type="email"
                  id="resetEmail"
                  [(ngModel)]="resetEmail"
                  class="input-control"
                  placeholder="Enter the email you registered with"
                />
                @if (resetError) {
                  <div class="alert alert-error">{{ resetError }}</div>
                }
                @if (resetSuccess) {
                  <div class="alert alert-success">{{ resetSuccess }}</div>
                }
              </div>
              <footer class="modal__footer">
                <button class="btn btn-ghost" type="button" (click)="closeForgotModal()">Cancel</button>
                <button
                  class="btn btn-primary"
                  type="button"
                  (click)="sendResetEmail()"
                  [disabled]="!resetEmail || resetting"
                >
                  {{ resetting ? 'Sending...' : 'Send reset link' }}
                </button>
              </footer>
            </div>
          </div>
        }
      </section>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .auth-layout {
      position: relative;
      display: grid;
      grid-template-columns: 1.1fr 1fr;
      gap: 48px;
      align-items: center;
      min-height: clamp(640px, 90vh, 880px);
      padding: 36px;
      background: rgba(15, 23, 42, 0.4);
      border-radius: var(--radius-lg);
      border: 1px solid var(--color-border);
      box-shadow: var(--shadow-lg);
      backdrop-filter: blur(24px);
    }

    .auth-layout__hero {
      padding: 32px 40px;
      position: relative;
    }

    .auth-layout__hero::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: var(--radius-lg);
      background: radial-gradient(340px at 12% 5%, rgba(99, 102, 241, 0.32), rgba(99, 102, 241, 0)), radial-gradient(420px at 88% 90%, rgba(14, 165, 233, 0.18), rgba(14, 165, 233, 0));
      filter: blur(32px);
      opacity: 0.7;
      pointer-events: none;
    }

    .brand-chip {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 10px 18px;
      border-radius: 999px;
      border: 1px solid rgba(148, 163, 184, 0.24);
      background: rgba(148, 163, 184, 0.08);
      backdrop-filter: blur(10px);
      font-weight: 600;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: var(--color-text-muted);
    }

    .brand-chip__icon {
      font-size: 18px;
    }

    .auth-layout__title {
      margin: 36px 0 16px;
      font-size: clamp(2.25rem, 2.6vw, 2.9rem);
      line-height: 1.1;
      font-weight: 700;
    }

    .auth-layout__subtitle {
      margin: 0 0 28px;
      max-width: 480px;
      color: var(--color-text-muted);
      font-size: 1.05rem;
    }

    .auth-benefits {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: 14px;
      max-width: 480px;
      color: var(--color-text-muted);
      font-size: 0.95rem;
    }

    .auth-benefits__bullet {
      color: var(--color-primary);
      margin-right: 12px;
    }

    .auth-card {
      position: relative;
      padding: 40px;
      display: flex;
      flex-direction: column;
      gap: 24px;
      z-index: 1;
    }

    .auth-card__header h2 {
      margin: 18px 0 10px;
      font-size: 1.9rem;
      font-weight: 700;
    }

    .auth-card__header p {
      margin: 0;
      color: var(--color-text-muted);
    }

    .auth-form {
      display: grid;
      gap: 20px;
    }

    .form-field {
      display: grid;
      gap: 10px;
    }

    .input-label-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .btn-link {
      background: none;
      border: none;
      color: var(--color-text-muted);
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      text-decoration: underline;
      text-underline-offset: 4px;
      transition: color 0.2s ease;
    }

    .btn-link:hover {
      color: var(--color-primary);
    }

    .input-affix {
      position: relative;
      display: flex;
      align-items: center;
    }

    .input-affix .input-control {
      padding-right: 52px;
    }

    .icon-button {
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      background: rgba(148, 163, 184, 0.12);
      border: 1px solid rgba(148, 163, 184, 0.24);
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: var(--color-text-muted);
      transition: background 0.2s ease, border-color 0.2s ease;
    }

    .icon-button:hover {
      background: rgba(148, 163, 184, 0.2);
      border-color: rgba(148, 163, 184, 0.4);
    }

    .icon-button--ghost {
      position: static;
      transform: none;
      background: transparent;
      border-color: rgba(148, 163, 184, 0.2);
      width: 38px;
      height: 38px;
      font-size: 22px;
    }

    .auth-submit {
      margin-top: 12px;
    }

    .auth-card__footer {
      display: grid;
      gap: 8px;
      text-align: center;
      font-size: 0.92rem;
      color: var(--color-text-muted);
    }

    .auth-card__footer a {
      color: var(--color-text);
      font-weight: 600;
    }

    .auth-card__footer a:hover {
      color: var(--color-primary);
    }

    .support-text {
      margin: 0;
      font-size: 0.85rem;
    }

    .modal {
      position: fixed;
      inset: 0;
      background: rgba(2, 6, 23, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      z-index: 1010;
    }

    .modal__content {
      width: min(520px, calc(100vw - 48px));
      padding: 32px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .modal__header {
      display: flex;
      justify-content: space-between;
      gap: 18px;
      align-items: flex-start;
    }

    .modal__header h3 {
      margin: 12px 0 6px;
      font-size: 1.5rem;
    }

    .modal__header p {
      margin: 0;
      color: var(--color-text-muted);
      font-size: 0.95rem;
    }

    .modal__body {
      display: grid;
      gap: 16px;
    }

    .modal__footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }

    @media (max-width: 1120px) {
      .auth-layout {
        grid-template-columns: 1fr;
        padding: 28px;
      }

      .auth-layout__hero {
        order: 2;
        text-align: center;
      }

      .auth-layout__hero::before {
        display: none;
      }

      .auth-benefits {
        justify-items: center;
      }

      .auth-card {
        order: 1;
      }
    }

    @media (max-width: 640px) {
      .auth-layout {
        padding: 18px;
      }

      .auth-card {
        padding: 28px 24px;
      }

      .modal__content {
        padding: 24px;
      }

      .icon-button {
        width: 32px;
        height: 32px;
      }
    }
  `]
})
export class LoginComponent {
  private authService = inject(AuthService);
  private apiService = inject(ApiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  email = '';
  password = '';
  loading = false;
  errorMessage = '';
  successMessage = '';
  showPassword = false;

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
      // Login with Firebase
      const user = await this.authService.login(this.email, this.password);

      // Ensure profile exists (will create if missing)
      try {
        await firstValueFrom(
          this.apiService.ensureProfile(
            user.uid,
            user.email || this.email,
            user.displayName || undefined
          )
        );
        console.log('Profile verified/created for user');
      } catch (profileError) {
        console.error('Profile check/creation failed:', profileError);
        // Don't block login if profile operations fail
      }

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

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
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
