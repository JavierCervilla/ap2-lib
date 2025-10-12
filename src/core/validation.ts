/**
 * Validation Functions for AP2 - Refactored
 *
 * Functions for validating mandates, payment requests, and related structures.
 * Refactored to use strategy pattern and follow SOLID principles while maintaining
 * backward compatibility with the existing API.
 */

import type { IntentMandate, CartContents, CartMandate, PaymentRequest, Mandate } from "../types/mod.ts";
import { isExpired } from "../utils/mod.ts";

// Import strategy components
import { ValidationResult } from "./validation/interfaces.ts";
import { defaultMandateValidationRegistry } from "./strategies/mandate-validator-strategy.ts";
import { IntentMandateValidator } from "./validation/intent-mandate-validator.ts";
import { CartContentsValidator } from "./validation/cart-contents-validator.ts";
import { CartMandateValidator } from "./validation/cart-mandate-validator.ts";
import { PaymentRequestValidator } from "./validation/payment-request-validator.ts";
import { DEFAULT_VALIDATION_CONFIG } from "./config/validation-config.ts";

// Export the ValidationResult type for backward compatibility
export type { ValidationResult };

// Create validator instances with default configuration
const intentMandateValidator = new IntentMandateValidator(DEFAULT_VALIDATION_CONFIG);
const cartContentsValidator = new CartContentsValidator(DEFAULT_VALIDATION_CONFIG);
const cartMandateValidator = new CartMandateValidator(DEFAULT_VALIDATION_CONFIG);
const paymentRequestValidator = new PaymentRequestValidator(DEFAULT_VALIDATION_CONFIG);

/**
 * Validates an IntentMandate structure and content
 *
 * @param intentMandate - Intent mandate to validate
 * @returns Promise resolving to validation result
 */
export async function validateIntentMandate(intentMandate: IntentMandate): Promise<ValidationResult> {
  return await intentMandateValidator.validate(intentMandate);
}

/**
 * Validates CartContents structure and content
 *
 * @param cartContents - Cart contents to validate
 * @returns Promise resolving to validation result
 */
export async function validateCartContents(cartContents: CartContents): Promise<ValidationResult> {
  return await cartContentsValidator.validate(cartContents);
}

/**
 * Validates a CartMandate structure and content
 *
 * @param cartMandate - Cart mandate to validate
 * @returns Promise resolving to validation result
 */
export async function validateCartMandate(cartMandate: CartMandate): Promise<ValidationResult> {
  return await cartMandateValidator.validate(cartMandate);
}

/**
 * Generic mandate validation dispatcher
 *
 * @param mandate - Mandate to validate
 * @returns Promise resolving to validation result
 */
export async function validateMandate(mandate: Mandate): Promise<ValidationResult> {
  return await defaultMandateValidationRegistry.validateMandate(mandate);
}

/**
 * Validates a PaymentRequest structure and content
 *
 * @param paymentRequest - Payment request to validate
 * @returns Promise resolving to validation result
 */
export async function validatePaymentRequest(paymentRequest: PaymentRequest): Promise<ValidationResult> {
  return await paymentRequestValidator.validate(paymentRequest);
}

/**
 * Checks if a mandate has expired
 *
 * @param mandate - Mandate to check
 * @param currentDate - Current date (defaults to now)
 * @returns Promise resolving to true if expired
 */
export async function checkMandateExpiry(
  mandate: Mandate,
  currentDate = new Date()
): Promise<boolean> {
  return await defaultMandateValidationRegistry.checkMandateExpiry(mandate, currentDate);
}

/**
 * Checks if CartContents has expired
 *
 * @param cartContents - Cart contents to check
 * @param currentDate - Current date (defaults to now)
 * @returns Promise resolving to true if expired
 */
export async function checkCartContentsExpiry(
  cartContents: CartContents,
  currentDate = new Date()
): Promise<boolean> {
  return await cartContentsValidator.checkExpiry(cartContents, currentDate);
}

/**
 * Validates the integrity of a mandate by checking required fields
 *
 * @param mandate - Mandate to validate integrity
 * @returns Promise resolving to validation result
 */
export async function validateMandateIntegrity(mandate: Mandate): Promise<ValidationResult> {
  return await defaultMandateValidationRegistry.validateMandateIntegrity(mandate);
}

/**
 * Validates the integrity of CartContents by checking required fields
 *
 * @param cartContents - Cart contents to validate integrity
 * @returns Promise resolving to validation result
 */
export async function validateCartContentsIntegrity(cartContents: CartContents): Promise<ValidationResult> {
  return await cartContentsValidator.validateIntegrity(cartContents);
}