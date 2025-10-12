/**
 * PaymentMandate Serializer
 *
 * Specialized serializer for PaymentMandate entities following the Single Responsibility Principle.
 */

import type { PaymentMandate } from "../../../types/payment-mandate.ts";
import { BaseJsonSerializer } from "../shared/interfaces.ts";

/**
 * Serializer for PaymentMandate entities
 */
export class PaymentMandateSerializer extends BaseJsonSerializer<PaymentMandate> {
  private static readonly REQUIRED_FIELDS = [
    'payment_mandate_contents'
  ];

  /**
   * Validate required fields for PaymentMandate deserialization
   */
  protected validateRequiredFields(parsed: any): void {
    const missingFields = this.checkRequiredFields(parsed, PaymentMandateSerializer.REQUIRED_FIELDS);

    for (const field of missingFields) {
      throw new Error(`Missing required field '${field}'`);
    }

    // Validate payment_mandate_contents structure
    if (parsed.payment_mandate_contents) {
      const requiredContentsFields = [
        'payment_mandate_id',
        'payment_details_id',
        'merchant_agent',
        'payment_details_total',
        'payment_response',
        'timestamp'
      ];

      const contents = parsed.payment_mandate_contents;
      for (const field of requiredContentsFields) {
        if (!(field in contents)) {
          throw new Error(`Missing required field in payment_mandate_contents: '${field}'`);
        }
      }
    }
  }

  /**
   * Create a new serializer instance
   */
  static create(): PaymentMandateSerializer {
    return new PaymentMandateSerializer();
  }

  /**
   * Static method to serialize PaymentMandate
   */
  static async serialize(paymentMandate: PaymentMandate): Promise<string> {
    return await PaymentMandateSerializer.create().serialize(paymentMandate);
  }

  /**
   * Static method to deserialize PaymentMandate
   */
  static async deserialize(json: string): Promise<PaymentMandate> {
    return await PaymentMandateSerializer.create().deserialize(json);
  }
}