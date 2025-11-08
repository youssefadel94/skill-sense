import { Injectable, Logger } from '@nestjs/common';
import { FirestoreService } from '../../shared/services/firestore.service';

@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);
  private readonly collection = 'profiles';

  constructor(private readonly firestore: FirestoreService) {}

  async createProfile(data: any) {
    this.logger.log('Creating profile');
    return this.firestore.createDocument(this.collection, {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  async getProfile(id: string) {
    this.logger.log(`Fetching profile: ${id}`);
    return this.firestore.getDocument(this.collection, id);
  }

  async listProfiles() {
    this.logger.log('Listing all profiles');
    const snapshot = await this.firestore.getCollection(this.collection).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async deleteProfile(id: string) {
    this.logger.log(`Deleting profile: ${id}`);
    await this.firestore.deleteDocument(this.collection, id);
    return { success: true };
  }
}
