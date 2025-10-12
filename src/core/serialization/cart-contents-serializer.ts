/**
 * CartContents Serializer
 *
 * Specialized serializer for CartContents entities following the Single Responsibility Principle.
 */

import type { CartContents } from "../../types/mod.ts";
import { BaseJsonSerializer } from "./interfaces.ts";

/**
 * Serializer for CartContents entities
 */
export class CartContentsSerializer extends BaseJsonSerializer<CartContents> {
  private static readonly REQUIRED_FIELDS = [
    'id',
    'merchant_name',
    'cart_expiry',
    'payment_request'
  ];

  private static readonly REQUIRED_BOOLEAN_FIELDS = [
    'user_cart_confirmation_required'
  ];

  /**
   * Validate required fields for CartContents deserialization
   */
  protected validateRequiredFields(parsed: any): void {
    const missingFields = this.checkRequiredFields(parsed, CartContentsSerializer.REQUIRED_FIELDS);

    // Check regular required fields
    for (const field of missingFields) {
      throw new Error(`Missing required field '${field}'`);
    }

    // Special check for user_cart_confirmation_required (must exist, even if false)
    if (parsed.user_cart_confirmation_required === undefined) {
      throw new Error("Missing required field 'user_cart_confirmation_required'");
    }
  }

  /**
   * Create a new serializer instance
   */
  static create(): CartContentsSerializer {
    return new CartContentsSerializer();
  }

  /**
   * Static method to serialize CartContents
   */
  static async serialize(cartContents: CartContents): Promise<string> {
    return await CartContentsSerializer.create().serialize(cartContents);
  }

  /**
   * Static method to deserialize CartContents
   */
  static async deserialize(json: string): Promise<CartContents> {
    return await CartContentsSerializer.create().deserialize(json);
  }
}