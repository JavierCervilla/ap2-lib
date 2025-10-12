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