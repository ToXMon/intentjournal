/**
 * Embedding Service - Main interface for embedding operations
 * Combines Venice AI client with embedding store for complete functionality
 */

import { veniceClient } from "./venice-client";
import {
  embeddingStore,
  EmbeddingMetadata,
  SimilarityResult,
} from "./embedding-store";
import { generateId } from "@/lib/utils";

export interface ProcessedEmbedding {
  id: string;
  entryId: string;
  content: string;
  vector: number[];
  metadata: EmbeddingMetadata;
  timestamp: Date;
}

export interface EmbeddingContext {
  similarEntries: SimilarityResult[];
  recentEntries: ProcessedEmbedding[];
  sentimentTrend: {
    positive: number;
    negative: number;
    neutral: number;
  };
  commonKeywords: string[];
}

class EmbeddingService {
  /**
   * Create and store embedding for a journal entry
   */
  async createEmbedding(
    entryId: string,
    content: string,
    additionalMetadata: Partial<EmbeddingMetadata> = {}
  ): Promise<ProcessedEmbedding> {
    try {
      console.log(`🧠 Creating embedding for entry: ${entryId}`);

      // Generate embedding using Venice AI
      const response = await veniceClient.createEmbedding(
        content,
        "embeddings"
      );

      if (!response.data || response.data.length === 0) {
        throw new Error("No embedding data received from Venice AI");
      }

      const vector = response.data[0].embedding;

      // Extract keywords and analyze sentiment
      const keywords = this.extractKeywords(content);
      const sentiment = this.analyzeSentiment(content);

      // Create metadata
      const metadata: EmbeddingMetadata = {
        content,
        timestamp: new Date(),
        keywords,
        sentiment,
        entryId,
        ...additionalMetadata,
      };

      // Generate unique ID for the embedding
      const embeddingId = generateId();

      // Store the embedding
      await embeddingStore.storeEmbedding(embeddingId, vector, metadata);

      console.log(
        `✅ Successfully created and stored embedding for entry: ${entryId}`
      );

      return {
        id: embeddingId,
        entryId,
        content,
        vector,
        metadata,
        timestamp: metadata.timestamp,
      };
    } catch (error) {
      console.error("Failed to create embedding:", error);
      throw new Error(
        `Failed to create embedding: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Query similar embeddings for context
   */
  async queryEmbeddings(
    queryText: string,
    limit: number = 5,
    minSimilarity: number = 0.7
  ): Promise<SimilarityResult[]> {
    try {
      console.log(`🔍 Querying embeddings for: "${queryText.slice(0, 50)}..."`);

      // Generate embedding for the query
      const response = await veniceClient.createEmbedding(
        queryText,
        "embeddings"
      );

      if (!response.data || response.data.length === 0) {
        throw new Error("No embedding data received for query");
      }

      const queryVector = response.data[0].embedding;

      // Find similar embeddings
      const similarEmbeddings = await embeddingStore.findSimilar(
        queryVector,
        limit,
        minSimilarity
      );

      console.log(`📊 Found ${similarEmbeddings.length} similar embeddings`);

      return similarEmbeddings;
    } catch (error) {
      console.error("Failed to query embeddings:", error);
      return [];
    }
  }

  /**
   * Get context for AI recommendation generation
   */
  async getEmbeddingContext(
    currentEntry?: string,
    lookbackDays: number = 30
  ): Promise<EmbeddingContext> {
    try {
      console.log("📈 Building embedding context for recommendations");

      // Get recent embeddings
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - lookbackDays);

      const recentEmbeddings = await embeddingStore.getEmbeddingsByDateRange(
        startDate,
        endDate
      );

      // Get similar entries if current entry is provided
      let similarEntries: SimilarityResult[] = [];
      if (currentEntry) {
        similarEntries = await this.queryEmbeddings(currentEntry, 3, 0.6);
      }

      // Analyze sentiment trends
      const sentimentCounts = recentEmbeddings.reduce(
        (acc, embedding) => {
          acc[embedding.metadata.sentiment]++;
          return acc;
        },
        { positive: 0, negative: 0, neutral: 0 }
      );

      const total = recentEmbeddings.length || 1;
      const sentimentTrend = {
        positive: sentimentCounts.positive / total,
        negative: sentimentCounts.negative / total,
        neutral: sentimentCounts.neutral / total,
      };

      // Extract common keywords
      const allKeywords = recentEmbeddings.flatMap((e) => e.metadata.keywords);
      const keywordCounts = allKeywords.reduce((acc, keyword) => {
        acc[keyword] = (acc[keyword] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const commonKeywords = Object.entries(keywordCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([keyword]) => keyword);

      const context: EmbeddingContext = {
        similarEntries,
        recentEntries: recentEmbeddings.map((e) => ({
          id: e.id,
          entryId: e.metadata.entryId,
          content: e.metadata.content,
          vector: e.vector,
          metadata: e.metadata as EmbeddingMetadata, // Type assertion since we know it has entryId
          timestamp: e.metadata.timestamp,
        })),
        sentimentTrend,
        commonKeywords,
      };

      console.log(
        `📊 Context built: ${recentEmbeddings.length} recent entries, ${similarEntries.length} similar entries`
      );

      return context;
    } catch (error) {
      console.error("Failed to get embedding context:", error);
      return {
        similarEntries: [],
        recentEntries: [],
        sentimentTrend: { positive: 0, negative: 0, neutral: 1 },
        commonKeywords: [],
      };
    }
  }

  /**
   * Extract keywords from text (simple implementation)
   */
  private extractKeywords(text: string): string[] {
    // Financial and DeFi related keywords
    const financialKeywords = [
      "bitcoin",
      "btc",
      "ethereum",
      "eth",
      "usdc",
      "usdt",
      "defi",
      "swap",
      "trade",
      "buy",
      "sell",
      "hold",
      "hodl",
      "yield",
      "farming",
      "staking",
      "liquidity",
      "pool",
      "dex",
      "exchange",
      "price",
      "market",
      "bull",
      "bear",
      "profit",
      "loss",
      "investment",
      "portfolio",
      "diversify",
      "risk",
      "reward",
      "apy",
      "apr",
      "token",
      "coin",
      "crypto",
      "blockchain",
      "wallet",
      "metamask",
      "uniswap",
      "1inch",
      "compound",
      "aave",
      "makerdao",
      "chainlink",
      "polygon",
      "arbitrum",
      "optimism",
      "base",
      "layer2",
      "gas",
      "fees",
      "slippage",
    ];

    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 2);

    // Find financial keywords
    const foundKeywords = words.filter((word) =>
      financialKeywords.includes(word)
    );

    // Add high-frequency non-financial words
    const wordCounts = words.reduce((acc, word) => {
      if (!financialKeywords.includes(word) && word.length > 3) {
        acc[word] = (acc[word] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const frequentWords = Object.entries(wordCounts)
      .filter(([, count]) => count > 1)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);

    return [...new Set([...foundKeywords, ...frequentWords])];
  }

  /**
   * Analyze sentiment (simple implementation)
   */
  private analyzeSentiment(text: string): "positive" | "negative" | "neutral" {
    const positiveWords = [
      "good",
      "great",
      "excellent",
      "positive",
      "bullish",
      "up",
      "gain",
      "profit",
      "success",
      "opportunity",
      "optimistic",
      "confident",
      "excited",
      "happy",
      "moon",
      "pump",
      "rally",
      "surge",
      "breakout",
      "strong",
    ];

    const negativeWords = [
      "bad",
      "terrible",
      "negative",
      "bearish",
      "down",
      "loss",
      "lose",
      "fail",
      "worried",
      "concerned",
      "scared",
      "dump",
      "crash",
      "drop",
      "fall",
      "weak",
      "risky",
      "dangerous",
      "uncertain",
      "volatile",
    ];

    const words = text.toLowerCase().split(/\s+/);

    let positiveScore = 0;
    let negativeScore = 0;

    words.forEach((word) => {
      if (positiveWords.includes(word)) positiveScore++;
      if (negativeWords.includes(word)) negativeScore++;
    });

    if (positiveScore > negativeScore) return "positive";
    if (negativeScore > positiveScore) return "negative";
    return "neutral";
  }

  /**
   * Get embedding statistics
   */
  async getStats() {
    return embeddingStore.getStorageStats();
  }

  /**
   * Clear all embeddings
   */
  async clearAll() {
    return embeddingStore.clearAllEmbeddings();
  }
}

// Export singleton instance
export const embeddingService = new EmbeddingService();

// Export class for testing
export { EmbeddingService };
