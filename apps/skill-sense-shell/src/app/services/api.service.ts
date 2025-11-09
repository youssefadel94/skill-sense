import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from, switchMap } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private apiUrl = environment.apiUrl;

  private getAuthHeaders(): Observable<HttpHeaders> {
    return from(this.auth.getIdToken()).pipe(
      switchMap(token => {
        let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
        if (token) {
          headers = headers.set('Authorization', `Bearer ${token}`);
        }
        return [headers];
      })
    );
  }

  // Profile endpoints
  createProfile(data: any): Observable<any> {
    return this.getAuthHeaders().pipe(
      switchMap(async (headers) => this.http.post(`${this.apiUrl}/profiles`, data, { headers }))
    );
  }

  getProfile(userId: string): Observable<any> {
    return this.getAuthHeaders().pipe(
      switchMap(async (headers) => this.http.get(`${this.apiUrl}/profiles/${userId}`, { headers }))
    );
  }

  listProfiles(): Observable<any> {
    return this.getAuthHeaders().pipe(
      switchMap(async (headers) => this.http.get(`${this.apiUrl}/profiles`, { headers }))
    );
  }

  // Skill analysis endpoints
  analyzeSkillGaps(userId: string, targetRole: string): Observable<any> {
    return this.getAuthHeaders().pipe(
      switchMap(async (headers) => this.http.get(`${this.apiUrl}/profiles/${userId}/skill-gaps?targetRole=${encodeURIComponent(targetRole)}`, { headers })
      )
    );
  }

  getSkillRecommendations(userId: string, targetRole?: string): Observable<any> {
    const params = targetRole ? `?targetRole=${encodeURIComponent(targetRole)}` : '';
    return this.getAuthHeaders().pipe(
      switchMap(async (headers) => this.http.get(`${this.apiUrl}/profiles/${userId}/recommendations${params}`, { headers }))
    );
  }

  getSkillTrends(): Observable<any> {
    return this.getAuthHeaders().pipe(
      switchMap(async (headers) => this.http.get(`${this.apiUrl}/profiles/trends`, { headers }))
    );
  }

  exportSkills(userId: string, format: 'json' | 'csv' = 'json'): Observable<any> {
    return this.getAuthHeaders().pipe(
      switchMap(async (headers) => this.http.get(`${this.apiUrl}/profiles/${userId}/export?format=${format}`, {
          headers,
          responseType: format === 'csv' ? 'text' : 'json'
        })
      )
    );
  }

  // Extraction endpoints
  extractFromCV(userId: string, file: File): Observable<any> {
    return from(this.auth.getIdToken()).pipe(
      switchMap((token) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('userId', userId);

        let headers = new HttpHeaders();
        if (token) {
          headers = headers.set('Authorization', `Bearer ${token}`);
        }

        return this.http.post(`${this.apiUrl}/extraction/cv`, formData, { headers });
      })
    );
  }

  extractFromGitHub(userId: string, username: string): Observable<any> {
    return this.getAuthHeaders().pipe(
      switchMap(async (headers) => this.http.post(`${this.apiUrl}/extraction/github`, { userId, username }, { headers }))
    );
  }

  extractFromLinkedIn(userId: string, profileUrl: string): Observable<any> {
    return this.getAuthHeaders().pipe(
      switchMap(async (headers) => this.http.post(`${this.apiUrl}/extraction/linkedin`, { userId, profileUrl }, { headers }))
    );
  }

  // Search endpoints
  searchSkills(query: string, userId?: string, limit?: number): Observable<any> {
    let params = `q=${encodeURIComponent(query)}`;
    if (userId) params += `&userId=${userId}`;
    if (limit) params += `&limit=${limit}`;

    return this.getAuthHeaders().pipe(
      switchMap(async (headers) => this.http.get(`${this.apiUrl}/search/skills?${params}`, { headers }))
    );
  }

  findSimilarProfiles(userId: string, limit?: number): Observable<any> {
    const params = limit ? `?limit=${limit}` : '';
    return this.getAuthHeaders().pipe(
      switchMap(async (headers) => this.http.get(`${this.apiUrl}/search/similar-profiles/${userId}${params}`, { headers }))
    );
  }

  // CV Generation endpoints
  generateCV(userId: string, config: {
    targetRole?: string;
    template: string;
    format: 'pdf' | 'docx' | 'html';
    sections: {
      summary: boolean;
      skills: boolean;
      evidence: boolean;
      certifications: boolean;
      achievements: boolean;
    };
    emphasisCategories?: string[];
  }): Observable<any> {
    return this.getAuthHeaders().pipe(
      switchMap(async (headers) => this.http.post(`${this.apiUrl}/profiles/${userId}/cv/generate`, config, { headers }))
    );
  }

  getRecentCVs(userId: string, limit: number = 10): Observable<any> {
    return this.getAuthHeaders().pipe(
      switchMap(async (headers) => this.http.get(`${this.apiUrl}/profiles/${userId}/cv/recent?limit=${limit}`, { headers }))
    );
  }

  downloadCV(cvId: string): Observable<Blob> {
    return this.getAuthHeaders().pipe(
      switchMap(async (headers) => this.http.get(`${this.apiUrl}/cv/${cvId}/download`, {
          headers,
          responseType: 'blob'
        }))
    );
  }

  // Role Matching endpoints
  matchRoles(userId: string, searchParams: {
    query?: string;
    location?: string;
    minScore?: number;
    sortBy?: 'match' | 'salary' | 'date';
  }): Observable<any> {
    const params = new URLSearchParams();
    if (searchParams.query) params.append('q', searchParams.query);
    if (searchParams.location) params.append('location', searchParams.location);
    if (searchParams.minScore !== undefined) params.append('minScore', searchParams.minScore.toString());
    if (searchParams.sortBy) params.append('sortBy', searchParams.sortBy);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    return this.getAuthHeaders().pipe(
      switchMap(async (headers) => this.http.get(`${this.apiUrl}/profiles/${userId}/match-roles${queryString}`, { headers }))
    );
  }

  getJobMatchAnalysis(userId: string, jobId: string): Observable<any> {
    return this.getAuthHeaders().pipe(
      switchMap(async (headers) => this.http.get(`${this.apiUrl}/profiles/${userId}/match-analysis/${jobId}`, { headers }))
    );
  }

  // Learning Paths endpoints
  getLearningPaths(userId: string): Observable<any> {
    return this.getAuthHeaders().pipe(
      switchMap(async (headers) => this.http.get(`${this.apiUrl}/profiles/${userId}/learning-paths`, { headers }))
    );
  }

  generateLearningPath(userId: string, config: {
    targetGoal: string;
    learningStyle: 'balanced' | 'practical' | 'theoretical' | 'fast';
    timeCommitment: number;
  }): Observable<any> {
    return this.getAuthHeaders().pipe(
      switchMap(async (headers) => this.http.post(`${this.apiUrl}/profiles/${userId}/learning-paths/generate`, config, { headers }))
    );
  }

  updateLearningPathProgress(userId: string, pathId: string, stepId: string, completed: boolean): Observable<any> {
    return this.getAuthHeaders().pipe(
      switchMap(async (headers) => this.http.patch(
          `${this.apiUrl}/profiles/${userId}/learning-paths/${pathId}/steps/${stepId}`,
          { completed },
          { headers }
        ))
    );
  }

  deleteLearningPath(userId: string, pathId: string): Observable<any> {
    return this.getAuthHeaders().pipe(
      switchMap(async (headers) => this.http.delete(`${this.apiUrl}/profiles/${userId}/learning-paths/${pathId}`, { headers }))
    );
  }
}
