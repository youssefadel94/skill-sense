import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';

interface UploadResult {
  jobId: string;
  status: string;
  skillsFound?: number;
  message?: string;
}

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="upload-container">
      <header class="upload-header">
        <h1>Upload CV</h1>
        <a [routerLink]="['/dashboard']" class="btn btn-secondary">Back to Dashboard</a>
      </header>

      <div class="upload-card">
        <div class="upload-zone"
             [class.dragover]="isDragOver"
             (dragover)="onDragOver($event)"
             (dragleave)="onDragLeave($event)"
             (drop)="onDrop($event)"
             (click)="fileInput.click()">

          @if (!selectedFile && !uploading && !result) {
            <div class="upload-prompt">
              <div class="upload-icon">📄</div>
              <h3>Drop your CV here or click to browse</h3>
              <p>Supported formats: PDF, DOCX</p>
              <p class="file-size">Max file size: 10MB</p>
            </div>
          }

          @if (selectedFile && !uploading && !result) {
            <div class="file-selected">
              <div class="file-icon">✓</div>
              <h3>{{ selectedFile.name }}</h3>
              <p>{{ (selectedFile.size / 1024 / 1024).toFixed(2) }} MB</p>
              <button (click)="clearFile($event)" class="btn btn-secondary btn-sm">
                Remove
              </button>
            </div>
          }

          @if (uploading) {
            <div class="uploading">
              <div class="spinner"></div>
              <h3>{{ uploadStatus }}</h3>
              <p>This may take 2-3 minutes...</p>
            </div>
          }

          @if (result && !error) {
            <div class="upload-success">
              <div class="success-icon">✓</div>
              <h3>Upload Successful!</h3>
              <p>{{ result.skillsFound || 0 }} skills extracted</p>
              <button (click)="viewProfile()" class="btn btn-primary">
                View Profile
              </button>
              <button (click)="reset()" class="btn btn-secondary">
                Upload Another
              </button>
            </div>
          }

          <input
            #fileInput
            type="file"
            accept=".pdf,.docx"
            (change)="onFileSelected($event)"
            style="display: none"
          />
        </div>

        @if (error) {
          <div class="alert alert-error">
            {{ error }}
            <button (click)="clearError()" class="close-btn">×</button>
          </div>
        }

        @if (selectedFile && !uploading && !result) {
          <div class="upload-actions">
            <button (click)="uploadFile()" class="btn btn-primary btn-large">
              Extract Skills
            </button>
          </div>
        }
      </div>

      <div class="info-section">
        <h3>What happens next?</h3>
        <div class="info-grid">
          <div class="info-item">
            <div class="step-number">1</div>
            <div class="step-content">
              <h4>Upload</h4>
              <p>Your CV is securely uploaded to Google Cloud Storage</p>
            </div>
          </div>
          <div class="info-item">
            <div class="step-number">2</div>
            <div class="step-content">
              <h4>Extract</h4>
              <p>Vertex AI analyzes your document for skills and experience</p>
            </div>
          </div>
          <div class="info-item">
            <div class="step-number">3</div>
            <div class="step-content">
              <h4>Validate</h4>
              <p>Skills are verified and organized by category</p>
            </div>
          </div>
          <div class="info-item">
            <div class="step-number">4</div>
            <div class="step-content">
              <h4>Discover</h4>
              <p>View your profile and get personalized recommendations</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .upload-container {
      max-width: 900px;
      margin: 0 auto;
      padding: 20px;
    }

    .upload-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
    }

    .upload-header h1 {
      margin: 0;
      color: #333;
      font-size: 32px;
    }

    .upload-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      padding: 30px;
      margin-bottom: 30px;
    }

    .upload-zone {
      border: 3px dashed #ddd;
      border-radius: 12px;
      padding: 60px 30px;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s;
      min-height: 300px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .upload-zone.dragover {
      border-color: #667eea;
      background: #f8f9ff;
    }

    .upload-zone:hover {
      border-color: #667eea;
    }

    .upload-prompt .upload-icon,
    .file-selected .file-icon,
    .upload-success .success-icon {
      font-size: 72px;
      margin-bottom: 20px;
    }

    .upload-prompt h3,
    .file-selected h3,
    .upload-success h3 {
      margin: 0 0 10px 0;
      color: #333;
      font-size: 24px;
    }

    .upload-prompt p,
    .file-selected p,
    .upload-success p {
      color: #666;
      margin: 5px 0;
    }

    .file-size {
      font-size: 14px;
      color: #999;
    }

    .uploading {
      text-align: center;
    }

    .spinner {
      border: 4px solid #f3f3f3;
      border-top: 4px solid #667eea;
      border-radius: 50%;
      width: 60px;
      height: 60px;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .uploading h3 {
      margin: 0 0 10px 0;
      color: #333;
    }

    .upload-success {
      text-align: center;
    }

    .success-icon {
      color: #10b981;
    }

    .upload-success button {
      margin: 10px 5px 0;
    }

    .upload-actions {
      margin-top: 20px;
      text-align: center;
    }

    .alert-error {
      background: #fee;
      color: #c33;
      padding: 15px 20px;
      border-radius: 8px;
      margin-top: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .close-btn {
      background: none;
      border: none;
      color: #c33;
      font-size: 24px;
      cursor: pointer;
      padding: 0;
      width: 30px;
      height: 30px;
      line-height: 1;
    }

    .info-section {
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      padding: 30px;
    }

    .info-section h3 {
      margin: 0 0 25px 0;
      color: #333;
      font-size: 24px;
      text-align: center;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
    }

    .info-item {
      text-align: center;
    }

    .step-number {
      width: 50px;
      height: 50px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      font-weight: bold;
      margin: 0 auto 15px;
    }

    .step-content h4 {
      margin: 0 0 8px 0;
      color: #333;
      font-size: 18px;
    }

    .step-content p {
      margin: 0;
      color: #666;
      font-size: 14px;
      line-height: 1.5;
    }

    .btn {
      padding: 12px 24px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      text-decoration: none;
      display: inline-block;
      transition: background 0.2s;
    }

    .btn-primary {
      background: #667eea;
      color: white;
    }

    .btn-primary:hover {
      background: #5568d3;
    }

    .btn-secondary {
      background: #6c757d;
      color: white;
    }

    .btn-secondary:hover {
      background: #5a6268;
    }

    .btn-large {
      padding: 15px 40px;
      font-size: 16px;
    }

    .btn-sm {
      padding: 8px 16px;
      font-size: 13px;
      margin-top: 10px;
    }
  `]
})
export class UploadComponent {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private router = inject(Router);

  selectedFile: File | null = null;
  uploading = false;
  uploadStatus = 'Uploading file...';
  error = '';
  isDragOver = false;
  result: UploadResult | null = null;

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  handleFile(file: File) {
    // Validate file type
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      this.error = 'Invalid file type. Please upload a PDF or DOCX file.';
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      this.error = 'File is too large. Maximum size is 10MB.';
      return;
    }

    this.selectedFile = file;
    this.error = '';
  }

  clearFile(event: Event) {
    event.stopPropagation();
    this.selectedFile = null;
    this.error = '';
  }

  async uploadFile() {
    if (!this.selectedFile) return;

    try {
      this.uploading = true;
      this.error = '';
      this.uploadStatus = 'Uploading file to cloud storage...';

      const userId = this.authService.getUserId();
      if (!userId || !this.selectedFile) {
        throw new Error('User not authenticated or no file selected');
      }

      this.apiService.extractFromCV(userId, this.selectedFile).subscribe({
        next: (response) => {
          console.log('CV extraction response:', response);
          this.uploadStatus = 'Skills extracted successfully!';
          this.result = {
            jobId: response.jobId || 'completed',
            status: 'completed',
            skillsFound: response.skillsFound || response.result?.skills?.length || 0,
            message: response.message || `Extracted ${response.skillsFound || 0} skills from your CV`
          };
          this.uploading = false;

          // Log success
          console.log(`Successfully extracted ${this.result.skillsFound} skills`);
        },
        error: (err) => {
          console.error('CV extraction failed:', err);
          this.error = err.error?.message || err.message || 'Failed to extract skills from CV';
          this.uploading = false;
        }
      });

    } catch (err: any) {
      console.error('Upload error:', err);
      this.error = err.message || 'Failed to upload file';
      this.uploading = false;
    }
  }

  viewProfile() {
    this.router.navigate(['/profile']);
  }

  reset() {
    this.selectedFile = null;
    this.result = null;
    this.error = '';
  }

  clearError() {
    this.error = '';
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
