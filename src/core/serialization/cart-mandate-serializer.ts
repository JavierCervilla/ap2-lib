/**
 * CartMandate Serializer
 *
 * Specialized serializer for CartMandate entities following the Single Responsibility Principle.
 */

import type { CartMandate } from "../../types/mod.ts";
import { BaseJsonSerializer } from "./interfaces.ts";

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
}