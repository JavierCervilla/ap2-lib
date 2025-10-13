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

import {
  defaultJTIValidator,
  type IJTIValidator
} from './jti-validator.ts';

import {
  defaultChecksumValidator,
  type IChecksumValidator
} from './checksum-validator.ts';

import {
  KeyManagementError,
  JWTSigningError,
} from './errors.ts';


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
      const privateKey = await this.importPrivateKey(
        options.keyConfig.privateKey,
        options.keyConfig.algorithm
      );

      const jti = this.generateJTI();
      const now = Math.floor(Date.now() / 1000);
      const expiresIn = options.expiresIn || 900;

      const completePayload = {
        ...payload,
        iat: now,
        exp: now + expiresIn,
        jti,
        ...options.additionalClaims
      } as jose.JWTPayload;

      const jwt = await new jose.SignJWT(completePayload)
        .setProtectedHeader({
          alg: options.keyConfig.algorithm,
          kid: options.keyConfig.keyId
        })
        .sign(privateKey);

      return jwt;
    } catch (error) {
      throw new JWTSigningError('Failed to sign JWT', { cause: error });
    }
  }

  private async importPrivateKey(privateKey: string, algorithm: JWTAlgorithm): Promise<CryptoKey> {
    try {
      // Primero intentar como PEM, que es común para RSA
      return await jose.importPKCS8(privateKey, algorithm);
    } catch {
      try {
        // Si falla, intentar como JWK, que usaremos para EC
        return await jose.importJWK(JSON.parse(privateKey), algorithm) as CryptoKey;
      } catch (error) {
        throw new KeyManagementError('Invalid private key format. Expected PKCS8 PEM or JWK JSON.', { cause: error });
      }
    }
  }

  private generateJTI(): string {
    const randomBytes = crypto.getRandomValues(new Uint8Array(16));
    return bytesToHex(randomBytes);
  }
}

/**
 * JOSE-based JWT Verifier Implementation with Comprehensive Validation
 * Follows Single Responsibility Principle (SRP) with enhanced security
 */
export class JOSEJWTVerifier implements IJWTVerifier {
  constructor(
    private jtiValidator: IJTIValidator = defaultJTIValidator,
    private checksumValidator: IChecksumValidator = defaultChecksumValidator
  ) { }

  async verifyMerchantAuthorization(
    jwt: string,
    options: JWTVerifyOptions
  ): Promise<JWTVerificationResult> {
    const result: JWTVerificationResult = {
      valid: false,
      signatureValid: false,
      expired: false,
      jtiValid: false,
      checksumValid: false,
      validationErrors: []
    };

    try {
      const publicKey = await this.importPublicKey(
        options.keyConfig.publicKey,
        options.keyConfig.algorithm
      );

      let jwtVerifyResult;
      try {
        jwtVerifyResult = await jose.jwtVerify(jwt, publicKey, {
          audience: options.audience,
          issuer: options.issuer,
          clockTolerance: options.clockTolerance || 30
        });
        result.signatureValid = true;
      } catch (jwtError) {
        const errorMessage = jwtError instanceof Error ? jwtError.message : String(jwtError);
        result.signatureValid = false;
        result.expired = errorMessage.includes('exp');
        result.error = errorMessage;
        result.validationErrors!.push(`JWT verification failed: ${errorMessage}`);
        return result;
      }

      let merchantPayload: MerchantAuthorizationPayload;
      try {
        merchantPayload = this.validateMerchantPayload(jwtVerifyResult.payload);
        result.payload = merchantPayload;
      } catch (payloadError) {
        const errorMessage = payloadError instanceof Error ? payloadError.message : String(payloadError);
        result.validationErrors!.push(`Payload validation failed: ${errorMessage}`);
        result.error = result.validationErrors![0];
        return result;
      }

      const jtiValidationResult = await this.jtiValidator.validateJTI(merchantPayload);
      result.jtiValid = jtiValidationResult.valid;

      if (!jtiValidationResult.valid) {
        result.validationErrors!.push(jtiValidationResult.error || 'JTI validation failed');
        if (jtiValidationResult.isReplay) {
          result.validationErrors!.push('SECURITY ALERT: Potential replay attack detected');
        }
      } else {
        try {
          await this.jtiValidator.markJTIAsUsed(merchantPayload);
        } catch (markError) {
          const errorMessage = markError instanceof Error ? markError.message : String(markError);
          result.validationErrors!.push(`Failed to mark JTI as used: ${errorMessage}`);
        }
      }

      const checksumResult = await this.checksumValidator.validateJWTComponents(jwt);
      const checksumValid = checksumResult.every(component => component.valid);
      result.checksumValid = checksumValid;

      if (!checksumValid) {
        const checksumErrors = checksumResult
          .filter(c => !c.valid)
          .map(c => `${c.type}: ${c.error}`)
          .join(', ');
        result.validationErrors!.push(`Checksum validation failed: ${checksumErrors}`);
      }

      result.valid = result.signatureValid && result.jtiValid && result.checksumValid;

      if (!result.valid && !result.error) {
        result.error = result.validationErrors!.length > 0
          ? result.validationErrors![0]
          : 'Comprehensive JWT validation failed';
      }

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      result.error = errorMessage;
      result.validationErrors!.push(`Verification error: ${errorMessage}`);
      return result;
    }
  }

  async verifyWithCartContents(
    jwt: string,
    options: JWTVerifyOptions,
    expectedCartContents: unknown
  ): Promise<JWTVerificationResult> {
    const result = await this.verifyMerchantAuthorization(jwt, options);

    if (!result.valid || !result.payload) {
      return result;
    }

    try {
      const checksumResult = await this.checksumValidator.validateJWTChecksums(
        jwt,
        expectedCartContents,
        result.payload
      );

      result.checksumValid = checksumResult.valid;

      if (!checksumResult.valid) {
        result.valid = false;
        result.validationErrors = result.validationErrors || [];
        result.validationErrors.push(...checksumResult.errors);
        result.error = checksumResult.errors[0] || 'Cart checksum validation failed';
      }

    } catch (checksumError) {
      result.checksumValid = false;
      result.valid = false;
      const errorMessage = checksumError instanceof Error ? checksumError.message : String(checksumError);
      result.validationErrors = result.validationErrors || [];
      result.validationErrors.push(`Cart checksum error: ${errorMessage}`);
      result.error = errorMessage;
    }

    return result;
  }

  private async importPublicKey(publicKey: string, algorithm: JWTAlgorithm): Promise<CryptoKey> {
    try {
      return await jose.importSPKI(publicKey, algorithm);
    } catch {
      try {
        return await jose.importJWK(JSON.parse(publicKey), algorithm) as CryptoKey;
      } catch (error) {
        throw new KeyManagementError('Invalid public key format. Expected SPKI PEM or JWK JSON.', { cause: error });
      }
    }
  }

  private validateMerchantPayload(payload: jose.JWTPayload): MerchantAuthorizationPayload {
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
      const options = { extractable: true };

      let privateKey: string;
      let publicKey: string;
      let keyIdSource: string;

      if (algorithm.startsWith('RS')) {
        keyPair = await jose.generateKeyPair('RS256', { modulusLength: 2048, ...options });
        privateKey = await jose.exportPKCS8(keyPair.privateKey);
        publicKey = await jose.exportSPKI(keyPair.publicKey);
        keyIdSource = publicKey;
      } else if (algorithm === 'ES256' || algorithm === 'ES384') {
        const curve = algorithm === 'ES256' ? 'P-256' :
          algorithm === 'ES384' ? 'P-384' : 'P-521';
        keyPair = await jose.generateKeyPair(algorithm, { crv: curve, ...options });
        // FINAL CORRECTION: Export EC keys to JWK format as strings to avoid Deno runtime bug
        privateKey = JSON.stringify(await jose.exportJWK(keyPair.privateKey));
        publicKey = JSON.stringify(await jose.exportJWK(keyPair.publicKey));
        keyIdSource = publicKey; // keyId can be derived from the JWK string
      } else if (algorithm === 'ES512') {
        throw new KeyManagementError(`Algorithm ${algorithm} is not supported due to Deno runtime limitations on P-521 curve export.`);
      } else {
        throw new KeyManagementError(`Unsupported algorithm: ${algorithm}`);
      }

      const keyId = bytesToHex(sha256(new TextEncoder().encode(keyIdSource))).substring(0, 8);

      return {
        privateKey,
        publicKey,
        algorithm,
        keyId,
        _privateCryptoKey: keyPair.privateKey,
        _publicCryptoKey: keyPair.publicKey,
      };
    } catch (error) {
      if (error instanceof KeyManagementError) throw error;
      throw new KeyManagementError('Failed to generate key pair', { cause: error });
    }
  }

  async validateKeyConfig(keyConfig: JWTKeyConfig): Promise<boolean> {
    try {
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
    public verifier: IJWTVerifier = new JOSEJWTVerifier(),
    private keyManager: IJWTKeyManager = new JOSEJWTKeyManager()
  ) { }

  signMerchantAuthorization(
    payload: Omit<MerchantAuthorizationPayload, 'iat' | 'exp' | 'jti'>,
    options: JWTSignOptions
  ): Promise<string> {
    return this.signer.signMerchantAuthorization(payload, options);
  }

  verifyMerchantAuthorization(
    jwt: string,
    options: JWTVerifyOptions
  ): Promise<JWTVerificationResult> {
    return this.verifier.verifyMerchantAuthorization(jwt, options);
  }

  generateJTI(): string {
    const randomBytes = crypto.getRandomValues(new Uint8Array(16));
    return bytesToHex(randomBytes);
  }

  async computeCartHash(cartContents: unknown): Promise<string> {
    const cartHash = await defaultChecksumValidator.computeRobustCartHash(cartContents);
    return cartHash;
  }

  generateKeyPair(algorithm: JWTAlgorithm): Promise<JWTKeyConfig> {
    return this.keyManager.generateKeyPair(algorithm);
  }

  validateKeyConfig(keyConfig: JWTKeyConfig): Promise<boolean> {
    return this.keyManager.validateKeyConfig(keyConfig);
  }
}

// Export default instance
export const jwtService = new JOSEJWTService();