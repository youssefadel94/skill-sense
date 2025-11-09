import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FirestoreService } from '../../shared/services/firestore.service';
import { VertexAIService } from '../../shared/services/vertex-ai.service';
import { WeaviateService } from '../../shared/services/weaviate.service';
import { GcsService } from '../../shared/services/gcs.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly firestore: FirestoreService,
    private readonly vertexAI: VertexAIService,
    private readonly weaviate: WeaviateService,
    private readonly gcs: GcsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Health check with service status' })
  @ApiResponse({ status: 200, description: 'Returns overall system health and individual service status' })
  async check() {
    const services = await this.checkAllServices();
    const allHealthy = Object.values(services).every(s => s.status === 'healthy');

    return {
      status: allHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      service: 'skill-sense-api',
      version: '1.0.0',
      uptime: process.uptime(),
      services,
    };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe for Kubernetes/Cloud Run' })
  @ApiResponse({ status: 200, description: 'Returns readiness status' })
  async ready() {
    const services = await this.checkAllServices();
    const allHealthy = Object.values(services).every(s => s.status === 'healthy');

    return {
      status: allHealthy ? 'ready' : 'not-ready',
      timestamp: new Date().toISOString(),
      services,
    };
  }

  private async checkAllServices() {
    const [firestore, vertexAI, weaviate, gcs] = await Promise.all([
      this.checkFirestore(),
      this.checkVertexAI(),
      this.checkWeaviate(),
      this.checkGCS(),
    ]);

    return {
      firestore,
      vertexAI,
      weaviate,
      gcs,
    };
  }

  private async checkFirestore() {
    try {
      await this.firestore.listDocuments('profiles');
      return { status: 'healthy', message: 'Connected' };
    } catch (error) {
      return { status: 'unhealthy', message: error.message };
    }
  }

  private async checkVertexAI() {
    try {
      // Simple check - verify service is initialized
      const hasProject = !!process.env.GCP_PROJECT_ID;
      return { 
        status: hasProject ? 'healthy' : 'degraded',
        message: hasProject ? 'Configured' : 'No project ID set (using mock mode)'
      };
    } catch (error) {
      return { status: 'unhealthy', message: error.message };
    }
  }

  private async checkWeaviate() {
    try {
      const isReady = await this.weaviate.isReady();
      return { 
        status: isReady ? 'healthy' : 'unhealthy',
        message: isReady ? 'Connected' : 'Not ready'
      };
    } catch (error) {
      return { status: 'unhealthy', message: error.message };
    }
  }

  private async checkGCS() {
    try {
      const hasBucket = !!process.env.GCS_BUCKET_NAME;
      return { 
        status: hasBucket ? 'healthy' : 'degraded',
        message: hasBucket ? 'Configured' : 'No bucket configured'
      };
    } catch (error) {
      return { status: 'unhealthy', message: error.message };
    }
  }
}
