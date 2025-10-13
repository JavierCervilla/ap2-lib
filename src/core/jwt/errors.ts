/**
 * Custom error types for the JWT Service.
 * Provides clear, specific errors for consumers of the library.
 */

/**
 * Error options interface compatible with both Web and Node.js environments
 */
interface JWTErrorOptions {
  cause?: unknown;
}

/**
 * Base error class for all JWT service-related errors.
 * Allows consumers to catch any error originating from this service.
 */
export class JWTServiceError extends Error {
  constructor(message: string, options?: JWTErrorOptions) {
    super(message);
    this.name = this.constructor.name; // Ensures the error name is correct
    if (options?.cause) {
      this.cause = options.cause;
    }
  }
}

/**
 * Thrown when there is an issue with cryptographic key generation,
 * validation, or formatting.
 */
export class KeyManagementError extends JWTServiceError {}

/**
 * Thrown when the JWT signing process fails.
 */
export class JWTSigningError extends JWTServiceError {}

/**
 * Thrown for catastrophic failures during the verification process.
 * Note: Standard validation failures (e.g., bad signature) are returned
 * in the result object, not thrown.
 */
export class JWTVerificationError extends JWTServiceError {}