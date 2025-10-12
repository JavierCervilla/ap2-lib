/**
 * JOSE-based JWT Service Implementation
 *
 * Production-ready JWT service using the 'jose' library.
 * Implements all JWT interfaces following SOLID principles.
 * Uses only Web-friendly APIs as per REQUIREMENTS.md.
 */

import * as jose from 'jose';
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';

import type {
  IJWTService,
  IJWTSigner,
  IJWTVerifier,
  IJWTKeyManager,
  MerchantAuthorizationPayload,
  JWTAlgorithm,
  JWTKeyConfig,
  JWTSignOptions,
  JWTVerifyOptions,
  JWTVerificationResult
} from './interfaces.ts';

/**
 * JOSE-based JWT Signer Implementation
 * Follows Single Responsibility Principle (SRP)
 */
export class JOSEJWTSigner implements IJWTSigner {
  async signMerchantAuthorization(
    payload: Omit<MerchantAuthorizationPayload, 'iat' | 'exp' | 'jti'>,
    options: JWTSignOptions
  ): Promise<string> {
    try {
      // Import private key
      const privateKey = await this.importPrivateKey(
        options.keyConfig.privateKey,
        options.keyConfig.algorithm
      );

      // Generate JWT ID for replay attack prevention
      const jti = await this.generateJTI();
      const now = Math.floor(Date.now() / 1000);
      const expiresIn = options.expiresIn || 900; // Default 15 minutes

      // Build complete payload
      const completePayload = {
        ...payload,
        iat: now,
        exp: now + expiresIn,
        jti,
        ...options.additionalClaims
      } as jose.JWTPayload;

      // Create JWT
      const jwt = await new jose.SignJWT(completePayload)
        .setProtectedHeader({
          alg: options.keyConfig.algorithm,
          kid: options.keyConfig.keyId
        })
        .sign(privateKey);

      return jwt;
    } catch (error) {
      throw new Error(`Failed to sign JWT: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async importPrivateKey(privateKey: string, algorithm: JWTAlgorithm): Promise<CryptoKey> {
    try {
      return await jose.importPKCS8(privateKey, algorithm);
    } catch {
      // Try importing as JWK if PKCS8 fails
      try {
        return await jose.importJWK(JSON.parse(privateKey), algorithm) as CryptoKey;
      } catch {
        throw new Error('Invalid private key format. Expected PKCS8 PEM or JWK JSON.');
      }
    }
  }

  private async generateJTI(): Promise<string> {
    // Use Web Crypto API for web-friendly random generation
    const randomBytes = crypto.getRandomValues(new Uint8Array(16));
    return bytesToHex(randomBytes);
  }
}

/**
 * JOSE-based JWT Verifier Implementation
 * Follows Single Responsibility Principle (SRP)
 */
export class JOSEJWTVerifier implements IJWTVerifier {
  async verifyMerchantAuthorization(
    jwt: string,
    options: JWTVerifyOptions
  ): Promise<JWTVerificationResult> {
    try {
      // Import public key
      const publicKey = await this.importPublicKey(
        options.keyConfig.publicKey,
        options.keyConfig.algorithm
      );

      // Verify JWT
      const { payload } = await jose.jwtVerify(jwt, publicKey, {
        audience: options.audience,
        issuer: options.issuer,
        clockTolerance: options.clockTolerance || 30
      });

      // Validate payload structure
      const merchantPayload = this.validateMerchantPayload(payload);

      return {
        valid: true,
        payload: merchantPayload,
        signatureValid: true,
        expired: false
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Check for specific error types
      const expired = errorMessage.includes('expired') || errorMessage.includes('exp');
      const signatureInvalid = errorMessage.includes('signature') || errorMessage.includes('invalid');

      return {
        valid: false,
        error: errorMessage,
        expired,
        signatureValid: !signatureInvalid
      };
    }
  }

  private async importPublicKey(publicKey: string, algorithm: JWTAlgorithm): Promise<CryptoKey> {
    try {
      return await jose.importSPKI(publicKey, algorithm);
    } catch {
      // Try importing as JWK if SPKI fails
      try {
        return await jose.importJWK(JSON.parse(publicKey), algorithm) as CryptoKey;
      } catch {
        throw new Error('Invalid public key format. Expected SPKI PEM or JWK JSON.');
      }
    }
  }

  private validateMerchantPayload(payload: jose.JWTPayload): MerchantAuthorizationPayload {
    // Validate required fields
    const requiredFields = ['iss', 'sub', 'aud', 'iat', 'exp', 'jti', 'cart_hash'];
    for (const field of requiredFields) {
      if (!(field in payload)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    return payload as unknown as MerchantAuthorizationPayload;
  }
}

/**
 * JOSE-based JWT Key Manager Implementation
 * Follows Single Responsibility Principle (SRP)
 */
export class JOSEJWTKeyManager implements IJWTKeyManager {
  async generateKeyPair(algorithm: JWTAlgorithm): Promise<JWTKeyConfig> {
    try {
      let keyPair: jose.GenerateKeyPairResult;

      // Generate key pair based on algorithm family
      if (algorithm.startsWith('RS')) {
        keyPair = await jose.generateKeyPair('RS256', { modulusLength: 2048, extractable: true });
      } else if (algorithm.startsWith('ES')) {
        const curve = algorithm === 'ES256' ? 'P-256' :
                     algorithm === 'ES384' ? 'P-384' : 'P-521';
        keyPair = await jose.generateKeyPair(algorithm, { crv: curve, extractable: true });
      } else {
        throw new Error(`Unsupported algorithm: ${algorithm}`);
      }

      // Export keys
      const privateKey = await jose.exportPKCS8(keyPair.privateKey);
      const publicKey = await jose.exportSPKI(keyPair.publicKey);

      // Generate key ID using web-friendly approach
      const keyId = bytesToHex(sha256(new TextEncoder().encode(publicKey))).substring(0, 8);

      return {
        privateKey,
        publicKey,
        algorithm,
        keyId
      };
    } catch (error) {
      throw new Error(`Failed to generate key pair: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async validateKeyConfig(keyConfig: JWTKeyConfig): Promise<boolean> {
    try {
      // Try to import both keys
      const signer = new JOSEJWTSigner();
      const verifier = new JOSEJWTVerifier();

      await signer['importPrivateKey'](keyConfig.privateKey, keyConfig.algorithm);
      await verifier['importPublicKey'](keyConfig.publicKey, keyConfig.algorithm);

      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Complete JOSE-based JWT Service Implementation
 * Follows Dependency Inversion Principle (DIP) by depending on abstractions
 */
export class JOSEJWTService implements IJWTService {
  constructor(
    private signer: IJWTSigner = new JOSEJWTSigner(),
    private verifier: IJWTVerifier = new JOSEJWTVerifier(),
    private keyManager: IJWTKeyManager = new JOSEJWTKeyManager()
  ) {}

  async signMerchantAuthorization(
    payload: Omit<MerchantAuthorizationPayload, 'iat' | 'exp' | 'jti'>,
    options: JWTSignOptions
  ): Promise<string> {
    return this.signer.signMerchantAuthorization(payload, options);
  }

  async verifyMerchantAuthorization(
    jwt: string,
    options: JWTVerifyOptions
  ): Promise<JWTVerificationResult> {
    return this.verifier.verifyMerchantAuthorization(jwt, options);
  }

  generateJTI(): string {
    // Use Web Crypto API for web-friendly random generation
    const randomBytes = crypto.getRandomValues(new Uint8Array(16));
    return bytesToHex(randomBytes);
  }

  async computeCartHash(cartContents: unknown): Promise<string> {
    // Create canonical JSON representation
    const canonicalJson = JSON.stringify(cartContents, Object.keys(cartContents as Record<string, unknown>).sort());

    // Compute SHA-256 hash
    const hash = sha256(new TextEncoder().encode(canonicalJson));

    return bytesToHex(hash);
  }

  // Delegate key management operations
  async generateKeyPair(algorithm: JWTAlgorithm): Promise<JWTKeyConfig> {
    return this.keyManager.generateKeyPair(algorithm);
  }

  async validateKeyConfig(keyConfig: JWTKeyConfig): Promise<boolean> {
    return this.keyManager.validateKeyConfig(keyConfig);
  }
}

// Export default instance
export const jwtService = new JOSEJWTService();