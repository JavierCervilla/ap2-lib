/**
 * Serialization Functions for AP2
 *
 * Functions for serializing and deserializing mandates, payment requests,
 * and related structures to/from JSON format.
 * Implementation follows TDD - these functions pass the pre-written tests.
 */

import type { IntentMandate, CartContents, CartMandate, PaymentRequest, Mandate } from "../types/mod.ts";

/**
 * Serializes an IntentMandate to JSON string
 *
 * @param intentMandate - Intent mandate to serialize
 * @returns Promise resolving to JSON string
 */
export async function serializeIntentMandate(intentMandate: IntentMandate): Promise<string> {
  return JSON.stringify(intentMandate);
}

/**
 * Deserializes JSON string to IntentMandate
 *
 * @param json - JSON string to deserialize
 * @returns Promise resolving to IntentMandate
 * @throws Error if JSON is invalid or missing required fields
 */
export async function deserializeIntentMandate(json: string): Promise<IntentMandate> {
  let parsed: any;

  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error("Invalid JSON format");
  }

  // Validate required fields
  if (!parsed.natural_language_description) {
    throw new Error("Missing required field 'natural_language_description'");
  }

  if (!parsed.intent_expiry) {
    throw new Error("Missing required field 'intent_expiry'");
  }

  return parsed as IntentMandate;
}

/**
 * Serializes CartContents to JSON string
 *
 * @param cartContents - Cart contents to serialize
 * @returns Promise resolving to JSON string
 */
export async function serializeCartContents(cartContents: CartContents): Promise<string> {
  return JSON.stringify(cartContents);
}

/**
 * Deserializes JSON string to CartContents
 *
 * @param json - JSON string to deserialize
 * @returns Promise resolving to CartContents
 * @throws Error if JSON is invalid or missing required fields
 */
export async function deserializeCartContents(json: string): Promise<CartContents> {
  let parsed: any;

  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error("Invalid JSON format");
  }

  // Validate required fields
  if (!parsed.id) {
    throw new Error("Missing required field 'id'");
  }

  if (!parsed.merchant_name) {
    throw new Error("Missing required field 'merchant_name'");
  }

  if (!parsed.cart_expiry) {
    throw new Error("Missing required field 'cart_expiry'");
  }

  if (!parsed.payment_request) {
    throw new Error("Missing required field 'payment_request'");
  }

  if (parsed.user_cart_confirmation_required === undefined) {
    throw new Error("Missing required field 'user_cart_confirmation_required'");
  }

  return parsed as CartContents;
}

/**
 * Serializes CartMandate to JSON string
 *
 * @param cartMandate - Cart mandate to serialize
 * @returns Promise resolving to JSON string
 */
export async function serializeCartMandate(cartMandate: CartMandate): Promise<string> {
  return JSON.stringify(cartMandate);
}

/**
 * Deserializes JSON string to CartMandate
 *
 * @param json - JSON string to deserialize
 * @returns Promise resolving to CartMandate
 * @throws Error if JSON is invalid or missing required fields
 */
export async function deserializeCartMandate(json: string): Promise<CartMandate> {
  let parsed: any;

  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error("Invalid JSON format");
  }

  // Validate required fields
  if (!parsed.contents) {
    throw new Error("Missing required field 'contents'");
  }

  return parsed as CartMandate;
}

/**
 * Serializes PaymentRequest to JSON string
 *
 * @param paymentRequest - Payment request to serialize
 * @returns Promise resolving to JSON string
 */
export async function serializePaymentRequest(paymentRequest: PaymentRequest): Promise<string> {
  return JSON.stringify(paymentRequest);
}

/**
 * Deserializes JSON string to PaymentRequest
 *
 * @param json - JSON string to deserialize
 * @returns Promise resolving to PaymentRequest
 * @throws Error if JSON is invalid or missing required fields
 */
export async function deserializePaymentRequest(json: string): Promise<PaymentRequest> {
  let parsed: any;

  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error("Invalid JSON format");
  }

  // Validate required fields
  if (!parsed.methodData) {
    throw new Error("Missing required field 'methodData'");
  }

  if (!parsed.details) {
    throw new Error("Missing required field 'details'");
  }

  return parsed as PaymentRequest;
}

/**
 * Generic mandate serialization dispatcher
 *
 * @param mandate - Mandate to serialize
 * @returns Promise resolving to JSON string
 */
export async function serializeMandate(mandate: Mandate): Promise<string> {
  // Check if it's an IntentMandate
  if ('natural_language_description' in mandate) {
    return await serializeIntentMandate(mandate as IntentMandate);
  }

  // Check if it's a CartMandate
  if ('contents' in mandate) {
    return await serializeCartMandate(mandate as CartMandate);
  }

  throw new Error("Unknown mandate type");
}

/**
 * Generic mandate deserialization dispatcher
 *
 * @param json - JSON string to deserialize
 * @returns Promise resolving to Mandate
 * @throws Error if JSON is invalid or represents unknown mandate type
 */
export async function deserializeMandate(json: string): Promise<Mandate> {
  let parsed: any;

  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error("Invalid JSON format");
  }

  // Check if it's an IntentMandate (has natural_language_description)
  if ('natural_language_description' in parsed) {
    return await deserializeIntentMandate(json);
  }

  // Check if it's a CartMandate (has contents)
  if ('contents' in parsed) {
    return await deserializeCartMandate(json);
  }

  throw new Error("Unknown mandate type - JSON does not represent a valid mandate");
}