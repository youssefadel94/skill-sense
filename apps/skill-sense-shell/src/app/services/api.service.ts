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
      switchMap(headers => this.http.post(`${this.apiUrl}/profiles`, data, { headers }))
    );
  }

  getProfile(userId: string): Observable<any> {
    return this.getAuthHeaders().pipe(
      switchMap(headers => this.http.get(`${this.apiUrl}/profiles/${userId}`, { headers }))
    );
  }

  listProfiles(): Observable<any> {
    return this.getAuthHeaders().pipe(
      switchMap(headers => this.http.get(`${this.apiUrl}/profiles`, { headers }))
    );
  }

  // Skill analysis endpoints
  analyzeSkillGaps(userId: string, targetRole: string): Observable<any> {
    return this.getAuthHeaders().pipe(
      switchMap(headers =>
        this.http.get(`${this.apiUrl}/profiles/${userId}/skill-gaps?targetRole=${encodeURIComponent(targetRole)}`, { headers })
      )
    );
  }

  getSkillRecommendations(userId: string, targetRole?: string): Observable<any> {
    const params = targetRole ? `?targetRole=${encodeURIComponent(targetRole)}` : '';
    return this.getAuthHeaders().pipe(
      switchMap(headers => this.http.get(`${this.apiUrl}/profiles/${userId}/recommendations${params}`, { headers }))
    );
  }

  getSkillTrends(): Observable<any> {
    return this.getAuthHeaders().pipe(
      switchMap(headers => this.http.get(`${this.apiUrl}/profiles/trends`, { headers }))
    );
  }

  exportSkills(userId: string, format: 'json' | 'csv' = 'json'): Observable<any> {
    return this.getAuthHeaders().pipe(
      switchMap(headers =>
        this.http.get(`${this.apiUrl}/profiles/${userId}/export?format=${format}`, {
          headers,
          responseType: format === 'csv' ? 'text' : 'json'
        })
      )
    );
  }

  // Extraction endpoints
  extractFromCV(userId: string, file: File): Observable<any> {
    return from(this.auth.getIdToken()).pipe(
      switchMap(token => {
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
      switchMap(headers => this.http.post(`${this.apiUrl}/extraction/github`, { userId, username }, { headers }))
    );
  }

  extractFromLinkedIn(userId: string, profileUrl: string): Observable<any> {
    return this.getAuthHeaders().pipe(
      switchMap(headers => this.http.post(`${this.apiUrl}/extraction/linkedin`, { userId, profileUrl }, { headers }))
    );
  }

  // Search endpoints
  searchSkills(query: string, userId?: string, limit?: number): Observable<any> {
    let params = `q=${encodeURIComponent(query)}`;
    if (userId) params += `&userId=${userId}`;
    if (limit) params += `&limit=${limit}`;

    return this.getAuthHeaders().pipe(
      switchMap(headers => this.http.get(`${this.apiUrl}/search/skills?${params}`, { headers }))
    );
  }

  findSimilarProfiles(userId: string, limit?: number): Observable<any> {
    const params = limit ? `?limit=${limit}` : '';
    return this.getAuthHeaders().pipe(
      switchMap(headers => this.http.get(`${this.apiUrl}/search/similar-profiles/${userId}${params}`, { headers }))
    );
  }
}
