/**
 * JTI (JWT ID) Validator
 *
 * Implements JWT ID uniqueness validation to prevent replay attacks.
 * Follows SOLID principles with dependency injection support.
 */

import type { MerchantAuthorizationPayload } from './interfaces.ts';
import { SignatureVerificationError } from '../../utils/mod.ts';

/**
 * JTI validation result
 */
export interface JTIValidationResult {
  /** Whether the JTI is valid (unique and not expired) */
  valid: boolean;
  /** Error message if invalid */
  error?: string;
  /** Whether the JTI was already used (replay attack) */
  isReplay?: boolean;
}

/**
 * JTI storage entry
 */
export interface JTIEntry {
  /** JWT ID */
  jti: string;
  /** Issuer of the JWT */
  issuer: string;
  /** Expiration timestamp */
  expiresAt: number;
  /** When this entry was created */
  createdAt: number;
}

/**
 * Interface for JTI storage backend
 * Allows for different storage implementations (memory, Redis, etc.)
 */
export interface IJTIStorage {
  /**
   * Check if a JTI exists
   */
  exists(jti: string, issuer: string): Promise<boolean>;

  /**
   * Store a JTI with expiration
   */
  store(entry: JTIEntry): Promise<void>;

  /**
   * Clean up expired JTIs
   */
  cleanup(): Promise<number>;

  /**
   * Get total number of stored JTIs
   */
  size(): Promise<number>;
}

/**
 * Interface for JTI validation operations
 */
export interface IJTIValidator {
  /**
   * Validate a JWT ID for uniqueness and replay attack prevention
   */
  validateJTI(payload: MerchantAuthorizationPayload): Promise<JTIValidationResult>;

  /**
   * Mark a JTI as used
   */
  markJTIAsUsed(payload: MerchantAuthorizationPayload): Promise<void>;

  /**
   * Clean up expired JTIs
   */
  cleanup(): Promise<number>;
}

/**
 * In-memory JTI storage implementation
 * Suitable for single-instance deployments or testing
 */
export class MemoryJTIStorage implements IJTIStorage {
  private storage = new Map<string, JTIEntry>();
  private readonly maxSize: number;
  private readonly cleanupInterval: number;
  private cleanupTimer?: number;

  constructor(options?: {
    maxSize?: number;
    cleanupInterval?: number;
  }) {
    this.maxSize = options?.maxSize || 10000;
    this.cleanupInterval = options?.cleanupInterval || 300000; // 5 minutes

    // Start periodic cleanup
    this.startPeriodicCleanup();
  }

  async exists(jti: string, issuer: string): Promise<boolean> {
    const key = `${issuer}:${jti}`;
    const entry = this.storage.get(key);

    if (!entry) {
      return false;
    }

    // Check if expired
    const now = Math.floor(Date.now() / 1000);
    if (entry.expiresAt <= now) {
      this.storage.delete(key);
      return false;
    }

    return true;
  }

  async store(entry: JTIEntry): Promise<void> {
    const key = `${entry.issuer}:${entry.jti}`;

    if (this.storage.size >= this.maxSize) {
      await this.cleanup();

      while (this.storage.size >= this.maxSize) {
        let oldestKey: string | null = null;
        let oldestTime = Infinity;
        for (const [currentKey, currentEntry] of this.storage.entries()) {
          if (currentEntry.createdAt < oldestTime) {
            oldestTime = currentEntry.createdAt;
            oldestKey = currentKey;
          }
        }
        if (oldestKey) {
          this.storage.delete(oldestKey);
        } else {
          break;
        }
      }
    }

    this.storage.set(key, entry);
  }

  async cleanup(): Promise<number> {
    const now = Math.floor(Date.now() / 1000);
    let cleanedCount = 0;

    for (const [key, entry] of this.storage.entries()) {
      if (entry.expiresAt <= now) {
        this.storage.delete(key);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }

  async size(): Promise<number> {
    return this.storage.size;
  }

  private startPeriodicCleanup(): void {
    if (typeof globalThis !== 'undefined' && 'setInterval' in globalThis) {
      this.cleanupTimer = setInterval(() => {
        this.cleanup().catch(console.error);
      }, this.cleanupInterval);
    }
  }

  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.storage.clear();
  }
}

/**
 * JTI Validator implementation
 * Prevents JWT replay attacks by tracking used JWT IDs
 */
export class JTIValidator implements IJTIValidator {
  constructor(
    private storage: IJTIStorage = new MemoryJTIStorage(),
    private options: {
      /** Grace period in seconds for clock skew tolerance */
      clockTolerance?: number;
      /** Maximum JTI age in seconds before automatic cleanup */
      maxAge?: number;
    } = {}
  ) {
    this.options = {
      clockTolerance: 30, // 30 seconds
      maxAge: 86400, // 24 hours
      ...options
    };
  }

  async validateJTI(payload: MerchantAuthorizationPayload): Promise<JTIValidationResult> {
    try {
      // Validate required fields
      if (!payload.jti) {
        return {
          valid: false,
          error: 'Missing JWT ID (jti) in payload'
        };
      }

      if (!payload.iss) {
        return {
          valid: false,
          error: 'Missing issuer (iss) in payload'
        };
      }

      if (!payload.exp) {
        return {
          valid: false,
          error: 'Missing expiration (exp) in payload'
        };
      }

      // Check if JTI format is valid (should be hex string from our generator)
      if (!/^[0-9a-f]{32}$/i.test(payload.jti)) {
        return {
          valid: false,
          error: 'Invalid JTI format - expected 32-character hex string'
        };
      }

      // Check if JTI already exists (replay attack)
      const exists = await this.storage.exists(payload.jti, payload.iss);
      if (exists) {
        return {
          valid: false,
          error: 'JWT ID already used - potential replay attack',
          isReplay: true
        };
      }

      // Check JWT expiration with clock tolerance
      const now = Math.floor(Date.now() / 1000);
      const clockTolerance = this.options.clockTolerance!;

      if (payload.exp < (now - clockTolerance)) {
        return {
          valid: false,
          error: 'JWT has expired'
        };
      }

      // Check if JWT is too far in the future (potential attack)
      if (payload.iat && payload.iat > (now + clockTolerance)) {
        return {
          valid: false,
          error: 'JWT issued in the future - potential clock skew or attack'
        };
      }

      return {
        valid: true
      };
    } catch (error) {
      return {
        valid: false,
        error: `JTI validation error: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  async markJTIAsUsed(payload: MerchantAuthorizationPayload): Promise<void> {
    if (payload.jti == null || payload.iss == null || payload.exp == null) {
      throw new SignatureVerificationError('Invalid payload: missing required fields for JTI tracking');
    }

    const entry: JTIEntry = {
      jti: payload.jti,
      issuer: payload.iss,
      expiresAt: Math.max(payload.exp, Math.floor(Date.now() / 1000) + (this.options.maxAge || 86400)),
      createdAt: Math.floor(Date.now() / 1000)
    };

    await this.storage.store(entry);
  }

  async cleanup(): Promise<number> {
    return await this.storage.cleanup();
  }

  /**
   * Get storage stats for monitoring
   */
  async getStats(): Promise<{ size: number; lastCleanup?: number }> {
    return {
      size: await this.storage.size()
    };
  }
}

// Export default instance
export const defaultJTIValidator = new JTIValidator();