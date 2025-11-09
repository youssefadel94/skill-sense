import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { ApiService } from '../services/api.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-layout">
      <section class="auth-layout__hero">
        <div class="brand-chip">
          <span class="brand-chip__icon">✨</span>
          <span>Join SkillSense</span>
        </div>
        <h1 class="auth-layout__title">Craft a living, breathing skill portfolio</h1>
        <p class="auth-layout__subtitle">
          Blend your experiences, learning, and aspirations into one coherent narrative driven by trustworthy AI insights.
        </p>
        <ul class="auth-benefits">
          <li>
            <span class="auth-benefits__bullet">◆</span>
            Generate tailored learning paths to close gaps faster.
          </li>
          <li>
            <span class="auth-benefits__bullet">◆</span>
            Keep recruiters updated with verified, evidence-backed skills.
          </li>
          <li>
            <span class="auth-benefits__bullet">◆</span>
            Export polished CVs in seconds for every opportunity.
          </li>
        </ul>
      </section>

      <section class="auth-card glass-panel">
        <header class="auth-card__header">
          <span class="badge">Create your profile</span>
          <h2>Welcome, future-fit talent</h2>
          <p>Tell us a bit about yourself to unlock tailored insights.</p>
        </header>

        <form (ngSubmit)="onSubmit()" #registerForm="ngForm" class="auth-form">
          <div class="form-field">
            <label for="name" class="input-label">Full name</label>
            <input
              type="text"
              id="name"
              name="name"
              autocomplete="name"
              [(ngModel)]="name"
              required
              class="input-control"
              placeholder="Alex Morgan"
            />
          </div>

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
            <label for="password" class="input-label">Password</label>
            <div class="input-affix">
              <input
                [type]="showPassword ? 'text' : 'password'"
                id="password"
                name="password"
                autocomplete="new-password"
                [(ngModel)]="password"
                required
                minlength="6"
                class="input-control"
                placeholder="Minimum 6 characters"
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
            <span class="hint-text">Use at least one number or symbol for better security.</span>
          </div>

          <div class="form-field">
            <label for="confirmPassword" class="input-label">Confirm password</label>
            <div class="input-affix">
              <input
                [type]="showConfirmPassword ? 'text' : 'password'"
                id="confirmPassword"
                name="confirmPassword"
                autocomplete="new-password"
                [(ngModel)]="confirmPassword"
                required
                minlength="6"
                class="input-control"
                placeholder="Re-enter your password"
              />
              <button
                type="button"
                class="icon-button"
                (click)="toggleConfirmPasswordVisibility()"
                [attr.aria-pressed]="showConfirmPassword"
                aria-label="Toggle confirm password visibility"
              >
                {{ showConfirmPassword ? '🙈' : '👁️' }}
              </button>
            </div>
          </div>

          @if (errorMessage) {
            <div class="alert alert-error">{{ errorMessage }}</div>
          }

          @if (password && confirmPassword && password !== confirmPassword) {
            <div class="alert alert-warning">Passwords do not match</div>
          }

          <button
            type="submit"
            class="btn btn-primary auth-submit"
            [disabled]="!registerForm.valid || password !== confirmPassword || loading"
          >
            {{ loading ? 'Creating your Workspace...' : 'Create account' }}
          </button>
        </form>

        <footer class="auth-card__footer">
          <p>Already have access? <a [routerLink]="['/login']">Sign in instead</a></p>
        </footer>
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
      grid-template-columns: 1.05fr 1fr;
      gap: 48px;
      align-items: center;
      min-height: clamp(640px, 90vh, 900px);
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
      background: radial-gradient(360px at 86% 12%, rgba(249, 115, 22, 0.32), rgba(249, 115, 22, 0)), radial-gradient(380px at 14% 88%, rgba(56, 189, 248, 0.18), rgba(56, 189, 248, 0));
      filter: blur(34px);
      opacity: 0.75;
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
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: var(--color-text-muted);
    }

    .brand-chip__icon {
      font-size: 18px;
    }

    .auth-layout__title {
      margin: 36px 0 16px;
      font-size: clamp(2.3rem, 2.8vw, 3rem);
      line-height: 1.08;
      font-weight: 700;
    }

    .auth-layout__subtitle {
      margin: 0 0 28px;
      max-width: 520px;
      color: var(--color-text-muted);
      font-size: 1.06rem;
    }

    .auth-benefits {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: 14px;
      max-width: 520px;
      color: var(--color-text-muted);
      font-size: 0.96rem;
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
      font-size: 2rem;
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

    .hint-text {
      color: var(--color-text-subtle);
      font-size: 0.8rem;
    }

    .auth-submit {
      margin-top: 12px;
    }

    .auth-card__footer {
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

      .icon-button {
        width: 32px;
        height: 32px;
      }
    }
  `]
})
export class RegisterComponent {
  private authService = inject(AuthService);
  private apiService = inject(ApiService);
  private router = inject(Router);

  name = '';
  email = '';
  password = '';
  confirmPassword = '';
  loading = false;
  errorMessage = '';
  showPassword = false;
  showConfirmPassword = false;

  async onSubmit() {
    if (!this.name || !this.email || !this.password || this.password !== this.confirmPassword) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    try {
      // Register user with Firebase Auth
      const user = await this.authService.register(this.email, this.password);
      console.log('User registered with Firebase:', user.uid);

      // Create profile in backend
      try {
        await firstValueFrom(this.apiService.createProfile({
          userId: user.uid,
          name: this.name,
          email: this.email
        }));
        console.log('Profile created successfully');
      } catch (profileError: any) {
        console.error('Failed to create profile:', profileError);
        // Show warning but don't block - profile can be created on login
        this.errorMessage = 'Account created but profile setup incomplete. You can still login.';
        // Wait a bit to show the message
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Navigate to dashboard
      this.router.navigate(['/dashboard']);
    } catch (error: any) {
      console.error('Registration error:', error);
      this.errorMessage = error.message || 'Registration failed. Please try again.';
    } finally {
      this.loading = false;
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }
}
