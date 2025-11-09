import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login.component';
import { RegisterComponent } from './auth/register.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ProfileComponent } from './profile/profile.component';
import { UploadComponent } from './upload/upload.component';
import { IntegrationsComponent } from './integrations/integrations.component';
import { SkillGapsComponent } from './gaps/skill-gaps.component';
import { RecommendationsComponent } from './recommendations/recommendations.component';
import { TrendsComponent } from './trends/trends.component';
import { CvGeneratorComponent } from './cv-generator/cv-generator.component';
import { RoleMatcherComponent } from './role-matcher/role-matcher.component';
import { LearningPathsComponent } from './learning-paths/learning-paths.component';
import { authGuard } from './auth/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
  { path: 'profile/:id', component: ProfileComponent, canActivate: [authGuard] },
  { path: 'upload', component: UploadComponent, canActivate: [authGuard] },
  { path: 'integrations', component: IntegrationsComponent, canActivate: [authGuard] },
  { path: 'gaps', component: SkillGapsComponent, canActivate: [authGuard] },
  { path: 'recommendations', component: RecommendationsComponent, canActivate: [authGuard] },
  { path: 'trends', component: TrendsComponent, canActivate: [authGuard] },
  { path: 'cv-generator', component: CvGeneratorComponent, canActivate: [authGuard] },
  { path: 'role-matcher', component: RoleMatcherComponent, canActivate: [authGuard] },
  { path: 'learning-paths', component: LearningPathsComponent, canActivate: [authGuard] },
];
