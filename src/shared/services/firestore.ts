import { firebaseFirestore } from '../../config/firebase';
import { FirestoreWhereOp } from '../../types/firebase.types';
import { InternalServerErrorException, NotFoundException } from '../lib/errors';

class FirestoreServiceImpl {
  private db = firebaseFirestore;

  async get<T = Record<string, unknown>>(
    collection: string,
    docId: string,
  ): Promise<T> {
    try {
      const snap = await this.db.collection(collection).doc(docId).get();
      if (!snap.exists) {
        throw new NotFoundException(`Document '${docId}' not found in '${collection}'.`);
      }
      return { id: snap.id, ...snap.data() } as T;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(`Firestore get failed: ${(error as Error).message}`);
    }
  }

  async set<T extends Record<string, unknown>>(
    collection: string,
    docId: string,
    data: T,
  ): Promise<void> {
    try {
      await this.db.collection(collection).doc(docId).set(data);
    } catch (error) {
      throw new InternalServerErrorException(`Firestore set failed: ${(error as Error).message}`);
    }
  }

  async update<T extends Record<string, unknown>>(
    collection: string,
    docId: string,
    data: Partial<T>,
  ): Promise<void> {
    try {
      const ref = this.db.collection(collection).doc(docId);
      const snap = await ref.get();
      if (!snap.exists) {
        throw new NotFoundException(`Document '${docId}' not found in '${collection}'.`);
      }
      await ref.update(data as Record<string, unknown>);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(`Firestore update failed: ${(error as Error).message}`);
    }
  }

  async delete(collection: string, docId: string): Promise<void> {
    try {
      const ref = this.db.collection(collection).doc(docId);
      const snap = await ref.get();
      if (!snap.exists) {
        throw new NotFoundException(`Document '${docId}' not found in '${collection}'.`);
      }
      await ref.delete();
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(`Firestore delete failed: ${(error as Error).message}`);
    }
  }

  async query<T = Record<string, unknown>>(
    collection: string,
    field: string,
    operator: FirestoreWhereOp,
    value: unknown,
  ): Promise<T[]> {
    try {
      const snap = await this.db
        .collection(collection)
        .where(field, operator, value)
        .get();

      return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as T);
    } catch (error) {
      throw new InternalServerErrorException(`Firestore query failed: ${(error as Error).message}`);
    }
  }
}

const FirestoreService = new FirestoreServiceImpl();
export default FirestoreService;
