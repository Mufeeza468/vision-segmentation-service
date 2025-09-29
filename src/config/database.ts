import { MongoClient, Db } from 'mongodb';

class DatabaseConnection {
  private client: MongoClient | null = null;
  private db: Db | null = null;

  async connect(uri: string, dbName: string): Promise<void> {
    try {
      this.client = new MongoClient(uri);
      await this.client.connect();
      this.db = this.client.db(dbName);
      console.log('Connected to MongoDB successfully');
      
      // Create indexes
      await this.createIndexes();
    } catch (error) {
      console.error('Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
      console.log('Disconnected from MongoDB');
    }
  }

  getDb(): Db {
    if (!this.db) {
      throw new Error('Database not connected');
    }
    return this.db;
  }

  private async createIndexes(): Promise<void> {
    if (!this.db) return;

    try {
      // Annotations indexes
      await this.db.collection('annotations').createIndex({ image_id: 1, area: -1 });
      await this.db.collection('annotations').createIndex({ annotator_id: 1, created_at: -1 });
      await this.db.collection('annotations').createIndex({ label: 1 });
      await this.db.collection('annotations').createIndex({ project_id: 1, status: 1 });
      
      // Images indexes
      await this.db.collection('images').createIndex({ project_id: 1, annotation_status: 1 });
      
      // Users indexes
      await this.db.collection('users').createIndex({ email: 1 }, { unique: true });
      
      console.log('Database indexes created successfully');
    } catch (error) {
      console.error('Failed to create indexes:', error);
    }
  }
}

export const database = new DatabaseConnection();