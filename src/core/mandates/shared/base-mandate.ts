/**
 * Base Mandate Class
 *
 * Abstract base class for all mandate types.
 * Implements common functionality following SOLID principles.
 */

import type { Mandate } from "../../../types/mod.ts";
import { sha256 } from '@noble/hashes/sha2.js';

/**
 * Possible states for a mandate
 */
export type MandateStatus = 'pending' | 'authorized' | 'captured' | 'failed' | 'cancelled' | 'refunded';

/**
 * Abstract base class for all mandate types
 * Implements common functionality following SOLID principles
 */
export abstract class BaseMandate<T extends Mandate> {
  protected _data: T;
  protected _status: MandateStatus;
  protected _id: string;
  protected _createdAt: Date;
  protected _signature?: string;

  constructor(
    data: T,
    options?: {
      id?: string;
      createdAt?: Date;
      status?: MandateStatus;
      signature?: string;
    }
  ) {
    this._data = data;
    this._status = options?.status ?? 'pending';
    this._createdAt = options?.createdAt ?? new Date();
    this._signature = options?.signature;

    // Generate unique ID if not provided
    this._id = options?.id ?? this.generateUniqueId();
  }

  /**
   * Generate a unique ID using SHA-256 hash of mandate data + timestamp
   * This ensures integrity and prevents collisions without affecting the standard AP2 signature
   */
  private generateUniqueId(): string {
    const dataForHash = JSON.stringify({
      ...this._data,
      _createdAt: this._createdAt.toISOString()
    }, Object.keys({ ...this._data, _createdAt: '' }).sort());

    return this.sha256Hash(dataForHash);
  }

  /**
   * Generate SHA-256 hash using @noble/hashes
   */
  private sha256Hash(data: string): string {
    const messageBytes = new TextEncoder().encode(data);
    const hashBytes = sha256(messageBytes);

    // Convert to hex string
    return Array.from(hashBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Get mandate data
   */
  getData(): T {
    return { ...this._data };
  }

  /**
   * Get mandate status
   */
  getStatus(): MandateStatus {
    return this._status;
  }

  /**
   * Set mandate status
   */
  setStatus(status: MandateStatus): void {
    this._status = status;
  }

  /**
   * Get mandate ID
   */
  getId(): string {
    return this._id;
  }

  /**
   * Get creation timestamp
   */
  getCreatedAt(): Date {
    return new Date(this._createdAt);
  }

  /**
   * Get signature if present
   */
  getSignature(): string | undefined {
    return this._signature;
  }

  /**
   * Check if mandate is signed (IntentMandate never gets signed)
   */
  isSigned(): boolean {
    return false; // IntentMandate is never signed according to AP2 spec
  }

  /**
   * Convert mandate to JSON
   */
  toJSON(): {
    id: string;
    createdAt: string;
    status: MandateStatus;
    data: T;
    signature?: string;
  } {
    return {
      id: this._id,
      createdAt: this._createdAt.toISOString(),
      status: this._status,
      data: this._data,
      signature: this._signature,
    };
  }

  /**
   * Abstract method for human-readable string representation
   */
  abstract toString(): string;

  /**
   * Optional method for signing the mandate (not applicable to all mandate types)
   * IntentMandates don't implement this, only CartMandates do
   */
  sign?(privateKey: string, ...args: any[]): Promise<void>;

  /**
   * Optional method for verifying the mandate signature (not applicable to all mandate types)
   * IntentMandates don't implement this, only CartMandates do
   */
  verify?(publicKey: string, ...args: any[]): Promise<boolean>;

  /**
   * Abstract method for validation
   */
  protected abstract validate(): Promise<void>;
}