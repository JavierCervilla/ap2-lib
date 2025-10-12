/**
 * Mandate Factory
 *
 * Functions for creating and validating AP2 mandates.
 * Implementation follows TDD - these functions pass the pre-written tests.
 */

import type { IntentMandate, CartContents, CartMandate } from "../types/mod.ts";
import {
  MandateValidationError,
  DateParseError,
  isValidISO8601,
  parseISO8601,
  isExpired
} from "../utils/mod.ts";

/**
 * Input parameters for creating an IntentMandate
 */
export interface CreateIntentMandateParams {
  user_cart_confirmation_required?: boolean;
  natural_language_description: string;
  merchants?: readonly string[];
  skus?: readonly string[];
  requires_refundability?: boolean;
  intent_expiry: string;
}

/**
 * Input parameters for creating CartContents
 */
export interface CreateCartContentsParams {
  id: string;
  user_cart_confirmation_required: boolean;
  payment_request: CartContents["payment_request"];
  cart_expiry: string;
  merchant_name: string;
}

/**
 * Input parameters for creating a CartMandate
 */
export interface CreateCartMandateParams {
  contents: CartContents;
  merchant_authorization?: string;
}

/**
 * Creates a new IntentMandate with validation
 *
 * @param params - Parameters for creating the mandate
 * @returns Promise resolving to a validated IntentMandate
 * @throws MandateValidationError if validation fails
 * @throws DateParseError if date format is invalid
 */
export async function createIntentMandate(params: CreateIntentMandateParams): Promise<IntentMandate> {
  // Validate natural language description
  if (!params.natural_language_description || params.natural_language_description.trim() === "") {
    throw new MandateValidationError("Description cannot be empty");
  }

  // Validate expiry date format
  if (!isValidISO8601(params.intent_expiry)) {
    throw new DateParseError(`Invalid ISO 8601 date format: ${params.intent_expiry}`);
  }

  // Check if expiry date is in the past
  if (isExpired(params.intent_expiry)) {
    throw new MandateValidationError("Expiry date cannot be in the past");
  }

  // Create the mandate with defaults
  const mandate: IntentMandate = {
    user_cart_confirmation_required: params.user_cart_confirmation_required ?? true,
    natural_language_description: params.natural_language_description,
    merchants: params.merchants,
    skus: params.skus,
    requires_refundability: params.requires_refundability ?? false,
    intent_expiry: params.intent_expiry,
  };

  return mandate;
}

/**
 * Creates new CartContents with validation
 *
 * @param params - Parameters for creating cart contents
 * @returns Promise resolving to validated CartContents
 * @throws MandateValidationError if validation fails
 * @throws DateParseError if date format is invalid
 */
export async function createCartContents(params: CreateCartContentsParams): Promise<CartContents> {
  // Validate cart ID
  if (!params.id || params.id.trim() === "") {
    throw new MandateValidationError("Cart ID cannot be empty");
  }

  // Validate merchant name
  if (!params.merchant_name || params.merchant_name.trim() === "") {
    throw new MandateValidationError("Merchant name cannot be empty");
  }

  // Validate cart expiry date format
  if (!isValidISO8601(params.cart_expiry)) {
    throw new DateParseError(`Invalid ISO 8601 date format: ${params.cart_expiry}`);
  }

  // Create the cart contents
  const cartContents: CartContents = {
    id: params.id,
    user_cart_confirmation_required: params.user_cart_confirmation_required,
    payment_request: params.payment_request,
    cart_expiry: params.cart_expiry,
    merchant_name: params.merchant_name,
  };

  return cartContents;
}

/**
 * Creates a new CartMandate with validation
 *
 * @param params - Parameters for creating the cart mandate
 * @returns Promise resolving to a validated CartMandate
 * @throws MandateValidationError if validation fails
 */
export async function createCartMandate(params: CreateCartMandateParams): Promise<CartMandate> {
  // Validate cart contents by checking required fields
  if (!params.contents.id || params.contents.id.trim() === "") {
    throw new MandateValidationError("Cart ID cannot be empty");
  }

  if (!params.contents.merchant_name || params.contents.merchant_name.trim() === "") {
    throw new MandateValidationError("Merchant name cannot be empty");
  }

  // Validate date format
  if (!isValidISO8601(params.contents.cart_expiry)) {
    throw new DateParseError(`Invalid ISO 8601 date format: ${params.contents.cart_expiry}`);
  }

  // Create the cart mandate
  const cartMandate: CartMandate = {
    contents: params.contents,
    merchant_authorization: params.merchant_authorization,
  };

  return cartMandate;
}