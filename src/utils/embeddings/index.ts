/**
 * Embeddings Module - Venice AI Integration
 * Exports all embedding-related functionality
 */

export { veniceClient, VeniceAIClient } from './venice-client';
export { embeddingStore, EmbeddingStore } from './embedding-store';
export { embeddingService, EmbeddingService } from './embedding-service';

export type {
  VeniceEmbeddingRequest,
  VeniceEmbeddingResponse,
  VeniceChatRequest,
  VeniceChatResponse,
} from './venice-client';

export type {
  EmbeddingMetadata,
  SimilarityResult,
} from './embedding-store';

export type {
  ProcessedEmbedding,
  EmbeddingContext,
} from './embedding-service';