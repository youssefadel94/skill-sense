import { Module, Global } from '@nestjs/common';
import { FirestoreService } from './services/firestore.service';
import { VertexAIService } from './services/vertex-ai.service';
import { WeaviateService } from './services/weaviate.service';
import { GcsService } from './services/gcs.service';
import { JobQueueService } from './services/job-queue.service';

@Global()
@Module({
  providers: [
    FirestoreService,
    VertexAIService,
    WeaviateService,
    GcsService,
    JobQueueService,
  ],
  exports: [
    FirestoreService,
    VertexAIService,
    WeaviateService,
    GcsService,
    JobQueueService,
  ],
})
export class SharedModule {}
