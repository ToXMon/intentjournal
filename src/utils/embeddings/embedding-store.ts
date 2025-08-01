/**
 * Embedding Store for localStorage-based vector storage and similarity search
 * Handles storage, retrieval, and querying of journal entry embeddings
 */

import { StoredEmbedding } from '@/types';
import { cosineSimilarity } from '@/lib/utils';
import { STORAGE_KEYS } from '@/lib/constants';

export interface EmbeddingMetadata {
  content: string;
  timestamp: Date;
  keywords: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
  entryId: string;
}

export interface SimilarityResult {
  embedding: StoredEmbedding;
  similarity: number;
}

class EmbeddingStore {
  private storageKey: string;

  constructor() {
    this.storageKey = STORAGE_KEYS.EMBEDDINGS || 'intentjournal_embeddings';
  }

  /**
   * Store a new embedding with metadata
   */
  async storeEmbedding(
    id: string,
    vector: number[],
    metadata: EmbeddingMetadata
  ): Promise<void> {
    try {
      const embedding: StoredEmbedding = {
        id,
        vector,
        metadata: {
          ...metadata,
          timestamp: new Date(metadata.timestamp), // Ensure it's a Date object
        },
      };

      const existingEmbeddings = await this.getAllEmbeddings();
      const updatedEmbeddings = [...existingEmbeddings, embedding];

      localStorage.setItem(this.storageKey, JSON.stringify(updatedEmbeddings));
      
      console.log(`✓ Stored embedding for entry: ${metadata.entryId}`);
    } catch (error) {
      console.error('Failed to store embedding:', error);
      throw new Error('Failed to store embedding in localStorage');
    }
  }

  /**
   * Retrieve all stored embeddings
   */
  async getAllEmbeddings(): Promise<StoredEmbedding[]> {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return [];

      const embeddings = JSON.parse(stored);
      
      // Ensure timestamps are Date objects
      return embeddings.map((embedding: any) => ({
        ...embedding,
        metadata: {
          ...embedding.metadata,
          timestamp: new Date(embedding.metadata.timestamp),
        },
      }));
    } catch (error) {
      console.error('Failed to retrieve embeddings:', error);
      return [];
    }
  }

  /**
   * Find similar embeddings using cosine similarity
   */
  async findSimilar(
    queryVector: number[],
    limit: number = 5,
    minSimilarity: number = 0.7
  ): Promise<SimilarityResult[]> {
    try {
      const allEmbeddings = await this.getAllEmbeddings();
      
      if (allEmbeddings.length === 0) {
        return [];
      }

      // Calculate similarities
      const similarities: SimilarityResult[] = allEmbeddings
        .map(embedding => ({
          embedding,
          similarity: cosineSimilarity(queryVector, embedding.vector),
        }))
        .filter(result => result.similarity >= minSimilarity)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);

      console.log(`Found ${similarities.length} similar embeddings (min similarity: ${minSimilarity})`);
      
      return similarities;
    } catch (error) {
      console.error('Failed to find similar embeddings:', error);
      return [];
    }
  }

  /**
   * Get embeddings by entry ID
   */
  async getEmbeddingByEntryId(entryId: string): Promise<StoredEmbedding | null> {
    try {
      const allEmbeddings = await this.getAllEmbeddings();
      return allEmbeddings.find(e => e.metadata.entryId === entryId) || null;
    } catch (error) {
      console.error('Failed to get embedding by entry ID:', error);
      return null;
    }
  }

  /**
   * Delete embedding by ID
   */
  async deleteEmbedding(id: string): Promise<void> {
    try {
      const allEmbeddings = await this.getAllEmbeddings();
      const filteredEmbeddings = allEmbeddings.filter(e => e.id !== id);
      
      localStorage.setItem(this.storageKey, JSON.stringify(filteredEmbeddings));
      console.log(`✓ Deleted embedding: ${id}`);
    } catch (error) {
      console.error('Failed to delete embedding:', error);
      throw new Error('Failed to delete embedding');
    }
  }

  /**
   * Get embeddings within a date range
   */
  async getEmbeddingsByDateRange(
    startDate: Date,
    endDate: Date
  ): Promise<StoredEmbedding[]> {
    try {
      const allEmbeddings = await this.getAllEmbeddings();
      
      return allEmbeddings.filter(embedding => {
        const embeddingDate = embedding.metadata.timestamp;
        return embeddingDate >= startDate && embeddingDate <= endDate;
      });
    } catch (error) {
      console.error('Failed to get embeddings by date range:', error);
      return [];
    }
  }

  /**
   * Get embeddings by sentiment
   */
  async getEmbeddingsBySentiment(
    sentiment: 'positive' | 'negative' | 'neutral'
  ): Promise<StoredEmbedding[]> {
    try {
      const allEmbeddings = await this.getAllEmbeddings();
      return allEmbeddings.filter(e => e.metadata.sentiment === sentiment);
    } catch (error) {
      console.error('Failed to get embeddings by sentiment:', error);
      return [];
    }
  }

  /**
   * Search embeddings by keywords
   */
  async searchByKeywords(keywords: string[]): Promise<StoredEmbedding[]> {
    try {
      const allEmbeddings = await this.getAllEmbeddings();
      
      return allEmbeddings.filter(embedding => {
        const embeddingKeywords = embedding.metadata.keywords.map(k => k.toLowerCase());
        return keywords.some(keyword => 
          embeddingKeywords.some(ek => ek.includes(keyword.toLowerCase()))
        );
      });
    } catch (error) {
      console.error('Failed to search embeddings by keywords:', error);
      return [];
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{
    totalEmbeddings: number;
    storageSize: number;
    oldestEntry: Date | null;
    newestEntry: Date | null;
  }> {
    try {
      const allEmbeddings = await this.getAllEmbeddings();
      const storageData = localStorage.getItem(this.storageKey) || '';
      
      const timestamps = allEmbeddings.map(e => e.metadata.timestamp);
      
      return {
        totalEmbeddings: allEmbeddings.length,
        storageSize: new Blob([storageData]).size,
        oldestEntry: timestamps.length > 0 ? new Date(Math.min(...timestamps.map(t => t.getTime()))) : null,
        newestEntry: timestamps.length > 0 ? new Date(Math.max(...timestamps.map(t => t.getTime()))) : null,
      };
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return {
        totalEmbeddings: 0,
        storageSize: 0,
        oldestEntry: null,
        newestEntry: null,
      };
    }
  }

  /**
   * Clear all embeddings (use with caution)
   */
  async clearAllEmbeddings(): Promise<void> {
    try {
      localStorage.removeItem(this.storageKey);
      console.log('✓ Cleared all embeddings');
    } catch (error) {
      console.error('Failed to clear embeddings:', error);
      throw new Error('Failed to clear embeddings');
    }
  }

  /**
   * Export embeddings as JSON
   */
  async exportEmbeddings(): Promise<string> {
    try {
      const allEmbeddings = await this.getAllEmbeddings();
      return JSON.stringify(allEmbeddings, null, 2);
    } catch (error) {
      console.error('Failed to export embeddings:', error);
      throw new Error('Failed to export embeddings');
    }
  }

  /**
   * Import embeddings from JSON
   */
  async importEmbeddings(jsonData: string): Promise<void> {
    try {
      const embeddings = JSON.parse(jsonData);
      
      // Validate the data structure
      if (!Array.isArray(embeddings)) {
        throw new Error('Invalid embeddings data format');
      }

      // Ensure timestamps are Date objects
      const validatedEmbeddings = embeddings.map((embedding: any) => ({
        ...embedding,
        metadata: {
          ...embedding.metadata,
          timestamp: new Date(embedding.metadata.timestamp),
        },
      }));

      localStorage.setItem(this.storageKey, JSON.stringify(validatedEmbeddings));
      console.log(`✓ Imported ${validatedEmbeddings.length} embeddings`);
    } catch (error) {
      console.error('Failed to import embeddings:', error);
      throw new Error('Failed to import embeddings');
    }
  }
}

// Export singleton instance
export const embeddingStore = new EmbeddingStore();

// Export class for testing
export { EmbeddingStore };