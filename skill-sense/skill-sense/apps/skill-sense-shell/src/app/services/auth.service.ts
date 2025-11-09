import { Injectable, inject } from '@angular/core';
import {
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  confirmPasswordReset,
  User
} from '@angular/fire/auth';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth: Auth = inject(Auth);
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    // Listen to auth state changes
    this.auth.onAuthStateChanged((user) => {
      this.currentUserSubject.next(user);
    });
  }

  async login(email: string, password: string) {
    try {
      const credential = await signInWithEmailAndPassword(this.auth, email, password);
      return credential.user;
    } catch (error: any) {
      console.error('Firebase login error:', error);

      // Provide user-friendly error messages
      let errorMessage = 'Login failed. Please try again.';

      if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled.';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password.';
      } else if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid email or password.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      throw new Error(errorMessage);
    }
  }

  async register(email: string, password: string) {
    try {
      const credential = await createUserWithEmailAndPassword(this.auth, email, password);
      return credential.user;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  async logout() {
    try {
      await signOut(this.auth);
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  async forgotPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(this.auth, email);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to send password reset email');
    }
  }

  async resetPassword(oobCode: string, newPassword: string): Promise<void> {
    try {
      await confirmPasswordReset(this.auth, oobCode, newPassword);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to reset password');
    }
  }

  async getIdToken(): Promise<string | null> {
    const currentUser = this.auth.currentUser;
    if (currentUser) {
      return await currentUser.getIdToken();
    }
    return null;
  }

  getCurrentUser(): User | null {
    return this.auth.currentUser;
  }

  getUserId(): string | null {
    return this.auth.currentUser?.uid || null;
  }

  isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null;
  }
}
