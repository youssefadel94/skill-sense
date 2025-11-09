import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login.component';
import { RegisterComponent } from './auth/register.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ProfileComponent } from './profile/profile.component';
import { UploadComponent } from './upload/upload.component';
import { authGuard } from './auth/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
  { path: 'upload', component: UploadComponent, canActivate: [authGuard] },
  // Additional routes to be added in next phase:
  // { path: 'gaps', component: SkillGapsComponent, canActivate: [authGuard] },
  // { path: 'recommendations', component: RecommendationsComponent, canActivate: [authGuard] },
  // { path: 'trends', component: TrendsComponent, canActivate: [authGuard] },
];
