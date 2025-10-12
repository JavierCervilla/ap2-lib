/**
 * Mandate Factory
 *
 * Clean OOP-based API for creating and managing AP2 mandates.
 * Follows SOLID principles with class-based implementations.
 */

import type { IntentMandate, CartContents, CartMandate } from "../../../types/mod.ts";
import type { PaymentRequest } from "../../../types/mod.ts";

// Import class-based implementations
import { IntentMandateClass } from "../intent/intent-mandate-class.ts";
import { CartMandateClass } from "../cart/cart-mandate-class.ts";
import { createMandateClass, type MandateStatus } from "./mandate-class-factory.ts";

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
  payment_request: PaymentRequest;
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
 * Note: IntentMandates are never signed according to AP2 specification.
 * They represent user purchase intent but do not require cryptographic signatures.
 *
 * @param params - Parameters for creating the mandate
 * @returns Promise resolving to a new IntentMandateClass instance
 * @throws MandateValidationError if validation fails
 * @throws DateParseError if date format is invalid
 */
export async function createIntentMandate(
  params: CreateIntentMandateParams
): Promise<IntentMandateClass> {
  // Create mandate data object
  const mandateData: IntentMandate = {
    user_cart_confirmation_required: params.user_cart_confirmation_required ?? true,
    natural_language_description: params.natural_language_description,
    merchants: params.merchants,
    skus: params.skus,
    requires_refundability: params.requires_refundability ?? false,
    intent_expiry: params.intent_expiry,
  };

  // Create and return class instance (IntentMandates are never signed)
  return await IntentMandateClass.createNew(mandateData);
}

/**
 * Creates a new CartMandate from cart contents with validation and optional JWT signing
 *
 * @param contentsParams - Parameters for creating cart contents
 * @param mandateParams - Additional mandate parameters (like merchant_authorization)
 * @param signingOptions - Optional JWT signing configuration
 * @returns Promise resolving to a new CartMandateClass instance
 */
export async function createCartMandate(
  contentsParams: CreateCartContentsParams,
  mandateParams: Omit<CreateCartMandateParams, 'contents'> = {},
  signingOptions?: {
    privateKey: string;
    algorithm?: 'RS256' | 'ES256';
    merchantId?: string;
    audience?: string;
  }
): Promise<CartMandateClass> {
  // Create cart contents
  const cartContents: CartContents = {
    id: contentsParams.id,
    user_cart_confirmation_required: contentsParams.user_cart_confirmation_required,
    payment_request: contentsParams.payment_request,
    cart_expiry: contentsParams.cart_expiry,
    merchant_name: contentsParams.merchant_name,
  };

  // Create cart mandate data
  const cartMandateData: CartMandate = {
    contents: cartContents,
    merchant_authorization: mandateParams.merchant_authorization,
  };

  // Create class instance
  const mandate = await CartMandateClass.createNew(cartMandateData);

  // Sign with JWT if signing options provided
  if (signingOptions) {
    await mandate.sign(
      signingOptions.privateKey,
      { algorithm: signingOptions.algorithm || 'RS256' },
      {
        merchantId: signingOptions.merchantId || 'default-merchant'
      }
    );
  }

  return mandate;
}

/**
 * Factory function to create mandate classes from existing mandate data
 *
 * @param mandateData - The mandate data (can be signed or unsigned)
 * @param options - Optional signing/verification options
 * @returns IntentMandateClass or CartMandateClass instance
 */
export async function createMandateFromData(
  mandateData: IntentMandate | CartMandate |
               (IntentMandate & { signature?: string }) |
               (CartMandate & { merchant_authorization?: string }),
  options?: {
    privateKey?: string;
    publicKey?: string;
    validateSignature?: boolean
  }
): Promise<IntentMandateClass | CartMandateClass> {
  return await createMandateClass(mandateData, options);
}

// Re-export class types and functions
export {
  IntentMandateClass,
  CartMandateClass,
  createMandateClass,
  type MandateStatus
};