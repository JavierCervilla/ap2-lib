/**
 * IntentMandate Class
 *
 * Object-oriented implementation for IntentMandate following SOLID principles.
 * Provides class for creating and managing Intent mandates with state management.
 */

import type { IntentMandate } from "../../../types/mod.ts";
import { MandateValidationError } from "../../../utils/mod.ts";
import { IntentMandateValidator } from "./intent-mandate-validator.ts";
import { IntentMandateSerializer } from "./intent-mandate-serializer.ts";
import { BaseMandate, type MandateStatus } from "../shared/base-mandate.ts";

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

  // IntentMandate does not have signing functionality according to AP2 specification
  // Only CartMandate has merchant_authorization and PaymentMandate has user_authorization

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

    // IntentMandate is never signed according to AP2 specification
    description += `Signed: No (IntentMandates are not signed)`;

    return description;
  }

  /**
   * Create a new IntentMandate
   */
  static async createNew(data: IntentMandate, options?: {
    id?: string;
    createdAt?: Date;
    status?: MandateStatus;
    signature?: string;
  }): Promise<IntentMandateClass> {
    const mandate = new IntentMandateClass(data, options);

    // Validate the data
    await mandate.validate();

    return mandate;
  }

  /**
   * Create from existing IntentMandate data
   * Note: IntentMandates are never signed according to AP2 specification
   */
  static async fromData(intentData: IntentMandate): Promise<IntentMandateClass> {
    const mandate = new IntentMandateClass(intentData);

    // Validate the data
    await mandate.validate();

    return mandate;
  }
}