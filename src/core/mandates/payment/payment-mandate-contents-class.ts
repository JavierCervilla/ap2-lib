/**
 * PaymentMandateContents Class
 *
 * Object-oriented implementation for PaymentMandateContents following SOLID principles.
 */

import type { PaymentMandateContents } from "../../../types/payment-mandate.ts";
import { MandateValidationError } from "../../../utils/mod.ts";
import { PaymentMandateContentsValidator } from "./payment-mandate-contents-validator.ts";
import { jwtService } from "../../jwt/mod.ts";
import { sha256 } from '@noble/hashes/sha2.js';

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