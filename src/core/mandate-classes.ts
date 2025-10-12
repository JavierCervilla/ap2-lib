/**
 * Mandate Classes
 *
 * Object-oriented implementation of AP2 mandates following SOLID principles.
 * Provides classes for creating, signing, and verifying mandates with state management.
 */

import type { IntentMandate, CartMandate, Mandate } from "../types/mod.ts";
import { MandateValidationError, DateParseError } from "../utils/mod.ts";
import { signMandate, verifyMandateSignature, type VerificationResult } from "./crypto.ts";
import { IntentMandateValidator } from "./validation/intent-mandate-validator.ts";
import { CartMandateValidator } from "./validation/cart-mandate-validator.ts";
import { IntentMandateSerializer } from "./serialization/intent-mandate-serializer.ts";
import { CartMandateSerializer } from "./serialization/cart-mandate-serializer.ts";
import { MandateType, defaultMandateTypeDetector } from "./strategies/mandate-type-detector.ts";
import { sha256 } from '@noble/hashes/sha2.js';

/**
 * Possible states for a mandate
 */
export type MandateStatus = 'pending' | 'authorized' | 'captured' | 'failed' | 'cancelled' | 'refunded';

/**
 * Options for creating a new mandate
 */
export interface NewMandateOptions {
  data: IntentMandate | CartMandate;
  privateKey?: string;
}

/**
 * Options for creating from existing signed mandate
 */
export interface ExistingMandateOptions {
  signedMandate: (IntentMandate | CartMandate) & { signature?: string; merchant_authorization?: string };
  publicKey?: string;
  validateSignature?: boolean;
}

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
   * Check if mandate is signed
   */
  isSigned(): boolean {
    return !!this._signature;
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
   * Abstract method for signing the mandate
   */
  abstract sign(privateKey: string): Promise<void>;

  /**
   * Abstract method for verifying the mandate signature
   */
  abstract verify(publicKey: string): Promise<boolean>;

  /**
   * Abstract method for validation
   */
  protected abstract validate(): Promise<void>;
}

/**
 * Class for IntentMandate with specific functionality
 */
export class IntentMandateClass extends BaseMandate<IntentMandate> {
  private validator: IntentMandateValidator;
  private serializer: IntentMandateSerializer;

  private constructor(data: IntentMandate, options?: {
    id?: string;
    createdAt?: Date;
    status?: MandateStatus;
    signature?: string;
  }) {
    super(data, options);
    this.validator = new IntentMandateValidator();
    this.serializer = IntentMandateSerializer.create();
  }

  protected async validate(): Promise<void> {
    const result = await this.validator.validate(this._data);
    if (!result.isValid) {
      throw new MandateValidationError(`IntentMandate validation failed: ${result.errors.join(', ')}`);
    }
  }

  async sign(privateKey: string): Promise<void> {
    try {
      const signedData = await signMandate(this._data, privateKey);

      if ('signature' in signedData) {
        this._signature = signedData.signature;
        this._status = 'authorized';
      }
    } catch (error) {
      this._status = 'failed';
      throw error;
    }
  }

  async verify(publicKey: string): Promise<boolean> {
    if (!this._signature) {
      return false;
    }

    try {
      const mandateWithSignature = { ...this._data, signature: this._signature };
      const result = await verifyMandateSignature(mandateWithSignature, publicKey);
      return result.isValid;
    } catch (error) {
      return false;
    }
  }

  toString(): string {
    const data = this._data;
    let description = `Intent Mandate (ID: ${this._id})\n`;
    description += `Status: ${this._status}\n`;
    description += `Created: ${this._createdAt.toLocaleString()}\n`;
    description += `Description: ${data.natural_language_description}\n`;
    description += `Expires: ${new Date(data.intent_expiry).toLocaleString()}\n`;
    description += `User Confirmation Required: ${data.user_cart_confirmation_required ?? true}\n`;
    description += `Requires Refundability: ${data.requires_refundability ?? false}\n`;

    if (data.merchants && data.merchants.length > 0) {
      description += `Allowed Merchants: ${data.merchants.join(', ')}\n`;
    }

    if (data.skus && data.skus.length > 0) {
      description += `Allowed SKUs: ${data.skus.join(', ')}\n`;
    }

    description += `Signed: ${this.isSigned() ? 'Yes' : 'No'}`;

    return description;
  }

  /**
   * Create a new IntentMandate
   */
  static async createNew(data: IntentMandate, privateKey?: string): Promise<IntentMandateClass> {
    const mandate = new IntentMandateClass(data);

    // Validate the data
    await mandate.validate();

    // Sign if private key provided
    if (privateKey) {
      await mandate.sign(privateKey);
    }

    return mandate;
  }

  /**
   * Create from existing signed mandate
   */
  static async fromSigned(
    signedMandate: IntentMandate & { signature?: string },
    publicKey?: string,
    validateSignature = true
  ): Promise<IntentMandateClass> {
    const mandate = new IntentMandateClass(signedMandate, {
      signature: signedMandate.signature
    });

    // Validate the data
    await mandate.validate();

    // Verify signature if required
    if (publicKey && validateSignature) {
      const isValid = await mandate.verify(publicKey);
      if (!isValid) {
        throw new MandateValidationError("Invalid signature");
      }
    }

    return mandate;
  }
}

/**
 * Class for CartMandate with specific functionality
 */
export class CartMandateClass extends BaseMandate<CartMandate> {
  private validator: CartMandateValidator;
  private serializer: CartMandateSerializer;

  private constructor(data: CartMandate, options?: {
    id?: string;
    createdAt?: Date;
    status?: MandateStatus;
    signature?: string;
  }) {
    super(data, options);
    this.validator = new CartMandateValidator();
    this.serializer = CartMandateSerializer.create();
  }

  protected async validate(): Promise<void> {
    const result = await this.validator.validate(this._data);
    if (!result.isValid) {
      throw new MandateValidationError(`CartMandate validation failed: ${result.errors.join(', ')}`);
    }
  }

  async sign(privateKey: string): Promise<void> {
    try {
      const signedData = await signMandate(this._data, privateKey);

      if ('merchant_authorization' in signedData) {
        this._signature = signedData.merchant_authorization;
        this._status = 'authorized';
      }
    } catch (error) {
      this._status = 'failed';
      throw error;
    }
  }

  async verify(publicKey: string): Promise<boolean> {
    if (!this._signature) {
      return false;
    }

    try {
      const mandateWithSignature = { ...this._data, merchant_authorization: this._signature };
      const result = await verifyMandateSignature(mandateWithSignature, publicKey);
      return result.isValid;
    } catch (error) {
      return false;
    }
  }

  toString(): string {
    const data = this._data;
    const contents = data.contents;

    let description = `Cart Mandate (ID: ${this._id})\n`;
    description += `Status: ${this._status}\n`;
    description += `Created: ${this._createdAt.toLocaleString()}\n`;
    description += `Cart ID: ${contents.id}\n`;
    description += `Merchant: ${contents.merchant_name}\n`;
    description += `Cart Expires: ${new Date(contents.cart_expiry).toLocaleString()}\n`;
    description += `User Confirmation Required: ${contents.user_cart_confirmation_required}\n`;

    // Payment request details
    const paymentRequest = contents.payment_request;
    if (paymentRequest.details) {
      description += `Total: ${paymentRequest.details.total?.amount?.value} ${paymentRequest.details.total?.amount?.currency}\n`;

      if (paymentRequest.details.displayItems && paymentRequest.details.displayItems.length > 0) {
        description += `Items:\n`;
        paymentRequest.details.displayItems.forEach(item => {
          description += `  - ${item.label}: ${item.amount.value} ${item.amount.currency}\n`;
        });
      }
    }

    description += `Signed: ${this.isSigned() ? 'Yes' : 'No'}`;

    return description;
  }

  /**
   * Create a new CartMandate
   */
  static async createNew(data: CartMandate, privateKey?: string): Promise<CartMandateClass> {
    const mandate = new CartMandateClass(data);

    // Validate the data
    await mandate.validate();

    // Sign if private key provided
    if (privateKey) {
      await mandate.sign(privateKey);
    }

    return mandate;
  }

  /**
   * Create from existing signed mandate
   */
  static async fromSigned(
    signedMandate: CartMandate & { merchant_authorization?: string },
    publicKey?: string,
    validateSignature = true
  ): Promise<CartMandateClass> {
    const mandate = new CartMandateClass(signedMandate, {
      signature: signedMandate.merchant_authorization
    });

    // Validate the data
    await mandate.validate();

    // Verify signature if required
    if (publicKey && validateSignature) {
      const isValid = await mandate.verify(publicKey);
      if (!isValid) {
        throw new MandateValidationError("Invalid signature");
      }
    }

    return mandate;
  }
}

/**
 * Factory function to create mandate classes from generic mandate data
 */
export async function createMandateClass(
  mandate: Mandate,
  options?: { privateKey?: string; publicKey?: string; validateSignature?: boolean }
): Promise<IntentMandateClass | CartMandateClass> {
  const mandateType = defaultMandateTypeDetector.detectType(mandate);

  switch (mandateType) {
    case MandateType.INTENT:
      if ('signature' in (mandate as any)) {
        return IntentMandateClass.fromSigned(
          mandate as IntentMandate & { signature?: string },
          options?.publicKey,
          options?.validateSignature
        );
      } else {
        return IntentMandateClass.createNew(mandate as IntentMandate, options?.privateKey);
      }

    case MandateType.CART:
      if ('merchant_authorization' in (mandate as any)) {
        return CartMandateClass.fromSigned(
          mandate as CartMandate & { merchant_authorization?: string },
          options?.publicKey,
          options?.validateSignature
        );
      } else {
        return CartMandateClass.createNew(mandate as CartMandate, options?.privateKey);
      }

    default:
      throw new MandateValidationError(`Unknown mandate type: ${mandateType}`);
  }
}