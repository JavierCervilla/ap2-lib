/**
 * JWT Service Interfaces
 *
 * SOLID-compliant interfaces for JWT operations in AP2 protocol.
 * Follows Interface Segregation Principle (ISP) by separating concerns.
 */

/**
 * JWT Payload for merchant authorization as per AP2 specification
 */
export interface MerchantAuthorizationPayload {
  /** Issuer - identifier for the merchant */
  iss: string;
  /** Subject - identifier for the merchant (same as iss for merchant auth) */
  sub: string;
  /** Audience - intended recipient (e.g., payment processor) */
  aud: string;
  /** Issued at timestamp */
  iat: number;
  /** Expiration timestamp (short-lived, 5-15 minutes) */
  exp: number;
  /** JWT ID - unique identifier to prevent replay attacks */
  jti: string;
  /** Secure hash of the CartMandate for integrity verification */
  cart_hash: string;
}

/**
 * Supported JWT algorithms for AP2 protocol
 */
export type JWTAlgorithm = 'RS256' | 'RS384' | 'RS512' | 'ES256' | 'ES384' | 'ES512';

/**
 * JWT Key configuration
 */
export interface JWTKeyConfig {
  /** Private key for signing (PEM format) */
  privateKey: string;
  /** Public key for verification (PEM format) */
  publicKey: string;
  /** Algorithm to use for signing/verification */
  algorithm: JWTAlgorithm;
  /** Key ID for identifying the key */
  keyId?: string;
}

/**
 * JWT signing options
 */
export interface JWTSignOptions {
  /** Key configuration */
  keyConfig: JWTKeyConfig;
  /** Additional payload claims */
  additionalClaims?: Record<string, unknown>;
  /** Custom expiration time in seconds (default: 15 minutes) */
  expiresIn?: number;
}

/**
 * JWT verification options
 */
export interface JWTVerifyOptions {
  /** Key configuration */
  keyConfig: JWTKeyConfig;
  /** Expected audience */
  audience?: string;
  /** Expected issuer */
  issuer?: string;
  /** Whether to verify expiration (default: true) */
  verifyExp?: boolean;
  /** Clock tolerance in seconds (default: 30) */
  clockTolerance?: number;
}

/**
 * JWT verification result
 */
export interface JWTVerificationResult {
  /** Whether the JWT is valid */
  valid: boolean;
  /** Decoded payload if valid */
  payload?: MerchantAuthorizationPayload;
  /** Error message if invalid */
  error?: string;
  /** Whether the token has expired */
  expired?: boolean;
  /** Whether the signature is valid */
  signatureValid?: boolean;
  /** Whether JTI validation passed (replay attack prevention) */
  jtiValid?: boolean;
  /** Whether checksum validation passed */
  checksumValid?: boolean;
  /** Detailed validation errors */
  validationErrors?: string[];
}

/**
 * Interface for JWT signing operations
 * Follows Single Responsibility Principle (SRP)
 */
export interface IJWTSigner {
  /**
   * Signs a merchant authorization payload
   *
   * @param payload - The payload to sign
   * @param options - Signing options
   * @returns Promise resolving to base64url-encoded JWT
   */
  signMerchantAuthorization(
    payload: Omit<MerchantAuthorizationPayload, 'iat' | 'exp' | 'jti'>,
    options: JWTSignOptions
  ): Promise<string>;
}

/**
 * Interface for JWT verification operations
 * Follows Single Responsibility Principle (SRP)
 */
export interface IJWTVerifier {
  /**
   * Verifies a merchant authorization JWT
   *
   * @param jwt - The JWT token to verify
   * @param options - Verification options
   * @returns Promise resolving to verification result
   */
  verifyMerchantAuthorization(
    jwt: string,
    options: JWTVerifyOptions
  ): Promise<JWTVerificationResult>;
}

/**
 * Combined interface for full JWT operations
 * Follows Interface Segregation Principle (ISP) by composing smaller interfaces
 */
export interface IJWTService extends IJWTSigner, IJWTVerifier {
  /**
   * Generates a unique JWT ID for replay attack prevention
   */
  generateJTI(): string;

  /**
   * Computes a secure hash of cart contents for integrity verification
   *
   * @param cartContents - The cart contents to hash
   * @returns Secure hash string
   */
  computeCartHash(cartContents: unknown): Promise<string>;
}

/**
 * Interface for JWT key management
 * Follows Single Responsibility Principle (SRP)
 */
export interface IJWTKeyManager {
  /**
   * Generates a new key pair for JWT operations
   *
   * @param algorithm - The algorithm to generate keys for
   * @returns Promise resolving to key configuration
   */
  generateKeyPair(algorithm: JWTAlgorithm): Promise<JWTKeyConfig>;

  /**
   * Validates a key configuration
   *
   * @param keyConfig - The key configuration to validate
   * @returns Whether the configuration is valid
   */
  validateKeyConfig(keyConfig: JWTKeyConfig): Promise<boolean>;
}