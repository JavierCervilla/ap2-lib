/**
 * IntentMandate Serializer
 *
 * Specialized serializer for IntentMandate entities following the Single Responsibility Principle.
 */

import type { IntentMandate } from "../../types/mod.ts";
import { BaseJsonSerializer } from "./interfaces.ts";
import { MANDATE_MESSAGES } from "../config/validation-messages.ts";

/**
 * Serializer for IntentMandate entities
 */
export class IntentMandateSerializer extends BaseJsonSerializer<IntentMandate> {
  private static readonly REQUIRED_FIELDS = [
    'natural_language_description',
    'intent_expiry'
  ];

  /**
   * Validate required fields for IntentMandate deserialization
   */
  protected validateRequiredFields(parsed: any): void {
    const missingFields = this.checkRequiredFields(parsed, IntentMandateSerializer.REQUIRED_FIELDS);

    if (missingFields.includes('natural_language_description')) {
      throw new Error("Missing required field 'natural_language_description'");
    }

    if (missingFields.includes('intent_expiry')) {
      throw new Error("Missing required field 'intent_expiry'");
    }
  }

  /**
   * Create a new serializer instance
   */
  static create(): IntentMandateSerializer {
    return new IntentMandateSerializer();
  }

  /**
   * Static method to serialize IntentMandate
   */
  static async serialize(mandate: IntentMandate): Promise<string> {
    return await IntentMandateSerializer.create().serialize(mandate);
  }

  /**
   * Static method to deserialize IntentMandate
   */
  static async deserialize(json: string): Promise<IntentMandate> {
    return await IntentMandateSerializer.create().deserialize(json);
  }
}