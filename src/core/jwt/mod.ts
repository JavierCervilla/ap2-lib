/**
 * JWT Module
 *
 * Web-friendly JWT implementation for AP2 protocol using JOSE.
 * Follows SOLID principles and uses only standard Web APIs.
 */

// Export interfaces
export type {
  MerchantAuthorizationPayload,
  JWTAlgorithm,
  JWTKeyConfig,
  JWTSignOptions,
  JWTVerifyOptions,
  JWTVerificationResult,
  IJWTService,
  IJWTSigner,
  IJWTVerifier,
  IJWTKeyManager
} from './interfaces.ts';

// Export implementations
export {
  JOSEJWTSigner,
  JOSEJWTVerifier,
  JOSEJWTKeyManager,
  JOSEJWTService,
  jwtService
} from './jose-service.ts';

// Export validation utilities
export {
  JTIValidator,
  MemoryJTIStorage,
  defaultJTIValidator,
  type IJTIValidator,
  type IJTIStorage,
  type JTIValidationResult,
  type JTIEntry
} from './jti-validator.ts';

export {
  ChecksumValidator,
  defaultChecksumValidator,
  type IChecksumValidator,
  type ChecksumValidationResult,
  type JWTComponentValidation,
  type CartCanonicalizationOptions
} from './checksum-validator.ts';