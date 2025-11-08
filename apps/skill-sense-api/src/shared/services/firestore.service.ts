import { Injectable, Logger } from '@nestjs/common';
import { Firestore } from '@google-cloud/firestore';

@Injectable()
export class FirestoreService {
  private readonly logger = new Logger(FirestoreService.name);
  private readonly db: Firestore;

  constructor() {
    this.db = new Firestore({
      projectId: process.env.GCP_PROJECT_ID,
    });
    this.logger.log('Firestore initialized');
  }

  getCollection(collectionName: string) {
    return this.db.collection(collectionName);
  }

  async getDocument(collection: string, docId: string) {
    const doc = await this.db.collection(collection).doc(docId).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
  }

  async createDocument(collection: string, data: any, docId?: string) {
    const ref = docId 
      ? this.db.collection(collection).doc(docId)
      : this.db.collection(collection).doc();
    
    await ref.set(data);
    return { id: ref.id, ...data };
  }

  async updateDocument(collection: string, docId: string, data: any) {
    await this.db.collection(collection).doc(docId).update(data);
    return { id: docId, ...data };
  }

  async deleteDocument(collection: string, docId: string) {
    await this.db.collection(collection).doc(docId).delete();
  }
}
