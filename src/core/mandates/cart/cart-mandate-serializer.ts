/**
 * CartMandate Serializer
 *
 * Specialized serializer for CartMandate entities following the Single Responsibility Principle.
 */

import type { CartMandate } from "../../../types/mod.ts";
import { BaseJsonSerializer } from "../shared/interfaces.ts";

/**
 * Serializer for CartMandate entities
 */
export class CartMandateSerializer extends BaseJsonSerializer<CartMandate> {
  private static readonly REQUIRED_FIELDS = [
    'contents'
  ];

  /**
   * Validate required fields for CartMandate deserialization
   */
  protected validateRequiredFields(parsed: any): void {
    const missingFields = this.checkRequiredFields(parsed, CartMandateSerializer.REQUIRED_FIELDS);

    for (const field of missingFields) {
      throw new Error(`Missing required field '${field}'`);
    }
  }

  /**
   * Create a new serializer instance
   */
  static create(): CartMandateSerializer {
    return new CartMandateSerializer();
  }

  /**
   * Static method to serialize CartMandate
   */
  static async serialize(cartMandate: CartMandate): Promise<string> {
    return await CartMandateSerializer.create().serialize(cartMandate);
  }

  /**
   * Static method to deserialize CartMandate
   */
  static async deserialize(json: string): Promise<CartMandate> {
    return await CartMandateSerializer.create().deserialize(json);
  }
}