/**
 * PaymentMandate Class
 *
 * Object-oriented implementation for PaymentMandate following SOLID principles.
 * Uses user authorization tokens for payment authorization.
 */

import type { PaymentMandate } from "../../../types/payment-mandate.ts";
import { MandateValidationError } from "../../../utils/mod.ts";
import { PaymentMandateValidator } from "./payment-mandate-validator.ts";
import { PaymentMandateContentsClass } from "./payment-mandate-contents-class.ts";
import { BaseMandate, type MandateStatus } from "../shared/base-mandate.ts";

// Re-export PaymentMandateContentsClass for external use
export { PaymentMandateContentsClass } from "./payment-mandate-contents-class.ts";

/**
 * Possible states for a payment mandate
 */
export type PaymentMandateStatus = 'pending' | 'authorized' | 'captured' | 'failed' | 'cancelled' | 'refunded';

/**
 * Class for PaymentMandate with user authorization functionality
 */
export class PaymentMandateClass extends BaseMandate<PaymentMandate> {
  private validator: PaymentMandateValidator;
  private _contentsClass: PaymentMandateContentsClass;

  private constructor(
    data: PaymentMandate,
    contentsClass: PaymentMandateContentsClass,
    options?: {
      id?: string;
      createdAt?: Date;
      status?: MandateStatus;
    }
  ) {
    super(data, options);
    this._contentsClass = contentsClass;
    this.validator = new PaymentMandateValidator();
  }

  protected async validate(): Promise<void> {
    const result = await this.validator.validate(this._data);
    if (!result.isValid) {
      throw new MandateValidationError(`PaymentMandate validation failed: ${result.errors.join(', ')}`);
    }
  }

  /**
   * Get payment mandate contents class
   */
  getContentsClass(): PaymentMandateContentsClass {
    return this._contentsClass;
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
   * Check if mandate is signed (overrides base class for user auth support)
   */
  override isSigned(): boolean {
    return this.hasUserAuthorization();
  }

  toString(): string {
    let description = `Payment Mandate (ID: ${this._id})\n`;
    description += `Status: ${this._status}\n`;
    description += `Created: ${this._createdAt.toLocaleString()}\n`;
    description += `Has User Authorization: ${this.hasUserAuthorization() ? 'Yes' : 'No'}\n`;
    description += `\nContents:\n${this._contentsClass.toString()}`;

    return description;
  }

  /**
   * Create a new PaymentMandate instance
   */
  static async createNew(
    data: PaymentMandate,
    options?: {
      id?: string;
      createdAt?: Date;
      status?: MandateStatus;
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