import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private auth = inject(AuthService);
  private apiUrl = environment.apiUrl;

  private async getHeaders(): Promise<Record<string, string>> {
    const token = await this.auth.getIdToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  // Profile endpoints
  async createProfile(data: any): Promise<any> {
    const headers = await this.getHeaders();
    const response = await fetch(`${this.apiUrl}/profiles`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });
    return response.json();
  }

  async getProfile(userId: string): Promise<any> {
    const headers = await this.getHeaders();
    const response = await fetch(`${this.apiUrl}/profiles/${userId}`, { headers });
    return response.json();
  }

  async listProfiles(): Promise<any> {
    const headers = await this.getHeaders();
    const response = await fetch(`${this.apiUrl}/profiles`, { headers });
    return response.json();
  }

  // Skill analysis endpoints
  async analyzeSkillGaps(userId: string, targetRole: string): Promise<any> {
    const headers = await this.getHeaders();
    const response = await fetch(
      `${this.apiUrl}/profiles/${userId}/skill-gaps?targetRole=${encodeURIComponent(targetRole)}`,
      { headers }
    );
    return response.json();
  }

  async getSkillRecommendations(userId: string, targetRole?: string): Promise<any> {
    const headers = await this.getHeaders();
    const params = targetRole ? `?targetRole=${encodeURIComponent(targetRole)}` : '';
    const response = await fetch(`${this.apiUrl}/profiles/${userId}/recommendations${params}`, { headers });
    return response.json();
  }

  async getSkillTrends(): Promise<any> {
    const headers = await this.getHeaders();
    const response = await fetch(`${this.apiUrl}/profiles/trends`, { headers });
    return response.json();
  }

  async exportSkills(userId: string, format: 'json' | 'csv' = 'json'): Promise<any> {
    const headers = await this.getHeaders();
    const response = await fetch(`${this.apiUrl}/profiles/${userId}/export?format=${format}`, { headers });
    return format === 'csv' ? response.text() : response.json();
  }

  // Extraction endpoints
  async extractFromCV(userId: string, file: File): Promise<any> {
    const token = await this.auth.getIdToken();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId);

    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.apiUrl}/extraction/cv`, {
      method: 'POST',
      headers,
      body: formData
    });
    return response.json();
  }

  async extractFromGitHub(userId: string, username: string): Promise<any> {
    const headers = await this.getHeaders();
    const response = await fetch(`${this.apiUrl}/extraction/github`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ userId, username })
    });
    return response.json();
  }

  async extractFromLinkedIn(userId: string, profileUrl: string): Promise<any> {
    const headers = await this.getHeaders();
    const response = await fetch(`${this.apiUrl}/extraction/linkedin`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ userId, profileUrl })
    });
    return response.json();
  }

  // Search endpoints
  async searchSkills(query: string, userId?: string, limit?: number): Promise<any> {
    const headers = await this.getHeaders();
    let params = `q=${encodeURIComponent(query)}`;
    if (userId) params += `&userId=${userId}`;
    if (limit) params += `&limit=${limit}`;

    const response = await fetch(`${this.apiUrl}/search/skills?${params}`, { headers });
    return response.json();
  }

  async findSimilarProfiles(userId: string, limit?: number): Promise<any> {
    const headers = await this.getHeaders();
    const params = limit ? `?limit=${limit}` : '';
    const response = await fetch(`${this.apiUrl}/search/similar-profiles/${userId}${params}`, { headers });
    return response.json();
  }
}
