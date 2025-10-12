/**
 * AP2 Error Classes
 *
 * Custom error classes for the Agent Payments Protocol implementation.
 * These provide specific error types for different failure scenarios.
 */

/**
 * Base class for all AP2-related errors
 */
export abstract class AP2Error extends Error {
  abstract readonly code: string;

  constructor(message: string, public readonly details?: Record<string, unknown>) {
    super(message);
    this.name = this.constructor.name;
  }
}

/**
 * Error thrown when mandate validation fails
 */
export class MandateValidationError extends AP2Error {
  readonly code = "MANDATE_VALIDATION_ERROR";
}

/**
 * Error thrown when mandate has expired
 */
export class MandateExpiredError extends AP2Error {
  readonly code = "MANDATE_EXPIRED";
}

/**
 * Error thrown when cryptographic operations fail
 */
export class CryptographicError extends AP2Error {
  readonly code = "CRYPTOGRAPHIC_ERROR";
}

/**
 * Error thrown when signature verification fails
 */
export class SignatureVerificationError extends AP2Error {
  readonly code = "SIGNATURE_VERIFICATION_ERROR";
}

/**
 * Error thrown when serialization/deserialization fails
 */
export class SerializationError extends AP2Error {
  readonly code = "SERIALIZATION_ERROR";
}

/**
 * Error thrown when payment request validation fails
 */
export class PaymentRequestValidationError extends AP2Error {
  readonly code = "PAYMENT_REQUEST_VALIDATION_ERROR";
}

/**
 * Error thrown when ISO 8601 date parsing fails
 */
export class DateParseError extends AP2Error {
  readonly code = "DATE_PARSE_ERROR";
}