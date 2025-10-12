/**
 * Standardized validation error messages
 *
 * This module contains all validation error messages in a centralized location,
 * following the Single Responsibility Principle and making localization easier.
 */

/**
 * Error messages for mandate validation
 */
export const MANDATE_MESSAGES = {
  EMPTY_DESCRIPTION: "Natural language description cannot be empty",
  WHITESPACE_DESCRIPTION: "Natural language description cannot be empty",
  INVALID_DATE_FORMAT: "Invalid date format for intent_expiry",
  EXPIRED_MANDATE: "Intent mandate has expired",
  UNKNOWN_TYPE: "Unknown mandate type",
  MISSING_NATURAL_LANGUAGE_DESCRIPTION: "required field 'natural_language_description' is missing",
  MISSING_INTENT_EXPIRY: "required field 'intent_expiry' is missing",
  MISSING_CONTENTS: "required field 'contents' is missing",
} as const;

/**
 * Error messages for cart validation
 */
export const CART_MESSAGES = {
  EMPTY_ID: "Cart ID cannot be empty",
  WHITESPACE_ID: "Cart ID cannot be empty",
  EMPTY_MERCHANT_NAME: "Merchant name cannot be empty",
  WHITESPACE_MERCHANT_NAME: "Merchant name cannot be empty",
  INVALID_EXPIRY_FORMAT: "Invalid date format for cart_expiry",
  EXPIRED_CART: "Cart has expired",
  MISSING_ID: "required field 'id' is missing",
  MISSING_MERCHANT_NAME: "required field 'merchant_name' is missing",
  MISSING_CART_EXPIRY: "required field 'cart_expiry' is missing",
  MISSING_PAYMENT_REQUEST: "required field 'payment_request' is missing",
  MISSING_USER_CONFIRMATION: "required field 'user_cart_confirmation_required' is missing",
} as const;

/**
 * Error messages for payment request validation
 */
export const PAYMENT_MESSAGES = {
  NO_PAYMENT_METHODS: "At least one payment method must be specified",
  INVALID_CURRENCY: "Invalid currency code - not found in ISO 4217 standard",
  INVALID_AMOUNT: "Invalid amount - must be a positive number",
  INVALID_REFUND_PERIOD: "Refund period must be between {min} and {max} days",
  DISPLAY_ITEM_INVALID_AMOUNT: "Display item {index} has invalid amount",
  DISPLAY_ITEM_INVALID_CURRENCY: "Display item {index} has invalid currency code",
  MISSING_METHOD_DATA: "Missing required field 'methodData'",
  MISSING_DETAILS: "Missing required field 'details'",
} as const;

/**
 * Error messages for serialization
 */
export const SERIALIZATION_MESSAGES = {
  INVALID_JSON: "Invalid JSON format",
  UNKNOWN_MANDATE_TYPE: "Unknown mandate type - JSON does not represent a valid mandate",
} as const;

/**
 * Utility function to format messages with parameters
 */
export function formatMessage(template: string, params: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    const value = params[key];
    return value !== undefined ? String(value) : match;
  });
}

/**
 * Message formatter for consistent error message creation
 */
export class ValidationMessageFormatter {
  static formatDisplayItemError(messageTemplate: string, itemIndex: number): string {
    return formatMessage(messageTemplate, { index: itemIndex + 1 });
  }

  static formatRefundPeriodError(min: number, max: number): string {
    return formatMessage(PAYMENT_MESSAGES.INVALID_REFUND_PERIOD, { min, max });
  }

  static formatPaymentRequestError(originalError: string): string {
    return `Payment request: ${originalError}`;
  }
}