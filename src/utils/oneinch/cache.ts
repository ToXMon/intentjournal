/**
 * Cache Manager for 1inch API responses
 * Implements TTL-based caching with automatic cleanup
 */

interface CacheEntry<T = any> {
  data: T;
  expires: number;
  created: number;
}

export class CacheManager {
  private static cache = new Map<string, CacheEntry>();
  private static maxSize = 1000; // Maximum number of cache entries
  private static cleanupInterval: NodeJS.Timeout | null = null;

  /**
   * Initialize the cache manager with automatic cleanup
   */
  static init(): void {
    if (this.cleanupInterval) {
      return;
    }

    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * Store data in cache with TTL
   */
  static set<T>(key: string, data: T, ttl: number): void {
    const now = Date.now();
    
    // If cache is full, remove oldest entries
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    this.cache.set(key, {
      data,
      expires: now + ttl,
      created: now,
    });
  }

  /**
   * Retrieve data from cache
   */
  static get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (entry.expires < Date.now()) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Check if a key exists and is not expired
   */
  static has(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }

    if (entry.expires < Date.now()) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Remove a specific key from cache
   */
  static delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  static clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  static getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    oldestEntry: number | null;
  } {
    let oldestEntry: number | null = null;
    let totalHits = 0;
    let totalRequests = 0;

    for (const entry of this.cache.values()) {
      if (oldestEntry === null || entry.created < oldestEntry) {
        oldestEntry = entry.created;
      }
    }

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: totalRequests > 0 ? totalHits / totalRequests : 0,
      oldestEntry,
    };
  }

  /**
   * Remove expired entries from cache
   */
  private static cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expires < now) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));

    if (keysToDelete.length > 0) {
      console.log(`Cache cleanup: removed ${keysToDelete.length} expired entries`);
    }
  }

  /**
   * Remove oldest entries when cache is full
   */
  private static evictOldest(): void {
    const entries = Array.from(this.cache.entries());
    
    // Sort by creation time (oldest first)
    entries.sort((a, b) => a[1].created - b[1].created);
    
    // Remove oldest 10% of entries
    const toRemove = Math.ceil(entries.length * 0.1);
    for (let i = 0; i < toRemove; i++) {
      this.cache.delete(entries[i][0]);
    }

    console.log(`Cache eviction: removed ${toRemove} oldest entries`);
  }

  /**
   * Get cache entries matching a pattern
   */
  static getByPattern(pattern: RegExp): Array<{ key: string; data: any; expires: number }> {
    const matches: Array<{ key: string; data: any; expires: number }> = [];
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (pattern.test(key) && entry.expires > now) {
        matches.push({
          key,
          data: entry.data,
          expires: entry.expires,
        });
      }
    }

    return matches;
  }

  /**
   * Invalidate cache entries matching a pattern
   */
  static invalidatePattern(pattern: RegExp): number {
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    return keysToDelete.length;
  }

  /**
   * Cleanup on app shutdown
   */
  static destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
  }
}

// Initialize cache manager
if (typeof window !== 'undefined') {
  CacheManager.init();
  
  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    CacheManager.destroy();
  });
}