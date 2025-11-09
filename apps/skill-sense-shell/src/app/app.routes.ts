import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login.component';
import { RegisterComponent } from './auth/register.component';
import { authGuard } from './auth/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  // Protected routes will be added in Phase 2:
  // { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  // { path: 'upload', component: UploadComponent, canActivate: [authGuard] },
  // { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
  // { path: 'gaps', component: SkillGapsComponent, canActivate: [authGuard] },
  // { path: 'recommendations', component: RecommendationsComponent, canActivate: [authGuard] },
  // { path: 'trends', component: TrendsComponent, canActivate: [authGuard] },
];
