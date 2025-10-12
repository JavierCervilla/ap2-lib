/**
 * PaymentRequest Serializer
 *
 * Specialized serializer for PaymentRequest entities following the Single Responsibility Principle.
 */

import type { PaymentRequest } from "../../types/mod.ts";
import { BaseJsonSerializer } from "./interfaces.ts";

/**
 * Serializer for PaymentRequest entities
 */
export class PaymentRequestSerializer extends BaseJsonSerializer<PaymentRequest> {
  private static readonly REQUIRED_FIELDS = [
    'methodData',
    'details'
  ];

  /**
   * Validate required fields for PaymentRequest deserialization
   */
  protected validateRequiredFields(parsed: any): void {
    const missingFields = this.checkRequiredFields(parsed, PaymentRequestSerializer.REQUIRED_FIELDS);

    for (const field of missingFields) {
      throw new Error(`Missing required field '${field}'`);
    }
  }

  /**
   * Create a new serializer instance
   */
  static create(): PaymentRequestSerializer {
    return new PaymentRequestSerializer();
  }

  /**
   * Static method to serialize PaymentRequest
   */
  static async serialize(paymentRequest: PaymentRequest): Promise<string> {
    return await PaymentRequestSerializer.create().serialize(paymentRequest);
  }

  /**
   * Static method to deserialize PaymentRequest
   */
  static async deserialize(json: string): Promise<PaymentRequest> {
    return await PaymentRequestSerializer.create().deserialize(json);
  }
}