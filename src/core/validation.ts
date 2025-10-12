/**
 * Validation Functions for AP2
 *
 * Functions for validating mandates, payment requests, and related structures.
 * Implementation follows TDD - these functions pass the pre-written tests.
 */

import type { IntentMandate, CartContents, CartMandate, PaymentRequest, Mandate } from "../types/mod.ts";
import {
  MandateValidationError,
  PaymentRequestValidationError,
  isValidISO8601,
  isExpired,
} from "../utils/mod.ts";
import currencyCodes from "currency-codes";

/**
 * Result of validation operations
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validates an IntentMandate structure and content
 *
 * @param intentMandate - Intent mandate to validate
 * @returns Promise resolving to validation result
 */
export async function validateIntentMandate(intentMandate: IntentMandate): Promise<ValidationResult> {
  const errors: string[] = [];

  // Check description
  if (!intentMandate.natural_language_description || intentMandate.natural_language_description.trim() === "") {
    errors.push("Natural language description cannot be empty");
  }

  // Check expiry date format
  if (!isValidISO8601(intentMandate.intent_expiry)) {
    errors.push("Invalid date format for intent_expiry");
  } else if (isExpired(intentMandate.intent_expiry)) {
    errors.push("Intent mandate has expired");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates CartContents structure and content
 *
 * @param cartContents - Cart contents to validate
 * @returns Promise resolving to validation result
 */
export async function validateCartContents(cartContents: CartContents): Promise<ValidationResult> {
  const errors: string[] = [];

  // Check cart ID
  if (!cartContents.id || cartContents.id.trim() === "") {
    errors.push("Cart ID cannot be empty");
  }

  // Check merchant name
  if (!cartContents.merchant_name || cartContents.merchant_name.trim() === "") {
    errors.push("Merchant name cannot be empty");
  }

  // Check cart expiry date format
  if (!isValidISO8601(cartContents.cart_expiry)) {
    errors.push("Invalid date format for cart_expiry");
  } else if (isExpired(cartContents.cart_expiry)) {
    errors.push("Cart has expired");
  }

  // Validate payment request
  const paymentValidation = await validatePaymentRequest(cartContents.payment_request);
  if (!paymentValidation.isValid) {
    errors.push(...paymentValidation.errors.map(e => `Payment request: ${e}`));
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates a CartMandate structure and content
 *
 * @param cartMandate - Cart mandate to validate
 * @returns Promise resolving to validation result
 */
export async function validateCartMandate(cartMandate: CartMandate): Promise<ValidationResult> {
  // Validate the cart contents within the mandate
  return await validateCartContents(cartMandate.contents);
}

/**
 * Generic mandate validation dispatcher
 *
 * @param mandate - Mandate to validate
 * @returns Promise resolving to validation result
 */
export async function validateMandate(mandate: Mandate): Promise<ValidationResult> {
  // Check if it's an IntentMandate
  if ('natural_language_description' in mandate) {
    return await validateIntentMandate(mandate as IntentMandate);
  }

  // Check if it's a CartMandate
  if ('contents' in mandate) {
    return await validateCartMandate(mandate as CartMandate);
  }

  // Unknown mandate type
  return {
    isValid: false,
    errors: ["Unknown mandate type"],
  };
}

/**
 * Validates a PaymentRequest structure and content
 *
 * @param paymentRequest - Payment request to validate
 * @returns Promise resolving to validation result
 */
export async function validatePaymentRequest(paymentRequest: PaymentRequest): Promise<ValidationResult> {
  const errors: string[] = [];

  // Check payment methods
  if (!paymentRequest.methodData || paymentRequest.methodData.length === 0) {
    errors.push("At least one payment method must be specified");
  }

  // Validate total amount
  if (paymentRequest.details.total) {
    const total = paymentRequest.details.total;

    // Check currency using ISO 4217 standard
    if (!currencyCodes.code(total.amount.currency)) {
      errors.push("Invalid currency code - not found in ISO 4217 standard");
    }

    // Check amount is positive
    const amount = parseFloat(total.amount.value);
    if (isNaN(amount) || amount < 0) {
      errors.push("Invalid amount - must be a positive number");
    }

    // Check refund period is reasonable
    if (total.refund_period < 0 || total.refund_period > 365) {
      errors.push("Refund period must be between 0 and 365 days");
    }
  }

  // Validate display items if present
  if (paymentRequest.details.displayItems) {
    paymentRequest.details.displayItems.forEach((item, index) => {
      const itemAmount = parseFloat(item.amount.value);
      if (isNaN(itemAmount)) {
        errors.push(`Display item ${index + 1} has invalid amount`);
      }

      if (!currencyCodes.code(item.amount.currency)) {
        errors.push(`Display item ${index + 1} has invalid currency code`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
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
  // Check IntentMandate expiry
  if ('intent_expiry' in mandate) {
    const intentMandate = mandate as IntentMandate;
    return isExpired(intentMandate.intent_expiry, currentDate);
  }

  // Check CartMandate expiry (through its contents)
  if ('contents' in mandate) {
    const cartMandate = mandate as CartMandate;
    return isExpired(cartMandate.contents.cart_expiry, currentDate);
  }

  // Unknown mandate type - assume not expired
  return false;
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
  return isExpired(cartContents.cart_expiry, currentDate);
}

/**
 * Validates the integrity of a mandate by checking required fields
 *
 * @param mandate - Mandate to validate integrity
 * @returns Promise resolving to validation result
 */
export async function validateMandateIntegrity(mandate: Mandate): Promise<ValidationResult> {
  const errors: string[] = [];

  const hasIntentFields = 'intent_expiry' in mandate || 'natural_language_description' in mandate;
  const hasCartFields = 'contents' in mandate;

  // Check IntentMandate required fields
  if (hasIntentFields) {
    // This looks like an IntentMandate, validate all required fields
    const intentMandate = mandate as IntentMandate;

    if (!intentMandate.natural_language_description) {
      errors.push("required field 'natural_language_description' is missing");
    }

    if (!intentMandate.intent_expiry) {
      errors.push("required field 'intent_expiry' is missing");
    }
  }

  // Check CartMandate required fields
  if (hasCartFields) {
    const cartMandate = mandate as CartMandate;

    if (!cartMandate.contents) {
      errors.push("required field 'contents' is missing");
    } else {
      // Validate the contents integrity
      const contentsIntegrity = await validateCartContentsIntegrity(cartMandate.contents);
      if (!contentsIntegrity.isValid) {
        errors.push(...contentsIntegrity.errors);
      }
    }
  }

  // If it doesn't look like either type, it's an error
  if (!hasIntentFields && !hasCartFields) {
    errors.push("required field 'contents' is missing");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates the integrity of CartContents by checking required fields
 *
 * @param cartContents - Cart contents to validate integrity
 * @returns Promise resolving to validation result
 */
export async function validateCartContentsIntegrity(cartContents: CartContents): Promise<ValidationResult> {
  const errors: string[] = [];

  if (!cartContents.id) {
    errors.push("required field 'id' is missing");
  }

  if (!cartContents.merchant_name) {
    errors.push("required field 'merchant_name' is missing");
  }

  if (!cartContents.cart_expiry) {
    errors.push("required field 'cart_expiry' is missing");
  }

  if (!cartContents.payment_request) {
    errors.push("required field 'payment_request' is missing");
  }

  if (cartContents.user_cart_confirmation_required === undefined) {
    errors.push("required field 'user_cart_confirmation_required' is missing");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}