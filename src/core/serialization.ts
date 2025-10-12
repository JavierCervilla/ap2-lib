/**
 * Serialization Functions for AP2 - Refactored
 *
 * Functions for serializing and deserializing mandates, payment requests,
 * and related structures to/from JSON format.
 * Refactored to use strategy pattern and follow SOLID principles while maintaining
 * backward compatibility with the existing API.
 */

import type { IntentMandate, CartContents, CartMandate, PaymentRequest, Mandate } from "../types/mod.ts";

// Import strategy components
import { defaultMandateSerializationRegistry } from "./serialization/mandate-serialization-strategy.ts";
import { IntentMandateSerializer } from "./serialization/intent-mandate-serializer.ts";
import { CartContentsSerializer } from "./serialization/cart-contents-serializer.ts";
import { CartMandateSerializer } from "./serialization/cart-mandate-serializer.ts";
import { PaymentRequestSerializer } from "./serialization/payment-request-serializer.ts";

// Create serializer instances
const intentMandateSerializer = IntentMandateSerializer.create();
const cartContentsSerializer = CartContentsSerializer.create();
const cartMandateSerializer = CartMandateSerializer.create();
const paymentRequestSerializer = PaymentRequestSerializer.create();

/**
 * Serializes an IntentMandate to JSON string
 *
 * @param intentMandate - Intent mandate to serialize
 * @returns Promise resolving to JSON string
 */
export async function serializeIntentMandate(intentMandate: IntentMandate): Promise<string> {
  return await intentMandateSerializer.serialize(intentMandate);
}

/**
 * Deserializes JSON string to IntentMandate
 *
 * @param json - JSON string to deserialize
 * @returns Promise resolving to IntentMandate
 * @throws Error if JSON is invalid or missing required fields
 */
export async function deserializeIntentMandate(json: string): Promise<IntentMandate> {
  return await intentMandateSerializer.deserialize(json);
}

/**
 * Serializes CartContents to JSON string
 *
 * @param cartContents - Cart contents to serialize
 * @returns Promise resolving to JSON string
 */
export async function serializeCartContents(cartContents: CartContents): Promise<string> {
  return await cartContentsSerializer.serialize(cartContents);
}

/**
 * Deserializes JSON string to CartContents
 *
 * @param json - JSON string to deserialize
 * @returns Promise resolving to CartContents
 * @throws Error if JSON is invalid or missing required fields
 */
export async function deserializeCartContents(json: string): Promise<CartContents> {
  return await cartContentsSerializer.deserialize(json);
}

/**
 * Serializes CartMandate to JSON string
 *
 * @param cartMandate - Cart mandate to serialize
 * @returns Promise resolving to JSON string
 */
export async function serializeCartMandate(cartMandate: CartMandate): Promise<string> {
  return await cartMandateSerializer.serialize(cartMandate);
}

/**
 * Deserializes JSON string to CartMandate
 *
 * @param json - JSON string to deserialize
 * @returns Promise resolving to CartMandate
 * @throws Error if JSON is invalid or missing required fields
 */
export async function deserializeCartMandate(json: string): Promise<CartMandate> {
  return await cartMandateSerializer.deserialize(json);
}

/**
 * Serializes PaymentRequest to JSON string
 *
 * @param paymentRequest - Payment request to serialize
 * @returns Promise resolving to JSON string
 */
export async function serializePaymentRequest(paymentRequest: PaymentRequest): Promise<string> {
  return await paymentRequestSerializer.serialize(paymentRequest);
}

/**
 * Deserializes JSON string to PaymentRequest
 *
 * @param json - JSON string to deserialize
 * @returns Promise resolving to PaymentRequest
 * @throws Error if JSON is invalid or missing required fields
 */
export async function deserializePaymentRequest(json: string): Promise<PaymentRequest> {
  return await paymentRequestSerializer.deserialize(json);
}

/**
 * Generic mandate serialization dispatcher
 *
 * @param mandate - Mandate to serialize
 * @returns Promise resolving to JSON string
 */
export async function serializeMandate(mandate: Mandate): Promise<string> {
  return await defaultMandateSerializationRegistry.serializeMandate(mandate);
}

/**
 * Generic mandate deserialization dispatcher
 *
 * @param json - JSON string to deserialize
 * @returns Promise resolving to Mandate
 * @throws Error if JSON is invalid or represents unknown mandate type
 */
export async function deserializeMandate(json: string): Promise<Mandate> {
  return await defaultMandateSerializationRegistry.deserializeMandate(json);
}