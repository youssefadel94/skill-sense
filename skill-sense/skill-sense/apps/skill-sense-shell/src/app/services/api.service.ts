import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from, switchMap, catchError, throwError, map, shareReplay, tap, timeout } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private apiUrl = environment.apiUrl;

  // Cache for profile creation to prevent duplicates
  private profileCreationCache = new Map<string, Observable<any>>();

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
      switchMap((headers) => this.http.post(`${this.apiUrl}/profiles`, data, { headers }))
    );
  }

  getProfile(userId: string): Observable<any> {
    console.log('[API SERVICE] getProfile called for userId:', userId);
    return this.getAuthHeaders().pipe(
      switchMap((headers) => {
        const url = `${this.apiUrl}/profiles/${userId}`;
        console.log('[API SERVICE] Fetching profile from:', url);
        return this.http.get(url, { headers });
      }),
      tap((response: any) => console.log('[API SERVICE] ✓ Profile response:', response)),
      catchError((error: any) => {
        console.error('[API SERVICE] ✗ Profile fetch error:', error);
        throw error;
      })
    );
  }

  listProfiles(): Observable<any> {
    return this.getAuthHeaders().pipe(
      switchMap((headers) => this.http.get(`${this.apiUrl}/profiles`, { headers }))
    );
  }

  getCVSignedUrl(userId: string, cvGcsUri: string): Observable<{ url: string }> {
    console.log('[API SERVICE] Getting signed URL for CV:', cvGcsUri);
    const encodedUri = encodeURIComponent(cvGcsUri);
    return this.getAuthHeaders().pipe(
      switchMap((headers) => this.http.get<{ url: string }>(`${this.apiUrl}/profiles/${userId}/cvs/${encodedUri}/signed-url`, { headers })),
      tap((response: any) => console.log('[API SERVICE] ✓ Signed URL received:', response.url)),
      catchError((error: any) => {
        console.error('[API SERVICE] ✗ Failed to get signed URL:', error);
        throw error;
      })
    );
  }

  deleteCV(userId: string, cvGcsUri: string): Observable<any> {
    const encodedUri = encodeURIComponent(cvGcsUri);
    return this.getAuthHeaders().pipe(
      switchMap((headers) => this.http.delete(`${this.apiUrl}/profiles/${userId}/cvs/${encodedUri}`, { headers }))
    );
  }

  /**
   * Ensures a profile exists for the user. Creates one if missing.
   * @param userId - Firebase user ID
   * @param email - User email address
   * @param name - User display name
   * @returns Observable of the profile
   */
  ensureProfile(userId: string, email: string, name?: string): Observable<any> {
    console.log('ensureProfile called for userId:', userId);

    // Check if we're already creating a profile for this user
    if (this.profileCreationCache.has(userId)) {
      console.log('Profile creation already in progress for user:', userId);
      return this.profileCreationCache.get(userId)!;
    }

    const profileRequest = this.getProfile(userId).pipe(
      map((profile) => {
        // Handle null response (before backend fix is deployed)
        if (!profile) {
          console.log('Profile returned null, treating as not found');
          throw { status: 404, message: 'Profile not found' };
        }
        console.log('Profile found:', profile);
        // Clear cache on success
        this.profileCreationCache.delete(userId);
        return profile;
      }),
      catchError((error) => {
        console.log('getProfile error:', error);
        console.log('Error status:', error.status);
        console.log('Error statusText:', error.statusText);

        // If profile not found (404, null response, or network error), create it
        if (error.status === 404 || error.status === 0 || !error.status) {
          console.log('Profile not found (status:', error.status, '), creating new profile for user:', userId);
          const profileData = {
            userId,
            email,
            name: name || email.split('@')[0] || 'User'
          };
          console.log('Creating profile with data:', profileData);
          return this.createProfile(profileData).pipe(
            map(createdProfile => {
              // Clear cache after successful creation
              this.profileCreationCache.delete(userId);
              return createdProfile;
            }),
            catchError(createError => {
              // Clear cache on error too
              this.profileCreationCache.delete(userId);
              return throwError(() => createError);
            })
          );
        }

        // Re-throw other errors
        console.error('Unexpected error while checking profile:', error);
        this.profileCreationCache.delete(userId);
        return throwError(() => error);
      }),
      shareReplay(1) // Share the result among multiple subscribers
    );

    // Cache the request
    this.profileCreationCache.set(userId, profileRequest);

    return profileRequest;
  }

  // Skill analysis endpoints
  analyzeSkillGaps(userId: string, targetRole: string): Observable<any> {
    console.log('[API] Requesting skill gap analysis...');
    return this.getAuthHeaders().pipe(
      switchMap((headers) =>
        this.http.get(`${this.apiUrl}/profiles/${userId}/skill-gaps?targetRole=${encodeURIComponent(targetRole)}`, { headers })
          .pipe(
            timeout(120000), // 2 minute timeout for AI analysis
            tap(response => console.log('[API] ✓ Skill gap analysis complete:', response)),
            catchError(err => {
              console.error('[API] ✗ Skill gap analysis failed:', err);
              if (err.name === 'TimeoutError') {
                return throwError(() => new Error('Analysis is taking too long. Please try again.'));
              }
              return throwError(() => err);
            })
          )
      )
    );
  }

  getSkillRecommendations(userId: string, targetRole?: string): Observable<any> {
    const params = targetRole ? `?targetRole=${encodeURIComponent(targetRole)}` : '';
    return this.getAuthHeaders().pipe(
      switchMap((headers) => this.http.get(`${this.apiUrl}/profiles/${userId}/recommendations${params}`, { headers }))
    );
  }

  getSkillTrends(): Observable<any> {
    return this.getAuthHeaders().pipe(
      switchMap((headers) => this.http.get(`${this.apiUrl}/profiles/trends`, { headers }))
    );
  }

  exportSkills(userId: string, format: 'json' | 'csv' = 'json'): Observable<any> {
    return this.getAuthHeaders().pipe(
      switchMap((headers) => this.http.get(`${this.apiUrl}/profiles/${userId}/export?format=${format}`, {
          headers,
          responseType: format === 'csv' ? 'text' : 'json'
        } as any)
      )
    );
  }

  // Extraction endpoints
  extractFromCV(userId: string, file: File): Observable<any> {
    console.log('[API SERVICE] extractFromCV called:', { userId, fileName: file.name, fileSize: file.size, fileType: file.type });

    return from(this.auth.getIdToken()).pipe(
      switchMap((token) => {
        console.log('[API SERVICE] Auth token obtained:', token ? 'Yes' : 'No');

        const formData = new FormData();
        formData.append('file', file);
        formData.append('userId', userId);

        let headers = new HttpHeaders();
        if (token) {
          headers = headers.set('Authorization', `Bearer ${token}`);
        }

        const url = `${this.apiUrl}/extraction/cv`;
        console.log('[API SERVICE] Sending POST request to:', url);
        console.log('[API SERVICE] FormData contents:', { userId, fileName: file.name });

        return this.http.post(url, formData, { headers }).pipe(
          map(response => {
            console.log('[API SERVICE] ✓ CV extraction response received:', response);
            return response;
          }),
          catchError(error => {
            console.error('[API SERVICE] ✗ CV extraction request failed:', error);
            console.error('[API SERVICE] Error details:', {
              status: error.status,
              statusText: error.statusText,
              message: error.error?.message,
              url: error.url
            });
            return throwError(() => error);
          })
        );
      })
    );
  }

  extractFromGitHub(userId: string, username: string): Observable<any> {
    console.log('[API SERVICE] extractFromGitHub called:', { userId, username });

    return this.getAuthHeaders().pipe(
      switchMap((headers) => {
        console.log('[API SERVICE] Sending GitHub extraction request...');
        return this.http.post(`${this.apiUrl}/extraction/github`, { userId, username }, { headers }).pipe(
          map(response => {
            console.log('[API SERVICE] ✓ GitHub extraction response:', response);
            return response;
          }),
          catchError(error => {
            console.error('[API SERVICE] ✗ GitHub extraction failed:', error);
            return throwError(() => error);
          })
        );
      })
    );
  }

  extractFromLinkedIn(userId: string, profileUrl: string): Observable<any> {
    console.log('[API SERVICE] extractFromLinkedIn called:', { userId, profileUrl });

    return this.getAuthHeaders().pipe(
      switchMap((headers) => {
        console.log('[API SERVICE] Sending LinkedIn extraction request...');
        return this.http.post(`${this.apiUrl}/extraction/linkedin`, { userId, profileUrl }, { headers }).pipe(
          map(response => {
            console.log('[API SERVICE] ✓ LinkedIn extraction response:', response);
            return response;
          }),
          catchError(error => {
            console.error('[API SERVICE] ✗ LinkedIn extraction failed:', error);
            return throwError(() => error);
          })
        );
      })
    );
  }

  // Search endpoints
  searchSkills(query: string, userId?: string, limit?: number): Observable<any> {
    let params = `q=${encodeURIComponent(query)}`;
    if (userId) params += `&userId=${userId}`;
    if (limit) params += `&limit=${limit}`;

    return this.getAuthHeaders().pipe(
      switchMap((headers) => this.http.get(`${this.apiUrl}/search/skills?${params}`, { headers }))
    );
  }

  findSimilarProfiles(userId: string, limit?: number): Observable<any> {
    const params = limit ? `?limit=${limit}` : '';
    return this.getAuthHeaders().pipe(
      switchMap((headers) => this.http.get(`${this.apiUrl}/search/similar-profiles/${userId}${params}`, { headers }))
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
      switchMap((headers) => this.http.post(`${this.apiUrl}/profiles/${userId}/cv/generate`, config, { headers }))
    );
  }

  getRecentCVs(userId: string, limit: number = 10): Observable<any> {
    return this.getAuthHeaders().pipe(
      switchMap((headers) => this.http.get(`${this.apiUrl}/profiles/${userId}/cv/recent?limit=${limit}`, { headers }))
    );
  }

  getCVDownloadUrl(userId: string, cvGcsUri: string): Observable<any> {
    const encodedUri = encodeURIComponent(cvGcsUri);
    return this.getAuthHeaders().pipe(
      switchMap((headers) => this.http.get(`${this.apiUrl}/profiles/${userId}/cvs/${encodedUri}/download`, { headers }))
    );
  }

  downloadCV(cvId: string): Observable<Blob> {
    return this.getAuthHeaders().pipe(
      switchMap((headers) => this.http.get(`${this.apiUrl}/cv/${cvId}/download`, {
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
      switchMap((headers) => this.http.get(`${this.apiUrl}/profiles/${userId}/match-roles${queryString}`, { headers }))
    );
  }

  getJobMatchAnalysis(userId: string, jobId: string): Observable<any> {
    return this.getAuthHeaders().pipe(
      switchMap((headers) => this.http.get(`${this.apiUrl}/profiles/${userId}/match-analysis/${jobId}`, { headers }))
    );
  }

  // Learning Paths endpoints
  getLearningPaths(userId: string): Observable<any> {
    return this.getAuthHeaders().pipe(
      switchMap((headers) => this.http.get(`${this.apiUrl}/profiles/${userId}/learning-paths`, { headers }))
    );
  }

  generateLearningPath(userId: string, config: {
    targetGoal: string;
    learningStyle: 'balanced' | 'practical' | 'theoretical' | 'fast';
    timeCommitment: number;
  }): Observable<any> {
    return this.getAuthHeaders().pipe(
      switchMap((headers) => this.http.post(`${this.apiUrl}/profiles/${userId}/learning-paths/generate`, config, { headers }))
    );
  }

  updateLearningPathProgress(userId: string, pathId: string, stepId: string, completed: boolean): Observable<any> {
    return this.getAuthHeaders().pipe(
      switchMap((headers) => this.http.patch(
          `${this.apiUrl}/profiles/${userId}/learning-paths/${pathId}/steps/${stepId}`,
          { completed },
          { headers }
        ))
    );
  }

  deleteLearningPath(userId: string, pathId: string): Observable<any> {
    return this.getAuthHeaders().pipe(
      switchMap((headers) => this.http.delete(`${this.apiUrl}/profiles/${userId}/learning-paths/${pathId}`, { headers }))
    );
  }
}
