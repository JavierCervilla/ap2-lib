/**
 * PaymentMandate Classes
 *
 * Object-oriented implementation of PaymentMandate following SOLID principles.
 * Provides classes for creating, signing, and verifying payment mandates.
 */

import type { PaymentMandate, PaymentMandateContents } from "../types/payment-mandate.ts";
import { MandateValidationError } from "../utils/mod.ts";
import { PaymentMandateValidator } from "./validation/payment-mandate-validator.ts";
import { PaymentMandateContentsValidator } from "./validation/payment-mandate-contents-validator.ts";
import { jwtService } from "./jwt/mod.ts";
import { sha256 } from '@noble/hashes/sha2.js';

/**
 * Possible states for a payment mandate
 */
export type PaymentMandateStatus = 'pending' | 'authorized' | 'captured' | 'failed' | 'cancelled' | 'refunded';

/**
 * PaymentMandateContents Class
 * Follows Single Responsibility Principle (SRP) for managing payment mandate contents
 */
export class PaymentMandateContentsClass {
  private _data: PaymentMandateContents;
  private _id: string;
  private _createdAt: Date;
  private validator: PaymentMandateContentsValidator;

  private constructor(data: PaymentMandateContents, options?: {
    id?: string;
    createdAt?: Date;
  }) {
    this._data = data;
    this._createdAt = options?.createdAt ?? new Date();
    this._id = options?.id ?? this.generateUniqueId();
    this.validator = new PaymentMandateContentsValidator();
  }

  private generateUniqueId(): string {
    const dataForHash = JSON.stringify({
      ...this._data,
      _createdAt: this._createdAt.toISOString()
    }, Object.keys({ ...this._data, _createdAt: '' }).sort());

    return this.sha256Hash(dataForHash);
  }

  private sha256Hash(data: string): string {
    const messageBytes = new TextEncoder().encode(data);
    const hashBytes = sha256(messageBytes);

    return Array.from(hashBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Get payment mandate contents data
   */
  getData(): PaymentMandateContents {
    return { ...this._data };
  }

  /**
   * Get unique ID
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
   * Get the hash of the payment mandate contents for integrity verification
   */
  async getHash(): Promise<string> {
    return await jwtService.computeCartHash(this._data);
  }

  /**
   * Convert to JSON representation
   */
  toJSON(): {
    id: string;
    createdAt: string;
    data: PaymentMandateContents;
  } {
    return {
      id: this._id,
      createdAt: this._createdAt.toISOString(),
      data: this._data,
    };
  }

  /**
   * String representation
   */
  toString(): string {
    const data = this._data;
    let description = `Payment Mandate Contents (ID: ${this._id})\n`;
    description += `Created: ${this._createdAt.toLocaleString()}\n`;
    description += `Payment Mandate ID: ${data.payment_mandate_id}\n`;
    description += `Payment Details ID: ${data.payment_details_id}\n`;
    description += `Merchant Agent: ${data.merchant_agent}\n`;
    description += `Total: ${data.payment_details_total.amount.value} ${data.payment_details_total.amount.currency}\n`;
    description += `Payment Method: ${data.payment_response.methodName}\n`;
    description += `Timestamp: ${data.timestamp}`;

    return description;
  }

  /**
   * Validate payment mandate contents using validator
   */
  async validate(): Promise<void> {
    const result = await this.validator.validate(this._data);
    if (!result.isValid) {
      throw new MandateValidationError(`PaymentMandateContents validation failed: ${result.errors.join(', ')}`);
    }
  }

  /**
   * Create a new PaymentMandateContents instance
   */
  static async createNew(data: PaymentMandateContents): Promise<PaymentMandateContentsClass> {
    // Set timestamp if not provided
    const dataWithTimestamp = {
      ...data,
      timestamp: data.timestamp || new Date().toISOString()
    };

    const contents = new PaymentMandateContentsClass(dataWithTimestamp);
    await contents.validate();
    return contents;
  }
}

/**
 * PaymentMandate Class
 * Follows SOLID principles for managing payment mandates with user authorization
 */
export class PaymentMandateClass {
  private _data: PaymentMandate;
  private _status: PaymentMandateStatus;
  private _id: string;
  private _createdAt: Date;
  private _contentsClass: PaymentMandateContentsClass;
  private validator: PaymentMandateValidator;

  private constructor(
    data: PaymentMandate,
    contentsClass: PaymentMandateContentsClass,
    options?: {
      id?: string;
      createdAt?: Date;
      status?: PaymentMandateStatus;
    }
  ) {
    this._data = data;
    this._contentsClass = contentsClass;
    this._status = options?.status ?? 'pending';
    this._createdAt = options?.createdAt ?? new Date();
    this._id = options?.id ?? this.generateUniqueId();
    this.validator = new PaymentMandateValidator();
  }

  private generateUniqueId(): string {
    const dataForHash = JSON.stringify({
      ...this._data,
      _createdAt: this._createdAt.toISOString()
    }, Object.keys({ ...this._data, _createdAt: '' }).sort());

    return this.sha256Hash(dataForHash);
  }

  private sha256Hash(data: string): string {
    const messageBytes = new TextEncoder().encode(data);
    const hashBytes = sha256(messageBytes);

    return Array.from(hashBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Get payment mandate data
   */
  getData(): PaymentMandate {
    return { ...this._data };
  }

  /**
   * Get payment mandate contents class
   */
  getContentsClass(): PaymentMandateContentsClass {
    return this._contentsClass;
  }

  /**
   * Get mandate status
   */
  getStatus(): PaymentMandateStatus {
    return this._status;
  }

  /**
   * Set mandate status
   */
  setStatus(status: PaymentMandateStatus): void {
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
   * Check if mandate has user authorization
   */
  hasUserAuthorization(): boolean {
    return !!this._data.user_authorization;
  }

  /**
   * Get user authorization token
   */
  getUserAuthorization(): string | undefined {
    return this._data.user_authorization;
  }

  /**
   * Set user authorization (SD-JWT-VC)
   * This would typically be done by a wallet or user agent
   */
  setUserAuthorization(userAuthorization: string): void {
    this._data.user_authorization = userAuthorization;
    this._status = 'authorized';
  }

  /**
   * Verify user authorization token with transaction hashes
   */
  async verifyUserAuthorization(
    expectedCartMandateHash?: string,
    expectedPaymentMandateHash?: string
  ): Promise<boolean> {
    if (!this._data.user_authorization) {
      return false;
    }

    const result = await this.validator.validateTransactionHashes(
      this._data,
      expectedCartMandateHash,
      expectedPaymentMandateHash
    );

    return result.isValid;
  }

  /**
   * Convert to JSON representation
   */
  toJSON(): {
    id: string;
    createdAt: string;
    status: PaymentMandateStatus;
    data: PaymentMandate;
  } {
    return {
      id: this._id,
      createdAt: this._createdAt.toISOString(),
      status: this._status,
      data: this._data,
    };
  }

  /**
   * String representation
   */
  toString(): string {
    let description = `Payment Mandate (ID: ${this._id})\n`;
    description += `Status: ${this._status}\n`;
    description += `Created: ${this._createdAt.toLocaleString()}\n`;
    description += `Has User Authorization: ${this.hasUserAuthorization() ? 'Yes' : 'No'}\n`;
    description += `\nContents:\n${this._contentsClass.toString()}`;

    return description;
  }

  /**
   * Validate payment mandate using validator
   */
  async validate(): Promise<void> {
    const result = await this.validator.validate(this._data);
    if (!result.isValid) {
      throw new MandateValidationError(`PaymentMandate validation failed: ${result.errors.join(', ')}`);
    }
  }

  /**
   * Create a new PaymentMandate instance
   */
  static async createNew(
    data: PaymentMandate,
    options?: {
      id?: string;
      createdAt?: Date;
      status?: PaymentMandateStatus;
    }
  ): Promise<PaymentMandateClass> {
    // Create contents class
    const contentsClass = await PaymentMandateContentsClass.createNew(data.payment_mandate_contents);

    const mandate = new PaymentMandateClass(data, contentsClass, options);
    await mandate.validate();

    return mandate;
  }

  /**
   * Create from existing payment mandate with user authorization
   */
  static async fromExisting(
    data: PaymentMandate,
    options?: {
      validateUserAuth?: boolean;
      expectedCartMandateHash?: string;
      expectedPaymentMandateHash?: string;
    }
  ): Promise<PaymentMandateClass> {
    const mandate = await PaymentMandateClass.createNew(data, {
      status: data.user_authorization ? 'authorized' : 'pending'
    });

    // Verify user authorization if required
    if (options?.validateUserAuth && data.user_authorization) {
      const isValid = await mandate.verifyUserAuthorization(
        options.expectedCartMandateHash,
        options.expectedPaymentMandateHash
      );

      if (!isValid) {
        throw new MandateValidationError('Invalid user authorization');
      }
    }

    return mandate;
  }
}